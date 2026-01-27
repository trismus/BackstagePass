'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type {
  Probe,
  ProbeInsert,
  ProbeUpdate,
  ProbeMitDetails,
  KommendeProbe,
  ProbeSzene,
  ProbeSzeneInsert,
  ProbeTeilnehmer,
  ProbeTeilnehmerInsert,
  ProbeTeilnehmerUpdate,
  TeilnehmerStatus,
  Szene,
} from '../supabase/types'

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
    .select('*')
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
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Probe
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
 */
export async function updateTeilnehmerStatus(
  probeId: string,
  personId: string,
  status: TeilnehmerStatus,
  notizen?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const updateData: ProbeTeilnehmerUpdate = { status }
  if (notizen !== undefined) {
    updateData.notizen = notizen
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
 * Generate Teilnehmer from Besetzungen
 */
export async function generateTeilnehmerFromBesetzungen(
  probeId: string
): Promise<{ success: boolean; error?: string; count?: number }> {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]) || []
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]) || []
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
