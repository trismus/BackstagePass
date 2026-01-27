'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type { Raum, RaumInsert, RaumUpdate } from '../supabase/types'

/**
 * Get all active rooms
 */
export async function getRaeume(): Promise<Raum[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('raeume')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching raeume:', error)
    return []
  }

  return (data as Raum[]) || []
}

/**
 * Get all active rooms only
 */
export async function getAktiveRaeume(): Promise<Raum[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('raeume')
    .select('*')
    .eq('aktiv', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching aktive raeume:', error)
    return []
  }

  return (data as Raum[]) || []
}

/**
 * Get a single room by ID
 */
export async function getRaum(id: string): Promise<Raum | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('raeume')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching raum:', error)
    return null
  }

  return data as Raum
}

/**
 * Create a new room
 * Requires ADMIN role (enforced by RLS)
 */
export async function createRaum(
  data: RaumInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('raeume')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating raum:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/raeume')
  return { success: true, id: result?.id }
}

/**
 * Update an existing room
 * Requires ADMIN role (enforced by RLS)
 */
export async function updateRaum(
  id: string,
  data: RaumUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('raeume')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating raum:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/raeume')
  return { success: true }
}

/**
 * Delete a room
 * Requires ADMIN role (enforced by RLS)
 */
export async function deleteRaum(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('raeume').delete().eq('id', id)

  if (error) {
    console.error('Error deleting raum:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/raeume')
  return { success: true }
}
