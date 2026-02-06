'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type {
  Stueck,
  StueckInsert,
  StueckUpdate,
  Szene,
  SzeneInsert,
  SzeneUpdate,
  StueckRolle,
  StueckRolleInsert,
  StueckRolleUpdate,
  SzeneRolle,
  SzeneRolleInsert,
} from '../supabase/types'

// =============================================================================
// Stücke
// =============================================================================

/**
 * Get all Stücke
 */
export async function getStuecke(): Promise<Stueck[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stuecke')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching stuecke:', error)
    return []
  }

  return (data as Stueck[]) || []
}

/**
 * Get active Stücke (not archived)
 */
export async function getActiveStuecke(): Promise<Stueck[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stuecke')
    .select('*')
    .neq('status', 'archiviert')
    .order('premiere_datum', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching active stuecke:', error)
    return []
  }

  return (data as Stueck[]) || []
}

/**
 * Get a single Stück by ID
 */
export async function getStueck(id: string): Promise<Stueck | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stuecke')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching stueck:', error)
    return null
  }

  return data as Stueck
}

/**
 * Create a new Stück
 */
export async function createStueck(
  data: StueckInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Stücke erstellen.',
    }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('stuecke')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating stueck:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/stuecke')
  return { success: true, id: result?.id }
}

/**
 * Update an existing Stück
 */
export async function updateStueck(
  id: string,
  data: StueckUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Stücke bearbeiten.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('stuecke')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating stueck:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/stuecke')
  revalidatePath(`/stuecke/${id}`)
  return { success: true }
}

/**
 * Delete a Stück
 */
export async function deleteStueck(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:delete')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Administratoren können Stücke löschen.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('stuecke').delete().eq('id', id)

  if (error) {
    console.error('Error deleting stueck:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/stuecke')
  return { success: true }
}

// =============================================================================
// Szenen
// =============================================================================

/**
 * Get all Szenen for a Stück
 */
export async function getSzenen(stueckId: string): Promise<Szene[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('szenen')
    .select('*')
    .eq('stueck_id', stueckId)
    .order('nummer', { ascending: true })

  if (error) {
    console.error('Error fetching szenen:', error)
    return []
  }

  return (data as Szene[]) || []
}

/**
 * Get a single Szene by ID
 */
export async function getSzene(id: string): Promise<Szene | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('szenen')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching szene:', error)
    return null
  }

  return data as Szene
}

/**
 * Create a new Szene
 */
export async function createSzene(
  data: SzeneInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Szenen erstellen.',
    }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('szenen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating szene:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stuecke/${data.stueck_id}`)
  return { success: true, id: result?.id }
}

/**
 * Update an existing Szene
 */
export async function updateSzene(
  id: string,
  data: SzeneUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Szenen bearbeiten.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const szene = await getSzene(id)
  const stueckId = szene?.stueck_id

  const { error } = await supabase
    .from('szenen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating szene:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

/**
 * Delete a Szene
 */
export async function deleteSzene(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Szenen löschen.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const szene = await getSzene(id)
  const stueckId = szene?.stueck_id

  const { error } = await supabase.from('szenen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting szene:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

/**
 * Get the next scene number for a Stück
 */
export async function getNextSzeneNummer(stueckId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('szenen')
    .select('nummer')
    .eq('stueck_id', stueckId)
    .order('nummer', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return 1
  }

  return (data[0].nummer as number) + 1
}

// =============================================================================
// Rollen (Theaterrollen)
// =============================================================================

/**
 * Get all Rollen for a Stück
 */
export async function getRollen(stueckId: string): Promise<StueckRolle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rollen')
    .select('*')
    .eq('stueck_id', stueckId)
    .order('typ', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching rollen:', error)
    return []
  }

  return (data as StueckRolle[]) || []
}

/**
 * Get a single Rolle by ID
 */
export async function getRolle(id: string): Promise<StueckRolle | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rollen')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching rolle:', error)
    return null
  }

  return data as StueckRolle
}

/**
 * Create a new Rolle
 */
export async function createRolle(
  data: StueckRolleInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Rollen erstellen.',
    }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('rollen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating rolle:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stuecke/${data.stueck_id}`)
  return { success: true, id: result?.id }
}

/**
 * Update an existing Rolle
 */
