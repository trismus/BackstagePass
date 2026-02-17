'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission, isManagement } from '../supabase/auth-helpers'
import type {
  Probe,
  ProbeInsert,
  ProbeUpdate,
  ProbeMitDetails,
  KommendeProbe,
  MeineProbe,
  ProbeSzene,
  ProbeSzeneInsert,
  ProbeTeilnehmer,
  ProbeTeilnehmerInsert,
  ProbeTeilnehmerUpdate,
  TeilnehmerStatus,
  Szene,
  TeilnehmerSuggestionResult,
  TeilnehmerVorschlag,
  VerfuegbarkeitStatus,
  OptimalProbeTermin,
} from '../supabase/types'
import { checkPersonConflicts } from './conflict-check'
import { checkMultipleMembersAvailability } from './verfuegbarkeiten'

// =============================================================================
// Proben CRUD
// =============================================================================

/**
 * Get all Proben for a Stück
 */
export async function getProbenForStueck(stueckId: string): Promise<Probe[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proben')
    .select('id, stueck_id, titel, beschreibung, datum, startzeit, endzeit, ort, status, notizen, created_at, updated_at')
    .eq('stueck_id', stueckId)
    .order('datum', { ascending: true })
    .order('startzeit', { ascending: true })

  if (error) {
    console.error('Error fetching proben:', error)
    return []
  }

  return (data as Probe[]) || []
}

/**
 * Get kommende Proben (from view)
 */
export async function getKommendeProben(
  limit?: number
): Promise<KommendeProbe[]> {
  const supabase = await createClient()
  let query = supabase.from('kommende_proben').select('*')

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching kommende proben:', error)
    return []
  }

  return (data as KommendeProbe[]) || []
}

/**
 * Get a single Probe with details
 */
export async function getProbe(id: string): Promise<ProbeMitDetails | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proben')
    .select(
      `
      *,
      stueck:stuecke(id, titel),
      szenen:proben_szenen(
        *,
        szene:szenen(id, nummer, titel)
      ),
      teilnehmer:proben_teilnehmer(
        *,
        person:personen(id, vorname, nachname, email)
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching probe:', error)
    return null
  }

  return data as ProbeMitDetails
}

/**
 * Create a new Probe
 */
export async function createProbe(
  data: ProbeInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Proben erstellen.',
    }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('proben')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating probe:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stuecke/${data.stueck_id}`)
  revalidatePath('/proben')
  return { success: true, id: result?.id }
}

/**
 * Update an existing Probe
 */
export async function updateProbe(
  id: string,
  data: ProbeUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Proben bearbeiten.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const probe = await getProbeBasic(id)

  const { error } = await supabase
    .from('proben')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating probe:', error)
    return { success: false, error: error.message }
  }

  if (probe?.stueck_id) {
    revalidatePath(`/stuecke/${probe.stueck_id}`)
  }
  revalidatePath(`/proben/${id}`)
  revalidatePath('/proben')
  return { success: true }
}

/**
 * Delete a Probe
 */
export async function deleteProbe(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Proben löschen.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const probe = await getProbeBasic(id)

  const { error } = await supabase.from('proben').delete().eq('id', id)

  if (error) {
    console.error('Error deleting probe:', error)
    return { success: false, error: error.message }
  }

  if (probe?.stueck_id) {
    revalidatePath(`/stuecke/${probe.stueck_id}`)
  }
  revalidatePath('/proben')
  return { success: true }
}

/**
 * Get basic probe info (helper)
 */
async function getProbeBasic(id: string): Promise<Probe | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proben')
    .select('id, stueck_id, titel, beschreibung, datum, startzeit, endzeit, ort, status, notizen, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Probe
}

/**
 * Get upcoming Proben for a person (Dashboard widget)
 */
