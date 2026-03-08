'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type {
  HelferEventBelegung,
  HelferEventVollDetails,
  HelferAnmeldungStatus,
  RollenSichtbarkeit,
} from '../supabase/types'
import {
  helferRolleCreateSchema,
  helferRolleUpdateSchema,
  externalHelferAssignSchema,
} from '../validations/helferliste-management'
import type {
  HelferRolleCreateFormData,
  HelferRolleUpdateFormData,
  ExternalHelferAssignFormData,
} from '../validations/helferliste-management'

// =============================================================================
// Helpers (path revalidation)
// =============================================================================

async function revalidateHelferlistePaths(): Promise<void> {
  revalidatePath('/vorstand/helferliste')
  revalidatePath('/mitmachen')
  revalidatePath('/dashboard')
}

// =============================================================================
// Read Actions
// =============================================================================

/**
 * Get all future helfer events with occupancy (Ampel) data
 */
export async function getHelferEventsMitBelegung(): Promise<{
  success: boolean
  data?: HelferEventBelegung[]
  error?: string
}> {
  try {
    await requirePermission('helferliste:read')
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_helferliste_dashboard_data')

    if (error) {
      console.error('Error fetching helferliste dashboard data:', error)
      return { success: false, error: 'Fehler beim Laden der Daten' }
    }

    return { success: true, data: (data ?? []) as HelferEventBelegung[] }
  } catch (error) {
    console.error('getHelferEventsMitBelegung failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

/**
 * Get a single helfer event with all roles and registrations
 */
export async function getHelferEventMitDetails(
  eventId: string
): Promise<{
  success: boolean
  data?: HelferEventVollDetails
  error?: string
}> {
  try {
    await requirePermission('helferliste:read')
    const supabase = await createClient()

    // Fetch event
    const { data: event, error: eventError } = await supabase
      .from('helfer_events')
      .select(`
        *,
        veranstaltung:veranstaltungen(id, titel)
      `)
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error('Error fetching helfer event:', eventError)
      return { success: false, error: 'Event nicht gefunden' }
    }

    // Fetch all roles (not just public) with anmeldungen
    const { data: rollen, error: rollenError } = await supabase
      .from('helfer_rollen_instanzen')
      .select(`
        *,
        template:helfer_rollen_templates(id, name),
        anmeldungen:helfer_anmeldungen(
          id,
          rollen_instanz_id,
          profile_id,
          external_helper_id,
          external_name,
          external_email,
          external_telefon,
          abmeldung_token,
          datenschutz_akzeptiert,
          status,
          created_at,
          profile:profiles(id, display_name, email),
          external_helper:externe_helfer_profile(id, vorname, nachname, email)
        )
      `)
      .eq('helfer_event_id', eventId)
      .order('zeitblock_start', { ascending: true })

    if (rollenError) {
      console.error('Error fetching rollen:', rollenError)
      return { success: false, error: 'Fehler beim Laden der Rollen' }
    }

    const rollenMitCount = (rollen || []).map((rolle) => ({
      ...rolle,
      angemeldet_count:
        rolle.anmeldungen?.filter(
          (a: { status: string }) =>
            a.status === 'angemeldet' || a.status === 'bestaetigt'
        ).length || 0,
    }))

    return {
      success: true,
      data: {
        ...event,
        veranstaltung: event.veranstaltung || null,
        rollen: rollenMitCount,
      } as HelferEventVollDetails,
    }
  } catch (error) {
    console.error('getHelferEventMitDetails failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// =============================================================================
// Rolle CRUD Actions
// =============================================================================

/**
 * Create a new role/shift for a helfer event
 */
export async function createHelferRolle(
  eventId: string,
  data: HelferRolleCreateFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helferliste:write')

    const validated = helferRolleCreateSchema.parse(data)
    const supabase = await createClient()

    const { error } = await supabase
      .from('helfer_rollen_instanzen')
      .insert({
        helfer_event_id: eventId,
        custom_name: validated.custom_name,
        anzahl_benoetigt: validated.anzahl_benoetigt,
        zeitblock_start: validated.zeitblock_start || null,
        zeitblock_end: validated.zeitblock_end || null,
        sichtbarkeit: validated.sichtbarkeit,
        template_id: null,
      })

    if (error) {
      console.error('Error creating helfer rolle:', error)
      return { success: false, error: 'Fehler beim Erstellen der Rolle' }
    }

    await revalidateHelferlistePaths()
    return { success: true }
  } catch (error) {
    console.error('createHelferRolle failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

/**
 * Update an existing role/shift
 */
export async function updateHelferRolle(
  rolleId: string,
  data: HelferRolleUpdateFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helferliste:write')

    const validated = helferRolleUpdateSchema.parse(data)
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (validated.custom_name !== undefined) updateData.custom_name = validated.custom_name
    if (validated.anzahl_benoetigt !== undefined) updateData.anzahl_benoetigt = validated.anzahl_benoetigt
    if (validated.zeitblock_start !== undefined) updateData.zeitblock_start = validated.zeitblock_start || null
    if (validated.zeitblock_end !== undefined) updateData.zeitblock_end = validated.zeitblock_end || null
    if (validated.sichtbarkeit !== undefined) updateData.sichtbarkeit = validated.sichtbarkeit

    const { error } = await supabase
      .from('helfer_rollen_instanzen')
      .update(updateData)
      .eq('id', rolleId)

    if (error) {
      console.error('Error updating helfer rolle:', error)
      return { success: false, error: 'Fehler beim Aktualisieren der Rolle' }
    }

    await revalidateHelferlistePaths()
    return { success: true }
  } catch (error) {
    console.error('updateHelferRolle failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

/**
 * Delete a role (only if no registrations exist)
 */
export async function deleteHelferRolle(
  rolleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helferliste:delete')
    const supabase = await createClient()

    // Check if any registrations exist
    const { count } = await supabase
      .from('helfer_anmeldungen')
      .select('id', { count: 'exact', head: true })
      .eq('rollen_instanz_id', rolleId)

    if (count && count > 0) {
      return {
        success: false,
        error: `Rolle kann nicht gelöscht werden: ${count} Anmeldung(en) vorhanden`,
      }
    }

    const { error } = await supabase
      .from('helfer_rollen_instanzen')
      .delete()
      .eq('id', rolleId)

    if (error) {
      console.error('Error deleting helfer rolle:', error)
      return { success: false, error: 'Fehler beim Löschen der Rolle' }
    }

    await revalidateHelferlistePaths()
    return { success: true }
  } catch (error) {
    console.error('deleteHelferRolle failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// =============================================================================
// Assignment Actions
// =============================================================================

/**
 * Assign an internal member (profile) to a role
 * Status is set to 'angemeldet' per Product Owner decision
 */
export async function assignProfileToRolle(
  rolleId: string,
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helferliste:write')
    const supabase = await createClient()

    // Check if already assigned
    const { data: existing } = await supabase
      .from('helfer_anmeldungen')
      .select('id')
      .eq('rollen_instanz_id', rolleId)
      .eq('profile_id', profileId)
      .neq('status', 'abgelehnt')
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'Mitglied ist bereits zugewiesen' }
    }

    const { error } = await supabase
      .from('helfer_anmeldungen')
      .insert({
        rollen_instanz_id: rolleId,
        profile_id: profileId,
        status: 'angemeldet' as HelferAnmeldungStatus,
        external_helper_id: null,
        external_name: null,
        external_email: null,
        external_telefon: null,
        abmeldung_token: null,
        datenschutz_akzeptiert: null,
      })

    if (error) {
      console.error('Error assigning profile to rolle:', error)
      return { success: false, error: 'Fehler bei der Zuweisung' }
    }

    await revalidateHelferlistePaths()
    return { success: true }
  } catch (error) {
    console.error('assignProfileToRolle failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

/**
 * Assign an external helper to a role
 * Creates or finds the helper profile, then creates registration
 */
export async function assignExternalHelferToRolle(
  rolleId: string,
  data: ExternalHelferAssignFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helferliste:write')

    const validated = externalHelferAssignSchema.parse(data)
    const supabase = await createClient()

    // Find or create external helper profile
    const { data: helperId, error: helperError } = await supabase
      .rpc('find_or_create_external_helper', {
        p_email: validated.email,
        p_vorname: validated.vorname,
        p_nachname: validated.nachname,
        p_telefon: validated.telefon || null,
      })

    if (helperError) {
      console.error('Error finding/creating external helper:', helperError)
      return { success: false, error: 'Fehler beim Erstellen des Helferprofils' }
    }

    const externalHelperId = helperId as string

    // Check if already assigned
    const { data: existing } = await supabase
      .from('helfer_anmeldungen')
      .select('id')
      .eq('rollen_instanz_id', rolleId)
      .eq('external_helper_id', externalHelperId)
      .neq('status', 'abgelehnt')
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'Helfer ist bereits zugewiesen' }
    }

    const { error } = await supabase
      .from('helfer_anmeldungen')
      .insert({
        rollen_instanz_id: rolleId,
        external_helper_id: externalHelperId,
        status: 'angemeldet' as HelferAnmeldungStatus,
        profile_id: null,
        external_name: `${validated.vorname} ${validated.nachname}`,
        external_email: validated.email,
        external_telefon: validated.telefon || null,
        abmeldung_token: null,
        datenschutz_akzeptiert: null,
      })

    if (error) {
      console.error('Error assigning external helper:', error)
      return { success: false, error: 'Fehler bei der Zuweisung' }
    }

    await revalidateHelferlistePaths()
    return { success: true }
  } catch (error) {
    console.error('assignExternalHelferToRolle failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// =============================================================================
// Anmeldung Actions
// =============================================================================

/**
 * Update the status of a registration
 */
export async function updateAnmeldungStatus(
  anmeldungId: string,
  status: HelferAnmeldungStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helferliste:write')
    const supabase = await createClient()

    const { error } = await supabase
      .from('helfer_anmeldungen')
      .update({ status })
      .eq('id', anmeldungId)

    if (error) {
      console.error('Error updating anmeldung status:', error)
      return { success: false, error: 'Fehler beim Ändern des Status' }
    }

    await revalidateHelferlistePaths()
    return { success: true }
  } catch (error) {
    console.error('updateAnmeldungStatus failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

/**
 * Delete a registration
 */
export async function deleteAnmeldung(
  anmeldungId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helferliste:delete')
    const supabase = await createClient()

    const { error } = await supabase
      .from('helfer_anmeldungen')
      .delete()
      .eq('id', anmeldungId)

    if (error) {
      console.error('Error deleting anmeldung:', error)
      return { success: false, error: 'Fehler beim Löschen der Anmeldung' }
    }

    await revalidateHelferlistePaths()
    return { success: true }
  } catch (error) {
    console.error('deleteAnmeldung failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// =============================================================================
// Sichtbarkeit Toggle
// =============================================================================

/**
 * Toggle role visibility between intern and public
 */
export async function toggleRolleSichtbarkeit(
  rolleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('helferliste:write')
    const supabase = await createClient()

    // Get current visibility
    const { data: rolle, error: fetchError } = await supabase
      .from('helfer_rollen_instanzen')
      .select('sichtbarkeit')
      .eq('id', rolleId)
      .single()

    if (fetchError || !rolle) {
      return { success: false, error: 'Rolle nicht gefunden' }
    }

    const newSichtbarkeit: RollenSichtbarkeit =
      rolle.sichtbarkeit === 'intern' ? 'public' : 'intern'

    const { error } = await supabase
      .from('helfer_rollen_instanzen')
      .update({ sichtbarkeit: newSichtbarkeit })
      .eq('id', rolleId)

    if (error) {
      console.error('Error toggling sichtbarkeit:', error)
      return { success: false, error: 'Fehler beim Ändern der Sichtbarkeit' }
    }

    await revalidateHelferlistePaths()
    return { success: true }
  } catch (error) {
    console.error('toggleRolleSichtbarkeit failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// =============================================================================
// Personen für Zuweisung
// =============================================================================

/**
 * Get all profiles for member assignment dropdown
 */
export async function getProfilesForAssignment(): Promise<{
  success: boolean
  data?: { id: string; display_name: string | null; email: string }[]
  error?: string
}> {
  try {
    await requirePermission('helferliste:read')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('is_active', true)
      .in('role', ['ADMIN', 'VORSTAND', 'MITGLIED_AKTIV'])
      .order('email', { ascending: true })

    if (error) {
      console.error('Error fetching profiles:', error)
      return { success: false, error: 'Fehler beim Laden der Profile' }
    }

    return { success: true, data: data ?? [] }
  } catch (error) {
    console.error('getProfilesForAssignment failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}
