'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import { ALLOWED_TRANSITIONS } from '../produktionen-utils'
import type {
  Produktion,
  ProduktionInsert,
  ProduktionUpdate,
  ProduktionStatus,
  Auffuehrungsserie,
  AuffuehrungsserieInsert,
  AuffuehrungsserieUpdate,
  Serienauffuehrung,
  SerienauffuehrungUpdate,
  AuffuehrungsTyp,
} from '../supabase/types'

// =============================================================================
// Produktionen
// =============================================================================

export async function getProduktionen(): Promise<Produktion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('produktionen')
    .select('id, titel, beschreibung, stueck_id, status, saison, proben_start, premiere, derniere, produktionsleitung_id, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching produktionen:', error)
    return []
  }

  return (data as Produktion[]) || []
}

export async function getAktiveProduktionen(): Promise<Produktion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('produktionen')
    .select('id, titel, beschreibung, stueck_id, status, saison, proben_start, premiere, derniere, produktionsleitung_id, created_at, updated_at')
    .not('status', 'in', '("abgeschlossen","abgesagt")')
    .order('premiere', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching active produktionen:', error)
    return []
  }

  return (data as Produktion[]) || []
}

export async function getAktuelleProduktionFuerDashboard(): Promise<{
  produktion: Produktion | null
  probenStats: { total: number; absolviert: number } | null
  besetzungStats: { total: number; besetzt: number } | null
  naechsteTermine: { id: string; titel: string; datum: string; typ: string }[]
}> {
  const supabase = await createClient()

  // Find the current production: laufend > premiere > proben > casting > planung
  const { data: produktionen } = await supabase
    .from('produktionen')
    .select('id, titel, beschreibung, stueck_id, status, saison, proben_start, premiere, derniere, produktionsleitung_id, created_at, updated_at')
    .not('status', 'in', '("abgeschlossen","abgesagt","draft")')
    .order('premiere', { ascending: true, nullsFirst: false })
    .limit(5)

  if (!produktionen || produktionen.length === 0) {
    return {
      produktion: null,
      probenStats: null,
      besetzungStats: null,
      naechsteTermine: [],
    }
  }

  // Prioritize by status
  const statusPriority: Record<ProduktionStatus, number> = {
    laufend: 1,
    premiere: 2,
    proben: 3,
    casting: 4,
    planung: 5,
    draft: 6,
    abgeschlossen: 7,
    abgesagt: 8,
  }

  const sorted = ([...produktionen] as Produktion[]).sort(
    (a, b) =>
      statusPriority[a.status as ProduktionStatus] -
      statusPriority[b.status as ProduktionStatus]
  )
  const produktion = sorted[0]

  // Fetch stats for this production
  let probenStats: { total: number; absolviert: number } | null = null
  let besetzungStats: { total: number; besetzt: number } | null = null

  if (produktion.stueck_id) {
    // Get probe stats
    const { data: proben } = await supabase
      .from('proben')
      .select('id, status')
      .eq('stueck_id', produktion.stueck_id)

    if (proben && proben.length > 0) {
      probenStats = {
        total: proben.length,
        absolviert: proben.filter((p) => p.status === 'abgeschlossen').length,
      }
    }

    // Get besetzung stats
    const { data: besetzungen } = await supabase
      .from('produktions_besetzungen')
      .select('id, status')
      .eq('produktion_id', produktion.id)

    if (besetzungen && besetzungen.length > 0) {
      besetzungStats = {
        total: besetzungen.length,
        besetzt: besetzungen.filter((b) => b.status === 'besetzt').length,
      }
    }
  }

  // Get upcoming events for this production
  const today = new Date().toISOString().split('T')[0]
  const naechsteTermine: { id: string; titel: string; datum: string; typ: string }[] = []

  // Check for veranstaltungen linked via serienauffuehrungen
  const { data: serien } = await supabase
    .from('auffuehrungsserien')
    .select('id')
    .eq('produktion_id', produktion.id)

  if (serien && serien.length > 0) {
    const serieIds = serien.map((s) => s.id)
    const { data: auffuehrungen } = await supabase
      .from('serienauffuehrungen')
      .select('id, datum, startzeit, typ, veranstaltung_id')
      .in('serie_id', serieIds)
      .gte('datum', today)
      .order('datum', { ascending: true })
      .limit(5)

    if (auffuehrungen) {
      for (const auff of auffuehrungen) {
        naechsteTermine.push({
          id: auff.veranstaltung_id || auff.id,
          titel: produktion.titel,
          datum: auff.datum,
          typ: auff.typ || 'auffuehrung',
        })
      }
    }
  }

  return {
    produktion,
    probenStats,
    besetzungStats,
    naechsteTermine,
  }
}

export async function getProduktion(id: string): Promise<Produktion | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('produktionen')
    .select('id, titel, beschreibung, stueck_id, status, saison, proben_start, premiere, derniere, produktionsleitung_id, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching produktion:', error)
    return null
  }

  return data as Produktion
}