export async function updateRolle(
  id: string,
  data: StueckRolleUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Rollen bearbeiten.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const rolle = await getRolle(id)
  const stueckId = rolle?.stueck_id

  const { error } = await supabase
    .from('rollen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating rolle:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

/**
 * Delete a Rolle
 */
export async function deleteRolle(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Rollen löschen.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const rolle = await getRolle(id)
  const stueckId = rolle?.stueck_id

  const { error } = await supabase.from('rollen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting rolle:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

// =============================================================================
// Szenen-Rollen Verknüpfung
// =============================================================================

/**
 * Get all Szenen-Rollen assignments for a Stück
 */
export async function getSzenenRollen(stueckId: string): Promise<SzeneRolle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('szenen_rollen')
    .select(
      `
      *,
      szene:szenen!inner(stueck_id)
    `
    )
    .eq('szene.stueck_id', stueckId)

  if (error) {
    console.error('Error fetching szenen_rollen:', error)
    return []
  }

  return (data as SzeneRolle[]) || []
}

/**
 * Get Rollen for a specific Szene
 */
export async function getRollenForSzene(
  szeneId: string
): Promise<StueckRolle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('szenen_rollen')
    .select(
      `
      rolle:rollen(*)
    `
    )
    .eq('szene_id', szeneId)

  if (error) {
    console.error('Error fetching rollen for szene:', error)
    return []
  }

  type SzeneRolleWithRolle = { rolle: StueckRolle | null }
  return (
    (data as unknown as SzeneRolleWithRolle[])
      ?.map((d) => d.rolle)
      .filter((r): r is StueckRolle => r !== null) || []
  )
}

/**
 * Add a Rolle to a Szene
 */
export async function addRolleToSzene(
  data: SzeneRolleInsert
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Rollen zuweisen.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('szenen_rollen').insert(data as never)

  if (error) {
    console.error('Error adding rolle to szene:', error)
    return { success: false, error: error.message }
  }

  // Get stueck_id for revalidation
  const szene = await getSzene(data.szene_id)
  if (szene?.stueck_id) {
    revalidatePath(`/stuecke/${szene.stueck_id}`)
  }
  return { success: true }
}

/**
 * Remove a Rolle from a Szene
 */
export async function removeRolleFromSzene(
  szeneId: string,
  rolleId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Rollen entfernen.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const szene = await getSzene(szeneId)
  const stueckId = szene?.stueck_id

  const { error } = await supabase
    .from('szenen_rollen')
    .delete()
    .eq('szene_id', szeneId)
    .eq('rolle_id', rolleId)

  if (error) {
    console.error('Error removing rolle from szene:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

/**
 * Update all Rollen for a Szene (replace all assignments)
 */
export async function updateSzeneRollen(
  szeneId: string,
  rollenIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Rollen zuweisen.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const szene = await getSzene(szeneId)
  const stueckId = szene?.stueck_id

  // Delete all existing assignments
  const { error: deleteError } = await supabase
    .from('szenen_rollen')
    .delete()
    .eq('szene_id', szeneId)

  if (deleteError) {
    console.error('Error deleting szenen_rollen:', deleteError)
    return { success: false, error: deleteError.message }
  }

  // Insert new assignments
  if (rollenIds.length > 0) {
    const inserts = rollenIds.map((rolleId) => ({
      szene_id: szeneId,
      rolle_id: rolleId,
    }))

    const { error: insertError } = await supabase
      .from('szenen_rollen')
      .insert(inserts as never)

    if (insertError) {
      console.error('Error inserting szenen_rollen:', insertError)
      return { success: false, error: insertError.message }
    }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

// =============================================================================
// Downloads (Issue #193)
// =============================================================================

/**
 * Generate text content for a single Szene download
 */
export async function downloadSzene(
  szeneId: string
): Promise<{ success: boolean; content?: string; filename?: string; error?: string }> {
  const szene = await getSzene(szeneId)

  if (!szene) {
    return { success: false, error: 'Szene nicht gefunden' }
  }

  const stueck = await getStueck(szene.stueck_id)

  if (!stueck) {
    return { success: false, error: 'Stück nicht gefunden' }
  }

  const content = `${stueck.titel}
${stueck.autor ? `von ${stueck.autor}` : ''}

${'='.repeat(60)}

Szene ${szene.nummer}: ${szene.titel}
${szene.beschreibung ? `\n${szene.beschreibung}\n` : ''}
${szene.dauer_minuten ? `Dauer: ${szene.dauer_minuten} Minuten\n` : ''}
${'='.repeat(60)}

${szene.text || '(Noch kein Text vorhanden)'}
`

  const filename = `${stueck.titel.replace(/[^a-zA-Z0-9]/g, '_')}_Szene_${szene.nummer}.txt`

  return { success: true, content, filename }
}

/**
 * Generate text content for complete Stück download
 */
export async function downloadStueck(
  stueckId: string
): Promise<{ success: boolean; content?: string; filename?: string; error?: string }> {
  const stueck = await getStueck(stueckId)

  if (!stueck) {
    return { success: false, error: 'Stück nicht gefunden' }
  }

  const szenen = await getSzenen(stueckId)

  let content = `${stueck.titel}
${stueck.autor ? `von ${stueck.autor}` : ''}
${stueck.premiere_datum ? `\nPremiere: ${new Date(stueck.premiere_datum).toLocaleDateString('de-CH')}` : ''}

${stueck.beschreibung ? `\n${stueck.beschreibung}\n` : ''}
${'='.repeat(60)}

`

  for (const szene of szenen) {
    content += `
Szene ${szene.nummer}: ${szene.titel}
${szene.beschreibung ? `${szene.beschreibung}\n` : ''}
${szene.dauer_minuten ? `Dauer: ${szene.dauer_minuten} Minuten\n` : ''}
${'-'.repeat(60)}

${szene.text || '(Noch kein Text vorhanden)'}

${'='.repeat(60)}

`
  }

  const filename = `${stueck.titel.replace(/[^a-zA-Z0-9]/g, '_')}_Komplett.txt`

  return { success: true, content, filename }
}

/**
 * Generate text content for scenes of a specific rehearsal (Issue #193)
 * Allows actors to download only the scenes that will be rehearsed
 */
export async function downloadProbenSzenen(
  probeId: string
): Promise<{ success: boolean; content?: string; filename?: string; error?: string }> {
  const supabase = await createClient()

  // Get the probe with its scenes
  const { data: probe, error: probeError } = await supabase
    .from('proben')
    .select(`
      *,
      stueck:stuecke(id, titel, autor),
      proben_szenen(
        reihenfolge,
        szene:szenen(id, nummer, titel, beschreibung, text, dauer_minuten)
      )
    `)
    .eq('id', probeId)
    .single()

  if (probeError || !probe) {
    return { success: false, error: 'Probe nicht gefunden' }
  }

  type ProbeWithSzenen = {
    id: string
    titel: string
    datum: string
    startzeit: string | null
    ort: string | null
    stueck: { id: string; titel: string; autor: string | null } | null
    proben_szenen: Array<{
      reihenfolge: number | null
      szene: {
        id: string
        nummer: number
        titel: string
        beschreibung: string | null
        text: string | null
        dauer_minuten: number | null
      } | null
    }>
  }

  const typedProbe = probe as unknown as ProbeWithSzenen

  if (!typedProbe.stueck) {
    return { success: false, error: 'Stück nicht gefunden' }
  }

  // Sort scenes by reihenfolge, then by nummer
  const sortedSzenen = typedProbe.proben_szenen
    .filter((ps): ps is typeof ps & { szene: NonNullable<typeof ps.szene> } => ps.szene !== null)
    .sort((a, b) => {
      if (a.reihenfolge !== null && b.reihenfolge !== null) {
        return a.reihenfolge - b.reihenfolge
      }
      return a.szene.nummer - b.szene.nummer
    })

  if (sortedSzenen.length === 0) {
    return { success: false, error: 'Keine Szenen für diese Probe ausgewählt' }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  let content = `${typedProbe.stueck.titel}
${typedProbe.stueck.autor ? `von ${typedProbe.stueck.autor}` : ''}

${'='.repeat(60)}
PROBE: ${typedProbe.titel}
Datum: ${formatDate(typedProbe.datum)}
${typedProbe.startzeit ? `Uhrzeit: ${typedProbe.startzeit}` : ''}
${typedProbe.ort ? `Ort: ${typedProbe.ort}` : ''}
${'='.repeat(60)}

Szenen für diese Probe (${sortedSzenen.length}):
${sortedSzenen.map((ps, i) => `  ${i + 1}. Szene ${ps.szene.nummer}: ${ps.szene.titel}`).join('\n')}

${'='.repeat(60)}

`

  for (const probenSzene of sortedSzenen) {
    const szene = probenSzene.szene
    content += `
Szene ${szene.nummer}: ${szene.titel}
${szene.beschreibung ? `${szene.beschreibung}\n` : ''}
${szene.dauer_minuten ? `Dauer: ${szene.dauer_minuten} Minuten\n` : ''}
${'-'.repeat(60)}

${szene.text || '(Noch kein Text vorhanden)'}

${'='.repeat(60)}

`
  }

  const dateForFilename = typedProbe.datum.replace(/-/g, '')
  const filename = `${typedProbe.stueck.titel.replace(/[^a-zA-Z0-9]/g, '_')}_Probe_${dateForFilename}.txt`

  return { success: true, content, filename }
}