export async function getMeineProben(personId: string): Promise<MeineProbe[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('proben_teilnehmer')
    .select(`
      id,
      status,
      probe:proben(id, titel, datum, startzeit, endzeit, ort,
        stueck:stuecke(titel)
      )
    `)
    .eq('person_id', personId)
    .in('status', ['eingeladen', 'zugesagt'])

  if (error) {
    console.error('Error fetching meine proben:', error)
    return []
  }

  if (!data) return []

  // Filter for future proben, map to flat structure
  const result: MeineProbe[] = []
  for (const row of data) {
    const probe = row.probe as unknown as {
      id: string
      titel: string
      datum: string
      startzeit: string | null
      endzeit: string | null
      ort: string | null
      stueck: { titel: string } | null
    } | null
    if (!probe || probe.datum < today) continue
    result.push({
      id: row.id,
      probe_id: probe.id,
      titel: probe.titel,
      stueck_titel: probe.stueck?.titel ?? null,
      datum: probe.datum,
      startzeit: probe.startzeit,
      endzeit: probe.endzeit,
      ort: probe.ort,
      status: row.status as TeilnehmerStatus,
    })
  }

  // Sort by datum ascending, limit 5
  result.sort((a, b) => a.datum.localeCompare(b.datum))
  return result.slice(0, 5)
}

// =============================================================================
// Proben-Szenen
// =============================================================================

/**
 * Add Szene to Probe
 */