export async function createProduktion(
  data: ProduktionInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Produktionen erstellen.',
    }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('produktionen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating produktion:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  return { success: true, id: result?.id }
}

export async function updateProduktion(
  id: string,
  data: ProduktionUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Produktionen bearbeiten.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('produktionen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating produktion:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  revalidatePath(`/produktionen/${id}`)
  return { success: true }
}

export async function deleteProduktion(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:delete')) {
    return {
      success: false,
      error:
        'Keine Berechtigung. Nur Administratoren können Produktionen löschen.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('produktionen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting produktion:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  return { success: true }
}

export async function updateProduktionStatus(
  id: string,
  newStatus: ProduktionStatus
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung.',
    }
  }

  // Fetch current status
  const produktion = await getProduktion(id)
  if (!produktion) {
    return { success: false, error: 'Produktion nicht gefunden.' }
  }

  // Validate transition
  const allowed = ALLOWED_TRANSITIONS[produktion.status]
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Status-Übergang von "${produktion.status}" zu "${newStatus}" ist nicht erlaubt.`,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('produktionen')
    .update({ status: newStatus } as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating produktion status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  revalidatePath(`/produktionen/${id}`)
  return { success: true }
}

// =============================================================================
// Aufführungsserien
// =============================================================================

export async function getSerien(
  produktionId: string
): Promise<Auffuehrungsserie[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('auffuehrungsserien')
    .select('id, produktion_id, name, beschreibung, status, standard_ort, standard_startzeit, template_id, stueck_id, datum_von, datum_bis, created_at, updated_at')
    .eq('produktion_id', produktionId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching serien:', error)
    return []
  }

  return (data as Auffuehrungsserie[]) || []
}

export async function getSerie(
  id: string
): Promise<Auffuehrungsserie | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('auffuehrungsserien')
    .select('id, produktion_id, name, beschreibung, status, standard_ort, standard_startzeit, template_id, stueck_id, datum_von, datum_bis, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching serie:', error)
    return null
  }

  return data as Auffuehrungsserie
}

export async function createSerie(
  data: AuffuehrungsserieInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung.',
    }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('auffuehrungsserien')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating serie:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${data.produktion_id}`)
  return { success: true, id: result?.id }
}

export async function updateSerie(
  id: string,
  data: AuffuehrungsserieUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung.',
    }
  }

  const supabase = await createClient()

  const serie = await getSerie(id)
  const produktionId = serie?.produktion_id

  const { error } = await supabase
    .from('auffuehrungsserien')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating serie:', error)
    return { success: false, error: error.message }
  }

  if (produktionId) {
    revalidatePath(`/produktionen/${produktionId}`)
  }
  return { success: true }
}

export async function deleteSerie(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung.',
    }
  }

  const serie = await getSerie(id)
  const produktionId = serie?.produktion_id

  const supabase = await createClient()
  const { error } = await supabase.rpc(
    'delete_serie_with_veranstaltungen' as never,
    { p_serie_id: id } as never
  )

  if (error) {
    console.error('Error deleting serie:', error)
    return { success: false, error: error.message }
  }

  if (produktionId) {
    revalidatePath(`/produktionen/${produktionId}`)
  }
  revalidatePath('/auffuehrungen')
  return { success: true }
}

// =============================================================================
// Serienaufführungen
// =============================================================================

export async function getSerienAuffuehrungen(
  serieId: string
): Promise<Serienauffuehrung[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('serienauffuehrungen')
    .select('id, serie_id, veranstaltung_id, datum, startzeit, ort, typ, ist_ausnahme, notizen, created_at, updated_at')
    .eq('serie_id', serieId)
    .order('datum', { ascending: true })

  if (error) {
    console.error('Error fetching serienauffuehrungen:', error)
    return []
  }

  return (data as Serienauffuehrung[]) || []
}

export async function getAllAuffuehrungenForProduktion(
  produktionId: string
): Promise<Record<string, Serienauffuehrung[]>> {
  const supabase = await createClient()

  // Fetch all serien for this produktion
  const { data: serien } = await supabase
    .from('auffuehrungsserien')
    .select('id')
    .eq('produktion_id', produktionId)

  if (!serien || serien.length === 0) {
    return {}
  }

  const serieIds = serien.map((s) => s.id)

  // Fetch all auffuehrungen for these serien
  const { data, error } = await supabase
    .from('serienauffuehrungen')
    .select('id, serie_id, veranstaltung_id, datum, startzeit, ort, typ, ist_ausnahme, notizen, created_at, updated_at')
    .in('serie_id', serieIds)
    .order('datum', { ascending: true })

  if (error) {
    console.error('Error fetching all serienauffuehrungen:', error)
    return {}
  }

  // Group by serie_id
  const grouped: Record<string, Serienauffuehrung[]> = {}
  for (const auff of (data as Serienauffuehrung[]) || []) {
    if (!grouped[auff.serie_id]) {
      grouped[auff.serie_id] = []
    }
    grouped[auff.serie_id].push(auff)
  }

  return grouped
}

