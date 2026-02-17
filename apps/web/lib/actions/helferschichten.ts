'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type {
  Helferschicht,
  HelferschichtInsert,
  HelferschichtUpdate,
  HelferschichtMitDetails,
  HelferschichtStatus,
} from '../supabase/types'

/**
 * Get all shifts for a helfereinsatz with person and role details
 */
export async function getHelferschichtenForEinsatz(
  helfereinsatzId: string
): Promise<HelferschichtMitDetails[]> {
  await requirePermission('helfereinsaetze:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('helferschichten')
    .select(
      `
      *,
      person:personen!helferschichten_person_id_fkey(id, vorname, nachname, email),
      helferrolle:helferrollen!helferschichten_helferrolle_id_fkey(id, rolle)
    `
    )
    .eq('helfereinsatz_id', helfereinsatzId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching helferschichten:', error)
    return []
  }

  return (data as HelferschichtMitDetails[]) || []
}

/**
 * Get all shifts for a person
 */
export async function getHelferschichtenForPerson(
  personId: string
): Promise<Helferschicht[]> {
  await requirePermission('helfereinsaetze:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('helferschichten')
    .select('id, helfereinsatz_id, person_id, helferrolle_id, startzeit, endzeit, stunden_gearbeitet, status, notizen, created_at, updated_at')
    .eq('person_id', personId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching helferschichten for person:', error)
    return []
  }

  return (data as Helferschicht[]) || []
}

/**
 * Private helper — insert a helferschicht record (no permission check)
 */
async function _insertHelferschicht(
  helfereinsatzId: string,
  personId: string,
  helferrolleId?: string,
  startzeit?: string,
  endzeit?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Check if already assigned
  const { data: existing } = await supabase
    .from('helferschichten')
    .select('id, status')
    .eq('helfereinsatz_id', helfereinsatzId)
    .eq('person_id', personId)
    .eq('helferrolle_id', helferrolleId || '')
    .single()

  if (existing && existing.status !== 'abgesagt') {
    return { success: false, error: 'Bereits zugewiesen' }
  }

  const insertData: HelferschichtInsert = {
    helfereinsatz_id: helfereinsatzId,
    person_id: personId,
    helferrolle_id: helferrolleId || null,
    startzeit: startzeit || null,
    endzeit: endzeit || null,
    stunden_gearbeitet: null,
    status: 'zugesagt',
    notizen: null,
  }

  const { error } = await supabase
    .from('helferschichten')
    .insert(insertData as never)

  if (error) {
    console.error('Error assigning helper:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helfereinsaetze')
  revalidatePath(`/helfereinsaetze/${helfereinsatzId}`)
  revalidatePath('/mein-bereich')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Assign a helper to a shift (management action)
 */
export async function zuweiseHelfer(
  helfereinsatzId: string,
  personId: string,
  helferrolleId?: string,
  startzeit?: string,
  endzeit?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helfereinsaetze:write')
  } catch {
    return { success: false, error: 'Keine Berechtigung' }
  }
  return _insertHelferschicht(helfereinsatzId, personId, helferrolleId, startzeit, endzeit)
}

/**
 * Private helper — update a helferschicht status (no permission check)
 */
async function _updateSchichtStatus(
  id: string,
  status: HelferschichtStatus,
  stundenGearbeitet?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const updateData: HelferschichtUpdate = { status }
  if (stundenGearbeitet !== undefined) {
    updateData.stunden_gearbeitet = stundenGearbeitet
  }

  const { error } = await supabase
    .from('helferschichten')
    .update(updateData as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating helferschicht status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helfereinsaetze')
  revalidatePath('/mein-bereich')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Update shift status (management action)
 */
export async function updateHelferschichtStatus(
  id: string,
  status: HelferschichtStatus,
  stundenGearbeitet?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helfereinsaetze:write')
  } catch {
    return { success: false, error: 'Keine Berechtigung' }
  }
  return _updateSchichtStatus(id, status, stundenGearbeitet)
}

/**
 * Update a shift (management action)
 */
export async function updateHelferschicht(
  id: string,
  data: HelferschichtUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helfereinsaetze:write')
  } catch {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('helferschichten')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating helferschicht:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helfereinsaetze')
  revalidatePath('/mein-bereich')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Remove a helper from a shift (management action)
 */
export async function removeHelfer(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helfereinsaetze:delete')
  } catch {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('helferschichten').delete().eq('id', id)

  if (error) {
    console.error('Error removing helper:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helfereinsaetze')
  revalidatePath('/mein-bereich')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Get total hours worked by a person
 */
export async function getTotalStundenForPerson(
  personId: string
): Promise<number> {
  await requirePermission('helfereinsaetze:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('helferschichten')
    .select('stunden_gearbeitet')
    .eq('person_id', personId)
    .eq('status', 'erschienen')

  if (error) {
    console.error('Error fetching total stunden:', error)
    return 0
  }

  return data?.reduce((sum, s) => sum + (s.stunden_gearbeitet || 0), 0) || 0
}

/**
 * Export helfereinsatz data as CSV
 */
export async function exportHelfereinsatzCSV(
  helfereinsatzId: string
): Promise<string> {
  await requirePermission('helfereinsaetze:read')
  const schichten = await getHelferschichtenForEinsatz(helfereinsatzId)

  const headers = ['Name', 'Email', 'Rolle', 'Status', 'Stunden']
  const rows = schichten.map((s) => [
    `${s.person.vorname} ${s.person.nachname}`,
    s.person.email || '',
    s.helferrolle?.rolle || '',
    s.status,
    s.stunden_gearbeitet?.toString() || '',
  ])

  const csv = [headers, ...rows].map((row) => row.join(';')).join('\n')
  return csv
}

/**
 * Sign up for an einsatz (self-service action)
 * Used by the Helfer Dashboard
 */
export async function signUpForEinsatz(
  helfereinsatzId: string,
  personId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helfereinsaetze:register')
  } catch {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const result = await _insertHelferschicht(helfereinsatzId, personId)

  if (result.success) {
    revalidatePath('/helfer-dashboard')
  }

  return result
}

/**
 * Cancel own shift (self-service action, set status to abgesagt)
 * Used by the Helfer Dashboard
 */
export async function cancelSchicht(
  schichtId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helfereinsaetze:register')
  } catch {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const result = await _updateSchichtStatus(schichtId, 'abgesagt')

  if (result.success) {
    revalidatePath('/helfer-dashboard')
  }

  return result
}