export async function addSzeneToProbe(
  data: ProbeSzeneInsert
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Szenen zuweisen.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('proben_szenen').insert(data as never)

  if (error) {
    console.error('Error adding szene to probe:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/proben/${data.probe_id}`)
  return { success: true }
}

/**
 * Remove Szene from Probe
 */
export async function removeSzeneFromProbe(
  probeId: string,
  szeneId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Szenen entfernen.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('proben_szenen')
    .delete()
    .eq('probe_id', probeId)
    .eq('szene_id', szeneId)

  if (error) {
    console.error('Error removing szene from probe:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/proben/${probeId}`)
  return { success: true }
}

/**
 * Update Szenen for a Probe (replace all)
 */
export async function updateProbeSzenen(
  probeId: string,
  szenenIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Szenen bearbeiten.',
    }
  }

  const supabase = await createClient()

  // Delete all existing
  const { error: deleteError } = await supabase
    .from('proben_szenen')
    .delete()
    .eq('probe_id', probeId)

  if (deleteError) {
    console.error('Error deleting proben_szenen:', deleteError)
    return { success: false, error: deleteError.message }
  }

  // Insert new
  if (szenenIds.length > 0) {
    const inserts = szenenIds.map((szeneId, index) => ({
      probe_id: probeId,
      szene_id: szeneId,
      reihenfolge: index + 1,
    }))

    const { error: insertError } = await supabase
      .from('proben_szenen')
      .insert(inserts as never)

    if (insertError) {
      console.error('Error inserting proben_szenen:', insertError)
      return { success: false, error: insertError.message }
    }
  }

  revalidatePath(`/proben/${probeId}`)
  return { success: true }
}

// =============================================================================
// Proben-Teilnehmer
// =============================================================================

/**
 * Add Teilnehmer to Probe
 */
export async function addTeilnehmerToProbe(
  data: ProbeTeilnehmerInsert
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Teilnehmer hinzufügen.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('proben_teilnehmer')
    .insert(data as never)

  if (error) {
    console.error('Error adding teilnehmer to probe:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/proben/${data.probe_id}`)
  return { success: true }
}

/**
 * Remove Teilnehmer from Probe
 */
export async function removeTeilnehmerFromProbe(
  probeId: string,
  personId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Teilnehmer entfernen.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('proben_teilnehmer')
    .delete()
    .eq('probe_id', probeId)
    .eq('person_id', personId)

  if (error) {
    console.error('Error removing teilnehmer from probe:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/proben/${probeId}`)
  return { success: true }
}

/**
 * Update Teilnehmer status
 * Note: Members can update their own status via RLS policy
 */
export async function updateTeilnehmerStatus(
  probeId: string,
  personId: string,
  status: TeilnehmerStatus,
  notizen?: string,
  absageGrund?: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return {
      success: false,
      error: 'Nicht angemeldet.',
    }
  }

  const supabase = await createClient()

  const updateData: ProbeTeilnehmerUpdate = { status }
  if (notizen !== undefined) {
    updateData.notizen = notizen
  }
  if (absageGrund !== undefined) {
    updateData.absage_grund = absageGrund
  }

  const { error } = await supabase
    .from('proben_teilnehmer')
    .update(updateData as never)
    .eq('probe_id', probeId)
    .eq('person_id', personId)

  if (error) {
    console.error('Error updating teilnehmer status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/proben/${probeId}`)
  return { success: true }
}

/**
 * Auto-invite participants to a Probe based on cast
 * Uses the database function auto_invite_probe_teilnehmer
 */
export async function autoInviteProbeTeilnehmer(
  probeId: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Teilnehmer einladen.',
    }
  }

  const supabase = await createClient()

  // Call the database function
  const { data, error } = await supabase.rpc('auto_invite_probe_teilnehmer', {
    probe_uuid: probeId,
  })

  if (error) {
    console.error('Error auto-inviting teilnehmer:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/proben/${probeId}`)
  return { success: true, count: data || 0 }
}

/**
 * Generate Teilnehmer from Besetzungen
 */
export async function generateTeilnehmerFromBesetzungen(
  probeId: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Teilnehmer generieren.',
    }
  }

  const supabase = await createClient()

  // Call the database function
  const { error } = await supabase.rpc('generate_probe_teilnehmer', {
    probe_uuid: probeId,
  })

  if (error) {
    console.error('Error generating teilnehmer:', error)
    return { success: false, error: error.message }
  }

  // Count how many were added
  const { count } = await supabase
    .from('proben_teilnehmer')
    .select('*', { count: 'exact', head: true })
    .eq('probe_id', probeId)

  revalidatePath(`/proben/${probeId}`)
  return { success: true, count: count || 0 }
}

/**
 * Get Szenen for a Probe
 */
export async function getProbeSzenen(
  probeId: string
): Promise<
  (ProbeSzene & {
    szene: Pick<Szene, 'id' | 'nummer' | 'titel' | 'dauer_minuten'>
  })[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proben_szenen')
    .select(
      `
      *,
      szene:szenen(id, nummer, titel, dauer_minuten)
    `
    )
    .eq('probe_id', probeId)
    .order('reihenfolge', { ascending: true })

  if (error) {
    console.error('Error fetching probe szenen:', error)
    return []
  }

  type ProbeSzeneMitDetails = ProbeSzene & {
    szene: Pick<Szene, 'id' | 'nummer' | 'titel' | 'dauer_minuten'>
  }
  return (data as unknown as ProbeSzeneMitDetails[]) || []
}

/**
 * Get Teilnehmer for a Probe
 */
export async function getProbeTeilnehmer(
  probeId: string
): Promise<
  (ProbeTeilnehmer & {
    person: {
      id: string
      vorname: string
      nachname: string
      email: string | null
    }
  })[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proben_teilnehmer')
    .select(
      `
      *,
      person:personen(id, vorname, nachname, email)
    `
    )
    .eq('probe_id', probeId)
    .order('status', { ascending: true })

  if (error) {
    console.error('Error fetching probe teilnehmer:', error)
    return []
  }

  type TeilnehmerMitPerson = ProbeTeilnehmer & {
    person: { id: string; vorname: string; nachname: string; email: string | null }
  }
  return (data as unknown as TeilnehmerMitPerson[]) || []
}

// =============================================================================
// Proben-Teilnehmer Suggestion (Issue #345)
// =============================================================================

/**
 * Suggest Teilnehmer from Besetzungen (preview, no insert)
 * Falls back to all cast if no scenes assigned
 */
export async function suggestProbenTeilnehmer(
  probeId: string
): Promise<{ success: boolean; error?: string; data?: TeilnehmerSuggestionResult }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Vorschläge generieren.',
    }
  }

  const supabase = await createClient()

  // 1. Load probe
  const { data: probe, error: probeError } = await supabase
    .from('proben')
    .select('id, stueck_id, datum, startzeit, endzeit')
    .eq('id', probeId)
    .single()

  if (probeError || !probe) {
    return { success: false, error: 'Probe nicht gefunden.' }
  }

  // 2. Load proben_szenen
  const { data: probenSzenen } = await supabase
    .from('proben_szenen')
    .select('szene_id')
    .eq('probe_id', probeId)

  const szeneIds = (probenSzenen || []).map((ps: { szene_id: string }) => ps.szene_id)
  const hasSzenen = szeneIds.length > 0

  // 3. Get rolle_ids based on scene assignment
  let rolleIds: string[] = []

  if (hasSzenen) {
    // From szenen_rollen for assigned scenes
    const { data: szenenRollen } = await supabase
      .from('szenen_rollen')
      .select('rolle_id')
      .in('szene_id', szeneIds)

    rolleIds = [...new Set((szenenRollen || []).map((sr: { rolle_id: string }) => sr.rolle_id))]
  } else {
    // Fallback: all roles for this Stück
    const { data: rollen } = await supabase
      .from('rollen')
      .select('id')
      .eq('stueck_id', probe.stueck_id)

    rolleIds = (rollen || []).map((r: { id: string }) => r.id)
  }

  if (rolleIds.length === 0) {
    return {
      success: true,
      data: {
        vorschlaege: [],
        quelle: hasSzenen ? 'szenen' : 'alle_besetzungen',
        stats: { total_vorgeschlagen: 0, total_bereits_vorhanden: 0, total_mit_konflikten: 0 },
      },
    }
  }

  // 4. Get besetzungen for these roles (active only)
  const today = new Date().toISOString().split('T')[0]
  const { data: besetzungen } = await supabase
    .from('besetzungen')
    .select('person_id, rolle_id')
    .in('rolle_id', rolleIds)
    .or(`gueltig_bis.is.null,gueltig_bis.gte.${today}`)

  if (!besetzungen || besetzungen.length === 0) {
    return {
      success: true,
      data: {
        vorschlaege: [],
        quelle: hasSzenen ? 'szenen' : 'alle_besetzungen',
        stats: { total_vorgeschlagen: 0, total_bereits_vorhanden: 0, total_mit_konflikten: 0 },
      },
    }
  }

  // 5. Get unique person IDs and their rolle_ids
  const personRollenMap = new Map<string, Set<string>>()
  for (const b of besetzungen) {
    if (!personRollenMap.has(b.person_id)) {
      personRollenMap.set(b.person_id, new Set())
    }
    personRollenMap.get(b.person_id)!.add(b.rolle_id)
  }

  const personIds = [...personRollenMap.keys()]

  // 6. Load person names
  const { data: personen } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .in('id', personIds)

  const personNameMap = new Map<string, string>()
  for (const p of personen || []) {
    personNameMap.set(p.id, `${p.vorname} ${p.nachname}`)
  }

  // 7. Load rolle names
  const { data: rollen } = await supabase
    .from('rollen')
    .select('id, name')
    .in('id', rolleIds)

  const rolleNameMap = new Map<string, string>()
  for (const r of rollen || []) {
    rolleNameMap.set(r.id, r.name)
  }

  // 8. Check existing teilnehmer
  const { data: existingTeilnehmer } = await supabase
    .from('proben_teilnehmer')
    .select('person_id')
    .eq('probe_id', probeId)

  const existingPersonIds = new Set(
    (existingTeilnehmer || []).map((t: { person_id: string }) => t.person_id)
  )

  // 9. Build suggestions with conflict checks
  const hasTimeInfo = !!(probe.startzeit && probe.endzeit)
  const vorschlaege: TeilnehmerVorschlag[] = []

  for (const personId of personIds) {
    const rolleIdsForPerson = personRollenMap.get(personId)!
    const rollenNames = [...rolleIdsForPerson]
      .map((rid) => rolleNameMap.get(rid) || 'Unbekannt')
      .sort()

    const bereitsVorhanden = existingPersonIds.has(personId)

    // Conflict check (skip if no time info or already present)
    let konflikte: TeilnehmerVorschlag['konflikte'] = []
    if (hasTimeInfo && !bereitsVorhanden && personIds.length <= 50) {
      try {
        const startTimestamp = `${probe.datum}T${probe.startzeit}`
        const endTimestamp = `${probe.datum}T${probe.endzeit}`
        const result = await checkPersonConflicts(personId, startTimestamp, endTimestamp)
        konflikte = result.conflicts
      } catch {
        // Ignore conflict check errors
      }
    }

    vorschlaege.push({
      person_id: personId,
      person_name: personNameMap.get(personId) || 'Unbekannt',
      rollen: rollenNames,
      bereits_vorhanden: bereitsVorhanden,
      konflikte,
    })
  }

  // Sort: non-existing first, then alphabetically
  vorschlaege.sort((a, b) => {
    if (a.bereits_vorhanden !== b.bereits_vorhanden) {
      return a.bereits_vorhanden ? 1 : -1
    }
    return a.person_name.localeCompare(b.person_name, 'de')
  })

  const stats = {
    total_vorgeschlagen: vorschlaege.filter((v) => !v.bereits_vorhanden).length,
    total_bereits_vorhanden: vorschlaege.filter((v) => v.bereits_vorhanden).length,
    total_mit_konflikten: vorschlaege.filter((v) => v.konflikte.length > 0).length,
  }

  return {
    success: true,
    data: {
      vorschlaege,
      quelle: hasSzenen ? 'szenen' : 'alle_besetzungen',
      stats,
    },
  }
}

/**
 * Confirm selected Teilnehmer suggestions (batch insert)
 */
export async function confirmProbenTeilnehmer(
  probeId: string,
  personIds: string[]
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Teilnehmer einladen.',
    }
  }

  if (personIds.length === 0) {
    return { success: false, error: 'Keine Teilnehmer ausgewählt.' }
  }

  const supabase = await createClient()

  const inserts = personIds.map((personId) => ({
    probe_id: probeId,
    person_id: personId,
    status: 'eingeladen' as const,
  }))

  const { error } = await supabase
    .from('proben_teilnehmer')
    .upsert(inserts as never, { onConflict: 'probe_id,person_id', ignoreDuplicates: true })

  if (error) {
    console.error('Error confirming teilnehmer:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/proben/${probeId}`)
  return { success: true, count: personIds.length }
}

// =============================================================================
// Statistiken
// =============================================================================

/**
 * Get Probe statistics for a Stück
 */
export async function getProbenStatistik(stueckId: string): Promise<{
  total: number
  geplant: number
  abgeschlossen: number
  abgesagt: number
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proben')
    .select('status')
    .eq('stueck_id', stueckId)

  if (error) {
    console.error('Error fetching proben statistik:', error)
    return { total: 0, geplant: 0, abgeschlossen: 0, abgesagt: 0 }
  }

  const proben = data || []
  return {
    total: proben.length,
    geplant: proben.filter(
      (p) => p.status === 'geplant' || p.status === 'bestaetigt'
    ).length,
    abgeschlossen: proben.filter((p) => p.status === 'abgeschlossen').length,
    abgesagt: proben.filter((p) => p.status === 'abgesagt').length,
  }
}

// =============================================================================
// Probe Verfügbarkeits-Check (Issue #350)
// =============================================================================

export async function checkProbeVerfuegbarkeit(
  stueckId: string,
  datum: string,
  szenenIds?: string[]
): Promise<{
  warnings: {
    personId: string
    personName: string
    status: VerfuegbarkeitStatus
    grund: string | null
  }[]
}> {
  const supabase = await createClient()

  // Get cast members for the stueck (or specific scenes)
  let besetzungenQuery = supabase
    .from('besetzungen')
    .select('person_id, rolle:rollen(stueck_id)')
    .not('person_id', 'is', null)

  if (szenenIds && szenenIds.length > 0) {
    const { data: szenenRollen } = await supabase
      .from('szenen_rollen')
      .select('rolle_id')
      .in('szene_id', szenenIds)
    if (szenenRollen && szenenRollen.length > 0) {
      const rolleIds = szenenRollen.map((sr) => sr.rolle_id)
      besetzungenQuery = besetzungenQuery.in('rolle_id', rolleIds)
    }
  }

  const { data: besetzungen } = await besetzungenQuery

  if (!besetzungen || besetzungen.length === 0) {
    return { warnings: [] }
  }

  // Filter to only this stueck's roles and get unique person IDs
  const personIds = [
    ...new Set(
      besetzungen
        .filter((b) => {
          const rolle = b.rolle as unknown as Record<string, unknown> | null
          return rolle?.stueck_id === stueckId
        })
        .map((b) => b.person_id as string)
    ),
  ]

  if (personIds.length === 0) return { warnings: [] }

  // Check availability for all on the given date
  const availabilityMap = await checkMultipleMembersAvailability(personIds, datum)

  // Get person names for warnings
  const unavailable = personIds.filter((id) => {
    const status = availabilityMap.get(id)
    return status === 'nicht_verfuegbar' || status === 'eingeschraenkt'
  })

  if (unavailable.length === 0) return { warnings: [] }

  const { data: personen } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .in('id', unavailable)

  // Get grund from verfuegbarkeiten
  const { data: verfEntries } = await supabase
    .from('verfuegbarkeiten')
    .select('mitglied_id, status, grund')
    .in('mitglied_id', unavailable)
    .lte('datum_von', datum)
    .gte('datum_bis', datum)

  const grundMap = new Map<string, string | null>()
  for (const v of verfEntries || []) {
    if (!grundMap.has(v.mitglied_id) || v.status === 'nicht_verfuegbar') {
      grundMap.set(v.mitglied_id, v.grund)
    }
  }

  const personMap = new Map(
    (personen || []).map((p) => [p.id, `${p.vorname} ${p.nachname}`])
  )

  const warnings = unavailable.map((id) => ({
    personId: id,
    personName: personMap.get(id) ?? 'Unbekannt',
    status: availabilityMap.get(id) ?? ('eingeschraenkt' as VerfuegbarkeitStatus),
    grund: grundMap.get(id) ?? null,
  }))

  return { warnings }
}

// =============================================================================
// Optimale Probe-Termine (Issue #350)
// =============================================================================

const WOCHENTAG_NAMEN = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

export async function suggestOptimalProbeTermin(
  stueckId: string,
  szenenIds: string[],
  von: string,
  bis: string
): Promise<OptimalProbeTermin[]> {
  const supabase = await createClient()

  // Get cast members
  let besetzungenQuery = supabase
    .from('besetzungen')
    .select('person_id, rolle:rollen(stueck_id, name)')
    .not('person_id', 'is', null)

  if (szenenIds.length > 0) {
    const { data: szenenRollen } = await supabase
      .from('szenen_rollen')
      .select('rolle_id')
      .in('szene_id', szenenIds)
    if (szenenRollen && szenenRollen.length > 0) {
      const rolleIds = szenenRollen.map((sr) => sr.rolle_id)
      besetzungenQuery = besetzungenQuery.in('rolle_id', rolleIds)
    }
  }

  const { data: besetzungen } = await besetzungenQuery

  const personIds = [
    ...new Set(
      (besetzungen || [])
        .filter((b) => {
          const rolle = b.rolle as unknown as Record<string, unknown> | null
          return rolle?.stueck_id === stueckId
        })
        .map((b) => b.person_id as string)
    ),
  ]

  if (personIds.length === 0) return []

  // Get person names for display
  const { data: personen } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .in('id', personIds)
  const personNameMap = new Map(
    (personen || []).map((p) => [p.id, `${p.vorname} ${p.nachname}`])
  )

  // Generate candidate dates (von → bis)
  const startDate = new Date(von)
  const endDate = new Date(bis)
  const termine: OptimalProbeTermin[] = []

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const datum = d.toISOString().split('T')[0]
    const wochentag = WOCHENTAG_NAMEN[d.getDay()]

    const availMap = await checkMultipleMembersAvailability(personIds, datum)

    let verfuegbareCount = 0
    let eingeschraenktCount = 0
    let nichtVerfuegbarCount = 0
    const nichtVerfuegbar: { personId: string; personName: string; grund: string | null }[] = []

    for (const pid of personIds) {
      const status = availMap.get(pid) ?? 'verfuegbar'
      if (status === 'verfuegbar') verfuegbareCount++
      else if (status === 'eingeschraenkt') eingeschraenktCount++
      else {
        nichtVerfuegbarCount++
        nichtVerfuegbar.push({
          personId: pid,
          personName: personNameMap.get(pid) ?? 'Unbekannt',
          grund: null,
        })
      }
    }

    termine.push({
      datum,
      wochentag,
      verfuegbareCount,
      eingeschraenktCount,
      nichtVerfuegbarCount,
      totalCast: personIds.length,
      verfuegbarkeitsProzent:
        personIds.length > 0
          ? Math.round((verfuegbareCount / personIds.length) * 100)
          : 100,
      nichtVerfuegbar,
    })
  }

  // Sort by highest availability
  return termine
    .sort((a, b) => b.verfuegbarkeitsProzent - a.verfuegbarkeitsProzent)
    .slice(0, 10)
}
