'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type {
  Requisite,
  RequisiteInsert,
  RequisiteUpdate,
  RequisiteMitDetails,
} from '../supabase/types'

// =============================================================================
// Requisiten CRUD Operations
// =============================================================================

/**
 * Get all Requisiten for a Stück with details
 */
export async function getRequisiten(stueckId: string): Promise<RequisiteMitDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('requisiten')
    .select(`
      *,
      verantwortlich:personen!requisiten_verantwortlich_id_fkey(id, vorname, nachname),
      szene:szenen!requisiten_szene_id_fkey(id, nummer, titel)
    `)
    .eq('stueck_id', stueckId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching requisiten:', error)
    return []
  }

  return (data as unknown as RequisiteMitDetails[]) || []
}

/**
 * Get a single Requisite by ID
 */
export async function getRequisite(id: string): Promise<Requisite | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('requisiten')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching requisite:', error)
    return null
  }

  return data as Requisite
}

/**
 * Create a new Requisite
 */
export async function createRequisite(
  data: RequisiteInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Requisiten erstellen.',
    }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('requisiten')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating requisite:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stuecke/${data.stueck_id}`)
  return { success: true, id: result?.id }
}

/**
 * Update an existing Requisite
 */
export async function updateRequisite(
  id: string,
  data: RequisiteUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Requisiten bearbeiten.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const requisite = await getRequisite(id)
  const stueckId = requisite?.stueck_id

  const { error } = await supabase
    .from('requisiten')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating requisite:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

/**
 * Delete a Requisite
 */
export async function deleteRequisite(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Requisiten löschen.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const requisite = await getRequisite(id)
  const stueckId = requisite?.stueck_id

  const { error } = await supabase.from('requisiten').delete().eq('id', id)

  if (error) {
    console.error('Error deleting requisite:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

/**
 * Update Requisite status (can be done by the responsible person)
 */
export async function updateRequisitenStatus(
  id: string,
  status: Requisite['status']
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt.' }
  }

  const supabase = await createClient()

  // Get current requisite to check if user is responsible
  const requisite = await getRequisite(id)
  if (!requisite) {
    return { success: false, error: 'Requisite nicht gefunden.' }
  }

  // Allow if user is management or the responsible person
  const isManagement = hasPermission(profile.role, 'stuecke:write')

  // Get person linked to this profile
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  const isResponsible = person?.id === requisite.verantwortlich_id

  if (!isManagement && !isResponsible) {
    return {
      success: false,
      error: 'Nur die verantwortliche Person oder Vorstand kann den Status ändern.',
    }
  }

  const { error } = await supabase
    .from('requisiten')
    .update({ status } as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating requisite status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stuecke/${requisite.stueck_id}`)
  return { success: true }
}

/**
 * Get requisiten statistics for a Stück
 */
export async function getRequisitenStats(stueckId: string): Promise<{
  total: number
  gesucht: number
  gefunden: number
  beschafft: number
  vorhanden: number
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('requisiten')
    .select('status')
    .eq('stueck_id', stueckId)

  if (error || !data) {
    return { total: 0, gesucht: 0, gefunden: 0, beschafft: 0, vorhanden: 0 }
  }

  return {
    total: data.length,
    gesucht: data.filter((r) => r.status === 'gesucht').length,
    gefunden: data.filter((r) => r.status === 'gefunden').length,
    beschafft: data.filter((r) => r.status === 'beschafft').length,
    vorhanden: data.filter((r) => r.status === 'vorhanden').length,
  }
}
