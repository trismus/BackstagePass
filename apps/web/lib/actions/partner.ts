'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type { Partner, PartnerInsert, PartnerUpdate } from '../supabase/types'

/**
 * Get all partners
 */
export async function getPartner(): Promise<Partner[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('partner')
    .select('id, name, kontakt_name, kontakt_email, kontakt_telefon, adresse, notizen, aktiv, created_at, updated_at')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching partner:', error)
    return []
  }

  return (data as Partner[]) || []
}

/**
 * Get active partners only
 */
export async function getActivePartner(): Promise<Partner[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('partner')
    .select('id, name, kontakt_name, kontakt_email, kontakt_telefon, adresse, notizen, aktiv, created_at, updated_at')
    .eq('aktiv', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching active partner:', error)
    return []
  }

  return (data as Partner[]) || []
}

/**
 * Get a single partner by ID
 */
export async function getPartnerById(id: string): Promise<Partner | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('partner')
    .select('id, name, kontakt_name, kontakt_email, kontakt_telefon, adresse, notizen, aktiv, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching partner:', error)
    return null
  }

  return data as Partner
}

/**
 * Create a new partner
 * Requires ADMIN role (enforced by RLS)
 */
export async function createPartner(
  data: PartnerInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('partner')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating partner:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/partner')
  revalidatePath('/helfereinsaetze')
  return { success: true, id: result?.id }
}

/**
 * Update an existing partner
 * Requires ADMIN role (enforced by RLS)
 */
export async function updatePartner(
  id: string,
  data: PartnerUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('partner')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating partner:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/partner')
  revalidatePath('/helfereinsaetze')
  return { success: true }
}

/**
 * Delete a partner (soft delete)
 * Requires ADMIN role (enforced by RLS)
 */
export async function deletePartner(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('partner')
    .update({ aktiv: false } as never)
    .eq('id', id)

  if (error) {
    console.error('Error deleting partner:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/partner')
  revalidatePath('/helfereinsaetze')
  return { success: true }
}
