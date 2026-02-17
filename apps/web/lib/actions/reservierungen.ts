'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type {
  RaumReservierungInsert,
  RaumReservierungMitRaum,
  RessourcenReservierungInsert,
  RessourcenReservierungMitRessource,
} from '../supabase/types'
import {
  raumReservierungSchema,
  ressourcenReservierungSchema,
  validateInput,
} from '../validations/modul2'
import { requirePermission } from '../supabase/auth-helpers'

// =============================================================================
// Room Reservations
// =============================================================================

/**
 * Get all room reservations for a performance
 */
export async function getRaumReservierungen(
  veranstaltungId: string
): Promise<RaumReservierungMitRaum[]> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('raum_reservierungen')
    .select(
      `
      *,
      raum:raeume(id, name, typ, kapazitaet)
    `
    )
    .eq('veranstaltung_id', veranstaltungId)

  if (error) {
    console.error('Error fetching raum reservierungen:', error)
    return []
  }

  return (data as RaumReservierungMitRaum[]) || []
}

/**
 * Create a room reservation
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function createRaumReservierung(
  data: RaumReservierungInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  // Validate input
  const validation = validateInput(raumReservierungSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('raum_reservierungen')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating raum reservierung:', error)
    return {
      success: false,
      error: 'Fehler beim Erstellen der Raumreservierung',
    }
  }

  revalidatePath(`/auffuehrungen/${data.veranstaltung_id}`)
  return { success: true, id: result?.id }
}

/**
 * Delete a room reservation
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function deleteRaumReservierung(
  id: string,
  veranstaltungId: string
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()
  const { error } = await supabase
    .from('raum_reservierungen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting raum reservierung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  return { success: true }
}

/**
 * Check for room conflicts on a specific date
 * Returns list of performances that have this room reserved on the same date
 */
export async function checkRaumKonflikt(
  raumId: string,
  datum: string,
  excludeVeranstaltungId?: string
): Promise<{ hasConflict: boolean; conflictingEvents: string[] }> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()

  // Get all veranstaltungen on this date
  let query = supabase
    .from('veranstaltungen')
    .select('id, titel')
    .eq('datum', datum)
    .neq('status', 'abgesagt')

  if (excludeVeranstaltungId) {
    query = query.neq('id', excludeVeranstaltungId)
  }

  const { data: veranstaltungen } = await query

  if (!veranstaltungen || veranstaltungen.length === 0) {
    return { hasConflict: false, conflictingEvents: [] }
  }

  const veranstaltungIds = veranstaltungen.map((v) => v.id)

  // Check if any of these have the room reserved
  const { data: reservierungen } = await supabase
    .from('raum_reservierungen')
    .select('veranstaltung_id')
    .eq('raum_id', raumId)
    .in('veranstaltung_id', veranstaltungIds)

  if (!reservierungen || reservierungen.length === 0) {
    return { hasConflict: false, conflictingEvents: [] }
  }

  const conflictingIds = reservierungen.map((r) => r.veranstaltung_id)
  const conflictingEvents = veranstaltungen
    .filter((v) => conflictingIds.includes(v.id))
    .map((v) => v.titel)

  return {
    hasConflict: conflictingEvents.length > 0,
    conflictingEvents,
  }
}

// =============================================================================
// Resource Reservations
// =============================================================================

/**
 * Get all resource reservations for a performance
 */
export async function getRessourcenReservierungen(
  veranstaltungId: string
): Promise<RessourcenReservierungMitRessource[]> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ressourcen_reservierungen')
    .select(
      `
      *,
      ressource:ressourcen(id, name, kategorie, menge)
    `
    )
    .eq('veranstaltung_id', veranstaltungId)

  if (error) {
    console.error('Error fetching ressourcen reservierungen:', error)
    return []
  }

  return (data as RessourcenReservierungMitRessource[]) || []
}

/**
 * Create a resource reservation
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function createRessourcenReservierung(
  data: RessourcenReservierungInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  // Validate input
  const validation = validateInput(ressourcenReservierungSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('ressourcen_reservierungen')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating ressourcen reservierung:', error)
    return {
      success: false,
      error: 'Fehler beim Erstellen der Ressourcenreservierung',
    }
  }

  revalidatePath(`/auffuehrungen/${data.veranstaltung_id}`)
  return { success: true, id: result?.id }
}

/**
 * Update a resource reservation (e.g., change quantity)
 */
export async function updateRessourcenReservierung(
  id: string,
  menge: number,
  notizen?: string
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()
  const { error } = await supabase
    .from('ressourcen_reservierungen')
    .update({ menge, notizen } as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating ressourcen reservierung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/auffuehrungen')
  return { success: true }
}

/**
 * Delete a resource reservation
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function deleteRessourcenReservierung(
  id: string,
  veranstaltungId: string
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()
  const { error } = await supabase
    .from('ressourcen_reservierungen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ressourcen reservierung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  return { success: true }
}

/**
 * Check for resource availability on a specific date
 * Returns available quantity after accounting for other reservations
 */
export async function checkRessourceVerfuegbarkeit(
  ressourceId: string,
  datum: string,
  excludeVeranstaltungId?: string
): Promise<{ total: number; reserved: number; available: number }> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()

  // Get total quantity of the resource
  const { data: ressource } = await supabase
    .from('ressourcen')
    .select('menge')
    .eq('id', ressourceId)
    .single()

  if (!ressource) {
    return { total: 0, reserved: 0, available: 0 }
  }

  // Get all veranstaltungen on this date
  let query = supabase
    .from('veranstaltungen')
    .select('id')
    .eq('datum', datum)
    .neq('status', 'abgesagt')

  if (excludeVeranstaltungId) {
    query = query.neq('id', excludeVeranstaltungId)
  }

  const { data: veranstaltungen } = await query

  if (!veranstaltungen || veranstaltungen.length === 0) {
    return { total: ressource.menge, reserved: 0, available: ressource.menge }
  }

  const veranstaltungIds = veranstaltungen.map((v) => v.id)

  // Sum up all reservations for this resource on this date
  const { data: reservierungen } = await supabase
    .from('ressourcen_reservierungen')
    .select('menge')
    .eq('ressource_id', ressourceId)
    .in('veranstaltung_id', veranstaltungIds)

  const reserved =
    reservierungen?.reduce((sum, r) => sum + (r.menge || 0), 0) || 0

  return {
    total: ressource.menge,
    reserved,
    available: Math.max(0, ressource.menge - reserved),
  }
}
