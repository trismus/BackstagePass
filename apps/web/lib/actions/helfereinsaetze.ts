'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type {
  HelfereinsatzInsert,
  HelfereinsatzUpdate,
  HelfereinsatzMitPartner,
  Helferrolle,
  HelferrolleInsert,
} from '../supabase/types'
import {
  helfereinsatzSchema,
  helfereinsatzUpdateSchema,
  helferrolleSchema,
} from '../validations/helfereinsaetze'
import { validateInput } from '../validations/modul2'
import { requirePermission } from '../supabase/auth-helpers'

/**
 * Get all helfereinsaetze with partner info
 */
export async function getHelfereinsaetze(): Promise<HelfereinsatzMitPartner[]> {
  await requirePermission('helfereinsaetze:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('helfereinsaetze')
    .select(
      `
      *,
      partner:partner!helfereinsaetze_partner_id_fkey(id, name)
    `
    )
    .order('datum', { ascending: true })

  if (error) {
    console.error('Error fetching helfereinsaetze:', error)
    return []
  }

  return (data as HelfereinsatzMitPartner[]) || []
}

/**
 * Get upcoming helfereinsaetze
 */
export async function getUpcomingHelfereinsaetze(
  limit?: number
): Promise<HelfereinsatzMitPartner[]> {
  await requirePermission('helfereinsaetze:read')
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('helfereinsaetze')
    .select(
      `
      *,
      partner:partner!helfereinsaetze_partner_id_fkey(id, name)
    `
    )
    .gte('datum', today)
    .neq('status', 'abgesagt')
    .order('datum', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching upcoming helfereinsaetze:', error)
    return []
  }

  return (data as HelfereinsatzMitPartner[]) || []
}

/**
 * Get a single helfereinsatz by ID
 */
export async function getHelfereinsatz(
  id: string
): Promise<HelfereinsatzMitPartner | null> {
  await requirePermission('helfereinsaetze:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('helfereinsaetze')
    .select(
      `
      *,
      partner:partner!helfereinsaetze_partner_id_fkey(id, name)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching helfereinsatz:', error)
    return null
  }

  return data as HelfereinsatzMitPartner
}

/**
 * Create a new helfereinsatz with roles
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function createHelfereinsatz(
  data: HelfereinsatzInsert,
  rollen?: HelferrolleInsert[]
): Promise<{ success: boolean; error?: string; id?: string }> {
  try { await requirePermission('helfereinsaetze:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  // Validate input
  const validation = validateInput(helfereinsatzSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  if (rollen) {
    for (const rolle of rollen) {
      const rolleValidation = validateInput(helferrolleSchema, rolle)
      if (!rolleValidation.success) {
        return { success: false, error: rolleValidation.error }
      }
    }
  }

  const supabase = await createClient()

  // Insert helfereinsatz
  const { data: result, error } = await supabase
    .from('helfereinsaetze')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating helfereinsatz:', error)
    return { success: false, error: error.message }
  }

  // Insert roles if provided
  if (rollen && rollen.length > 0 && result?.id) {
    const rollenWithEinsatzId = rollen.map((r) => ({
      ...r,
      helfereinsatz_id: result.id,
    }))

    const { error: rollenError } = await supabase
      .from('helferrollen')
      .insert(rollenWithEinsatzId as never[])

    if (rollenError) {
      console.error('Error creating helferrollen:', rollenError)
      // Don't fail the whole operation, roles can be added later
    }
  }

  revalidatePath('/helfereinsaetze')
  return { success: true, id: result?.id }
}

/**
 * Update an existing helfereinsatz
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function updateHelfereinsatz(
  id: string,
  data: HelfereinsatzUpdate
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('helfereinsaetze:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  // Validate input
  const validation = validateInput(helfereinsatzUpdateSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('helfereinsaetze')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating helfereinsatz:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helfereinsaetze')
  revalidatePath(`/helfereinsaetze/${id}`)
  return { success: true }
}

/**
 * Delete a helfereinsatz
 * Requires ADMIN role (enforced by RLS)
 */
export async function deleteHelfereinsatz(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('helfereinsaetze:delete') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()
  const { error } = await supabase.from('helfereinsaetze').delete().eq('id', id)

  if (error) {
    console.error('Error deleting helfereinsatz:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helfereinsaetze')
  return { success: true }
}

/**
 * Get roles for a helfereinsatz
 */
export async function getHelferrollen(
  helfereinsatzId: string
): Promise<Helferrolle[]> {
  await requirePermission('helfereinsaetze:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('helferrollen')
    .select('id, helfereinsatz_id, rolle, anzahl_benoetigt, created_at')
    .eq('helfereinsatz_id', helfereinsatzId)
    .order('rolle', { ascending: true })

  if (error) {
    console.error('Error fetching helferrollen:', error)
    return []
  }

  return (data as Helferrolle[]) || []
}

/**
 * Add a role to a helfereinsatz
 */
export async function addHelferrolle(
  data: HelferrolleInsert
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('helfereinsaetze:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()
  const { error } = await supabase.from('helferrollen').insert(data as never)

  if (error) {
    console.error('Error adding helferrolle:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helfereinsaetze')
  revalidatePath(`/helfereinsaetze/${data.helfereinsatz_id}`)
  return { success: true }
}

/**
 * Remove a role from a helfereinsatz
 */
export async function removeHelferrolle(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('helfereinsaetze:delete') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()
  const { error } = await supabase.from('helferrollen').delete().eq('id', id)

  if (error) {
    console.error('Error removing helferrolle:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helfereinsaetze')
  return { success: true }
}
