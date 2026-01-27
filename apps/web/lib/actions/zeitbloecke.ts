'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type { Zeitblock, ZeitblockInsert, ZeitblockUpdate } from '../supabase/types'

/**
 * Get all time blocks for a performance
 */
export async function getZeitbloecke(veranstaltungId: string): Promise<Zeitblock[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('zeitbloecke')
    .select('*')
    .eq('veranstaltung_id', veranstaltungId)
    .order('sortierung', { ascending: true })

  if (error) {
    console.error('Error fetching zeitbloecke:', error)
    return []
  }

  return (data as Zeitblock[]) || []
}

/**
 * Get a single time block by ID
 */
export async function getZeitblock(id: string): Promise<Zeitblock | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('zeitbloecke')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching zeitblock:', error)
    return null
  }

  return data as Zeitblock
}

/**
 * Create a new time block
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function createZeitblock(
  data: ZeitblockInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('zeitbloecke')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating zeitblock:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/auffuehrungen/${data.veranstaltung_id}`)
  return { success: true, id: result?.id }
}

/**
 * Create multiple time blocks at once
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function createZeitbloecke(
  data: ZeitblockInsert[]
): Promise<{ success: boolean; error?: string; ids?: string[] }> {
  if (data.length === 0) {
    return { success: true, ids: [] }
  }

  const supabase = await createClient()
  const { data: results, error } = await supabase
    .from('zeitbloecke')
    .insert(data as never[])
    .select('id')

  if (error) {
    console.error('Error creating zeitbloecke:', error)
    return { success: false, error: error.message }
  }

  if (data[0]?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${data[0].veranstaltung_id}`)
  }

  return { success: true, ids: results?.map((r) => r.id) || [] }
}

/**
 * Update an existing time block
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function updateZeitblock(
  id: string,
  data: ZeitblockUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the veranstaltung_id for revalidation
  const { data: existing } = await supabase
    .from('zeitbloecke')
    .select('veranstaltung_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('zeitbloecke')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating zeitblock:', error)
    return { success: false, error: error.message }
  }

  if (existing?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${existing.veranstaltung_id}`)
  }

  return { success: true }
}

/**
 * Delete a time block
 * Requires ADMIN role (enforced by RLS)
 */
export async function deleteZeitblock(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the veranstaltung_id for revalidation
  const { data: existing } = await supabase
    .from('zeitbloecke')
    .select('veranstaltung_id')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('zeitbloecke').delete().eq('id', id)

  if (error) {
    console.error('Error deleting zeitblock:', error)
    return { success: false, error: error.message }
  }

  if (existing?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${existing.veranstaltung_id}`)
  }

  return { success: true }
}

/**
 * Reorder time blocks
 */
export async function reorderZeitbloecke(
  veranstaltungId: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Update each zeitblock's sortierung
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('zeitbloecke')
      .update({ sortierung: index } as never)
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some((r) => r.error)

  if (hasError) {
    console.error('Error reordering zeitbloecke')
    return { success: false, error: 'Fehler beim Sortieren der Zeitblöcke' }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  return { success: true }
}
