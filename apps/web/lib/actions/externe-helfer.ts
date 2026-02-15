'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { sanitizeSearchQuery } from '../utils/search'
import type {
  ExterneHelferProfil,
  ExterneHelferProfilMitEinsaetze,
  ExterneHelferProfilUpdate,
} from '../supabase/types'

/**
 * Find or create an external helper profile
 *
 * - Searches for existing profile by email (case-insensitive)
 * - If found: updates data if different, returns existing ID
 * - If not found: creates new profile, returns new ID
 *
 * @param email - Email address (unique identifier)
 * @param vorname - First name
 * @param nachname - Last name
 * @param telefon - Phone number (optional)
 */
export async function findOrCreateExternalHelper(
  email: string,
  vorname: string,
  nachname: string,
  telefon?: string | null
): Promise<{ success: boolean; error?: string; id?: string; isNew?: boolean }> {
  const supabase = await createClient()

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim()

  // Check if profile already exists
  const { data: existing, error: searchError } = await supabase
    .from('externe_helfer_profile')
    .select('id, vorname, nachname, telefon')
    .ilike('email', normalizedEmail)
    .single()

  if (searchError && searchError.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error searching for external helper:', searchError)
    return { success: false, error: 'Fehler bei der Suche' }
  }

  if (existing) {
    // Profile exists - check if update is needed
    const needsUpdate =
      existing.vorname !== vorname ||
      existing.nachname !== nachname ||
      (telefon && existing.telefon !== telefon)

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('externe_helfer_profile')
        .update({
          vorname,
          nachname,
          telefon: telefon || existing.telefon,
          letzter_einsatz: new Date().toISOString(),
        } as never)
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error updating external helper:', updateError)
        return { success: false, error: 'Fehler beim Aktualisieren' }
      }
    } else {
      // Just update letzter_einsatz
      await supabase
        .from('externe_helfer_profile')
        .update({ letzter_einsatz: new Date().toISOString() } as never)
        .eq('id', existing.id)
    }

    return { success: true, id: existing.id, isNew: false }
  }

  // Create new profile
  const { data: newProfile, error: createError } = await supabase
    .from('externe_helfer_profile')
    .insert({
      email: normalizedEmail,
      vorname,
      nachname,
      telefon: telefon || null,
      letzter_einsatz: new Date().toISOString(),
    } as never)
    .select('id')
    .single()

  if (createError) {
    console.error('Error creating external helper:', createError)
    return { success: false, error: 'Fehler beim Erstellen des Profils' }
  }

  return { success: true, id: newProfile.id, isNew: true }
}

/**
 * Get all external helper profiles (management only)
 */
export async function getExterneHelferProfile(): Promise<
  ExterneHelferProfilMitEinsaetze[]
> {
  await requirePermission('mitglieder:read')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('externe_helfer_profile')
    .select(`
      *,
      anmeldungen:helfer_anmeldungen(id)
    `)
    .order('letzter_einsatz', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching external helpers:', error)
    return []
  }

  return (data || []).map((profile) => ({
    ...profile,
    einsaetze_count: profile.anmeldungen?.length || 0,
  })) as ExterneHelferProfilMitEinsaetze[]
}

/**
 * Get a single external helper profile by ID
 */
export async function getExterneHelferProfil(
  id: string
): Promise<ExterneHelferProfil | null> {
  await requirePermission('mitglieder:read')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('externe_helfer_profile')
    .select('id, email, vorname, nachname, telefon, notizen, dashboard_token, erstellt_am, letzter_einsatz')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching external helper:', error)
    return null
  }

  return data as ExterneHelferProfil
}

/**
 * Get external helper profile by email
 */
export async function getExterneHelferProfilByEmail(
  email: string
): Promise<ExterneHelferProfil | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('externe_helfer_profile')
    .select('id, email, vorname, nachname, telefon, notizen, dashboard_token, erstellt_am, letzter_einsatz')
    .ilike('email', email.toLowerCase().trim())
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching external helper by email:', error)
    return null
  }

  return data as ExterneHelferProfil | null
}

/**
 * Update an external helper profile (management only)
 */
export async function updateExterneHelferProfil(
  id: string,
  data: ExterneHelferProfilUpdate
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')

  const supabase = await createClient()

  const { error } = await supabase
    .from('externe_helfer_profile')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating external helper:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/externe-helfer')
  return { success: true }
}

/**
 * Delete an external helper profile (admin only)
 *
 * Note: This will SET NULL on any helfer_anmeldungen that reference this profile
 */
export async function deleteExterneHelferProfil(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  const { error } = await supabase
    .from('externe_helfer_profile')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting external helper:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/externe-helfer')
  return { success: true }
}

/**
 * Search external helpers by name or email
 */
export async function searchExterneHelfer(
  query: string
): Promise<ExterneHelferProfil[]> {
  await requirePermission('mitglieder:read')

  const supabase = await createClient()

  const searchTerm = `%${sanitizeSearchQuery(query)}%`

  const { data, error } = await supabase
    .from('externe_helfer_profile')
    .select('id, email, vorname, nachname, telefon, notizen, dashboard_token, erstellt_am, letzter_einsatz')
    .or(`vorname.ilike.${searchTerm},nachname.ilike.${searchTerm},email.ilike.${searchTerm}`)
    .order('nachname', { ascending: true })
    .limit(20)

  if (error) {
    console.error('Error searching external helpers:', error)
    return []
  }

  return data as ExterneHelferProfil[]
}

/**
 * Get registration history for an external helper
 */
export async function getExterneHelferEinsaetze(helperId: string): Promise<
  {
    id: string
    event_name: string
    role_name: string | null
    datum: string
    status: string
  }[]
> {
  await requirePermission('mitglieder:read')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('helfer_anmeldungen')
    .select(`
      id,
      status,
      created_at,
      rollen_instanz:helfer_rollen_instanzen(
        custom_name,
        template:helfer_rollen_templates(name),
        helfer_event:helfer_events(name, datum_start)
      )
    `)
    .eq('external_helper_id', helperId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching helper assignments:', error)
    return []
  }

  return (data || []).map((anmeldung) => {
    const instanz = anmeldung.rollen_instanz as unknown as {
      custom_name: string | null
      template: { name: string } | null
      helfer_event: { name: string; datum_start: string } | null
    } | null

    return {
      id: anmeldung.id,
      event_name: instanz?.helfer_event?.name || 'Unbekannt',
      role_name: instanz?.custom_name || instanz?.template?.name || null,
      datum: instanz?.helfer_event?.datum_start || anmeldung.created_at,
      status: anmeldung.status,
    }
  })
}