export async function generiereAuffuehrungen(
  serieId: string,
  termine: { datum: string; startzeit?: string; typ?: AuffuehrungsTyp }[]
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  if (termine.length > 100) {
    return {
      success: false,
      error: 'Maximal 100 Aufführungen pro Anfrage.',
    }
  }

  const serie = await getSerie(serieId)
  if (!serie) {
    return { success: false, error: 'Serie nicht gefunden.' }
  }

  // Fetch produktion titel for veranstaltung naming
  const supabase = await createClient()
  const { data: produktion } = await supabase
    .from('produktionen')
    .select('titel')
    .eq('id', serie.produktion_id)
    .single()

  const produktionTitel = produktion?.titel ?? 'Aufführung'

  const termineJsonb = termine.map((t) => ({
    datum: t.datum,
    startzeit: t.startzeit || serie.standard_startzeit || null,
    ort: serie.standard_ort || null,
    typ: t.typ || 'regulaer',
  }))

  const { data, error } = await supabase.rpc(
    'generate_serienauffuehrungen_with_veranstaltungen' as never,
    {
      p_serie_id: serieId,
      p_produktion_titel: produktionTitel,
      p_termine: termineJsonb,
    } as never
  )

  if (error) {
    console.error('Error generating auffuehrungen:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${serie.produktion_id}`)
  revalidatePath('/auffuehrungen')
  return { success: true, count: (data as unknown[])?.length ?? termine.length }
}

export async function generiereAuffuehrungenWiederholung(
  serieId: string,
  config: {
    startDatum: string
    endDatum: string
    wochentage: number[]
    startzeit?: string
    ausnahmen?: string[]
  }
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  // Generate dates
  const termine: { datum: string; startzeit?: string }[] = []
  const ausnahmenSet = new Set(config.ausnahmen || [])
  const current = new Date(config.startDatum)
  const end = new Date(config.endDatum)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    const dateStr = current.toISOString().split('T')[0]

    if (config.wochentage.includes(dayOfWeek) && !ausnahmenSet.has(dateStr)) {
      termine.push({
        datum: dateStr,
        startzeit: config.startzeit,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  if (termine.length === 0) {
    return { success: false, error: 'Keine Termine im angegebenen Zeitraum.' }
  }

  if (termine.length > 100) {
    return {
      success: false,
      error: `Zu viele Termine (${termine.length}). Maximal 100 erlaubt.`,
    }
  }

  return generiereAuffuehrungen(serieId, termine)
}

export async function updateSerienauffuehrung(
  id: string,
  data: SerienauffuehrungUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('serienauffuehrungen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating serienauffuehrung:', error)
    return { success: false, error: error.message }
  }

  // Sync changes to linked veranstaltung if it exists
  if (data.datum || data.startzeit || data.ort) {
    const { data: sa } = await supabase
      .from('serienauffuehrungen')
      .select('veranstaltung_id')
      .eq('id', id)
      .single()

    if (sa?.veranstaltung_id) {
      const veranstaltungUpdate: Record<string, unknown> = {}
      if (data.datum) veranstaltungUpdate.datum = data.datum
      if (data.startzeit) veranstaltungUpdate.startzeit = data.startzeit
      if (data.ort) veranstaltungUpdate.ort = data.ort

      const { error: vError } = await supabase
        .from('veranstaltungen')
        .update(veranstaltungUpdate as never)
        .eq('id', sa.veranstaltung_id)

      if (vError) {
        console.error('Error syncing veranstaltung:', vError)
      }
    }
  }

  revalidatePath('/auffuehrungen')
  return { success: true }
}

export async function deleteSerienauffuehrung(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc(
    'delete_serienauffuehrung_with_veranstaltung' as never,
    { p_serienauffuehrung_id: id } as never
  )

  if (error) {
    console.error('Error deleting serienauffuehrung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/auffuehrungen')
  return { success: true }
}

// =============================================================================
// Reverse Lookup: Veranstaltung → Produktion
// =============================================================================

export async function getProduktionForVeranstaltung(
  veranstaltungId: string
): Promise<{
  produktion: { id: string; titel: string }
  serieName: string
} | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('serienauffuehrungen')
    .select(
      'serie_id, auffuehrungsserien(id, name, produktion_id, produktionen(id, titel))'
    )
    .eq('veranstaltung_id', veranstaltungId)
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  const serie = data.auffuehrungsserien as unknown as {
    id: string
    name: string
    produktion_id: string
    produktionen: { id: string; titel: string }
  }

  if (!serie?.produktionen) {
    return null
  }

  return {
    produktion: { id: serie.produktionen.id, titel: serie.produktionen.titel },
    serieName: serie.name,
  }
}
