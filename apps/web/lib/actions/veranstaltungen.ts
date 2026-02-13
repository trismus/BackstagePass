'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type {
  Veranstaltung,
  VeranstaltungInsert,
  VeranstaltungUpdate,
} from '../supabase/types'

/**
 * Get all veranstaltungen
 */
export async function getVeranstaltungen(): Promise<Veranstaltung[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('veranstaltungen')
    .select('id, titel, beschreibung, datum, startzeit, endzeit, ort, max_teilnehmer, warteliste_aktiv, organisator_id, typ, status, helfer_template_id, helfer_status, public_helfer_token, max_schichten_pro_helfer, helfer_buchung_deadline, helfer_buchung_limit_aktiv, koordinator_id, created_at, updated_at')
    .order('datum', { ascending: true })

  if (error) {
    console.error('Error fetching veranstaltungen:', error)
    return []
  }

  return (data as Veranstaltung[]) || []
}

/**
 * Get upcoming veranstaltungen (from today onwards)
 */
export async function getUpcomingVeranstaltungen(
  limit?: number
): Promise<Veranstaltung[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('veranstaltungen')
    .select('id, titel, beschreibung, datum, startzeit, endzeit, ort, max_teilnehmer, warteliste_aktiv, organisator_id, typ, status, helfer_template_id, helfer_status, public_helfer_token, max_schichten_pro_helfer, helfer_buchung_deadline, helfer_buchung_limit_aktiv, koordinator_id, created_at, updated_at')
    .gte('datum', today)
    .neq('status', 'abgesagt')
    .order('datum', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching upcoming veranstaltungen:', error)
    return []
  }

  return (data as Veranstaltung[]) || []
}

/**
 * Get a single veranstaltung by ID
 */
export async function getVeranstaltung(
  id: string
): Promise<Veranstaltung | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('veranstaltungen')
    .select('id, titel, beschreibung, datum, startzeit, endzeit, ort, max_teilnehmer, warteliste_aktiv, organisator_id, typ, status, helfer_template_id, helfer_status, public_helfer_token, max_schichten_pro_helfer, helfer_buchung_deadline, helfer_buchung_limit_aktiv, koordinator_id, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching veranstaltung:', error)
    return null
  }

  return data as Veranstaltung
}

/**
 * Create a new veranstaltung
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function createVeranstaltung(
  data: VeranstaltungInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('veranstaltungen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating veranstaltung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/veranstaltungen')
  return { success: true, id: result?.id }
}

/**
 * Update an existing veranstaltung
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function updateVeranstaltung(
  id: string,
  data: VeranstaltungUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('veranstaltungen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating veranstaltung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/veranstaltungen')
  revalidatePath(`/veranstaltungen/${id}`)
  return { success: true }
}

/**
 * Delete a veranstaltung
 * Requires ADMIN role (enforced by RLS)
 */
export async function deleteVeranstaltung(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('veranstaltungen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting veranstaltung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/veranstaltungen')
  return { success: true }
}

/**
 * Get registration count for a veranstaltung
 */
export async function getAnmeldungCount(
  veranstaltungId: string
): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('anmeldungen')
    .select('*', { count: 'exact', head: true })
    .eq('veranstaltung_id', veranstaltungId)
    .in('status', ['angemeldet', 'teilgenommen'])

  if (error) {
    console.error('Error counting anmeldungen:', error)
    return 0
  }

  return count || 0
}
