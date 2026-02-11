'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { getUserProfile } from '../supabase/server'
import { isManagement } from '../supabase/auth-helpers'
import type {
  HelferEvent,
  HelferEventInsert,
  HelferEventUpdate,
  HelferEventMitDetails,
  HelferEventMitRollen,
  HelferRollenInstanzInsert,
  HelferRollenInstanzUpdate,
  RollenInstanzMitAnmeldungen,
  HelferAnmeldung,
  HelferAnmeldungMitDetails,
  BookHelferSlotResult,
  CheckHelferTimeConflictsResult,
  InfoBlock,
  PublicHelferEventData,
} from '../supabase/types'
import {
  notifyRegistrationConfirmed,
  notifyStatusChange,
} from './helferliste-notifications'

// =============================================================================
// Helfer Events
// =============================================================================

/**
 * Get all helfer events with basic counts
 */
export async function getHelferEvents(): Promise<HelferEventMitDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('helfer_events')
    .select(
      `
      *,
      veranstaltung:veranstaltungen(id, titel),
      rollen:helfer_rollen_instanzen(id)
    `
    )
    .order('datum_start', { ascending: true })

  if (error) {
    console.error('Error fetching helfer events:', error)
    return []
  }

  return (data || []).map((event) => ({
    ...event,
    veranstaltung: event.veranstaltung || null,
    rollen_count: event.rollen?.length || 0,
    anmeldungen_count: 0, // Will be computed if needed
  })) as HelferEventMitDetails[]
}

/**
 * Get upcoming helfer events
 */
export async function getUpcomingHelferEvents(
  limit?: number
): Promise<HelferEventMitDetails[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  let query = supabase
    .from('helfer_events')
    .select(
      `
      *,
      veranstaltung:veranstaltungen(id, titel),
      rollen:helfer_rollen_instanzen(id)
    `
    )
    .gte('datum_end', now)
    .order('datum_start', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching upcoming helfer events:', error)
    return []
  }

  return (data || []).map((event) => ({
    ...event,
    veranstaltung: event.veranstaltung || null,
    rollen_count: event.rollen?.length || 0,
    anmeldungen_count: 0,
  })) as HelferEventMitDetails[]
}

/**
 * Get a single helfer event by ID
 */
export async function getHelferEvent(id: string): Promise<HelferEvent | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('helfer_events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching helfer event:', error)
    return null
  }

  return data as HelferEvent
}

/**
 * Get a helfer event with all roles and registrations
 */
export async function getHelferEventMitRollen(
  id: string
): Promise<HelferEventMitRollen | null> {
  const supabase = await createClient()

  // Get event
  const { data: event, error: eventError } = await supabase
    .from('helfer_events')
    .select(
      `
      *,
      veranstaltung:veranstaltungen(id, titel)
    `
    )
    .eq('id', id)
    .single()

  if (eventError) {
    console.error('Error fetching helfer event:', eventError)
    return null
  }

  // Get roles with registrations
  const { data: rollen, error: rollenError } = await supabase
    .from('helfer_rollen_instanzen')
    .select(
      `
      *,
      template:helfer_rollen_templates(id, name),
      anmeldungen:helfer_anmeldungen(
        *,
        profile:profiles(id, display_name, email)
      )
    `
    )
    .eq('helfer_event_id', id)
    .order('zeitblock_start', { ascending: true })

  if (rollenError) {
    console.error('Error fetching rollen:', rollenError)
    return null
  }

  const rollenMitCount = (rollen || []).map((rolle) => ({
    ...rolle,
    angemeldet_count:
      rolle.anmeldungen?.filter(
        (a: HelferAnmeldung) => a.status !== 'abgelehnt'
      ).length || 0,
  }))

  return {
    ...event,
    veranstaltung: event.veranstaltung || null,
    rollen: rollenMitCount as RollenInstanzMitAnmeldungen[],
  } as HelferEventMitRollen
}

/**
 * Create a new helfer event
 */
export async function createHelferEvent(
  data: HelferEventInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('helfer_events')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating helfer event:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste')
  return { success: true, id: result?.id }
}

/**
 * Update an existing helfer event
 */
export async function updateHelferEvent(
  id: string,
  data: HelferEventUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('helfer_events')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating helfer event:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste')
  revalidatePath(`/helferliste/${id}`)
  return { success: true }
}

/**
 * Delete a helfer event (ADMIN only - enforced by RLS)
 */
export async function deleteHelferEvent(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from('helfer_events').delete().eq('id', id)

  if (error) {
    console.error('Error deleting helfer event:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste')
  return { success: true }
}

// =============================================================================
// Rollen Instanzen (Role Instances)
// =============================================================================

/**
 * Get all role instances for an event
 */
export async function getRollenInstanzen(
  helferEventId: string
): Promise<RollenInstanzMitAnmeldungen[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('helfer_rollen_instanzen')
    .select(
      `
      *,
      template:helfer_rollen_templates(id, name),
      anmeldungen:helfer_anmeldungen(
        *,
        profile:profiles(id, display_name, email)
      )
    `
    )
    .eq('helfer_event_id', helferEventId)
    .order('zeitblock_start', { ascending: true })

  if (error) {
    console.error('Error fetching rollen instanzen:', error)
    return []
  }

  return (data || []).map((rolle) => ({
    ...rolle,
    angemeldet_count:
      rolle.anmeldungen?.filter(
        (a: HelferAnmeldung) => a.status !== 'abgelehnt'
      ).length || 0,
  })) as RollenInstanzMitAnmeldungen[]
}

/**
 * Create a new role instance for an event
 */
export async function createRollenInstanz(
  data: HelferRollenInstanzInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('helfer_rollen_instanzen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating rollen instanz:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste')
  revalidatePath(`/helferliste/${data.helfer_event_id}`)
  return { success: true, id: result?.id }
}

/**
 * Create multiple role instances from templates
 */
export async function createRollenInstanzenFromTemplates(
  helferEventId: string,
  templateIds: string[],
  defaults?: {
    zeitblock_start?: string
    zeitblock_end?: string
    sichtbarkeit?: 'intern' | 'public'
  }
): Promise<{ success: boolean; error?: string; count?: number }> {
  const supabase = await createClient()

  // Get templates
  const { data: templates, error: templatesError } = await supabase
    .from('helfer_rollen_templates')
    .select('*')
    .in('id', templateIds)

  if (templatesError || !templates) {
    console.error('Error fetching templates:', templatesError)
    return { success: false, error: 'Fehler beim Laden der Vorlagen' }
  }

  // Create instances
  const instanzen = templates.map((template) => ({
    helfer_event_id: helferEventId,
    template_id: template.id,
    anzahl_benoetigt: template.default_anzahl,
    zeitblock_start: defaults?.zeitblock_start || null,
    zeitblock_end: defaults?.zeitblock_end || null,
    sichtbarkeit: defaults?.sichtbarkeit || 'intern',
  }))

  const { error } = await supabase
    .from('helfer_rollen_instanzen')
    .insert(instanzen as never[])

  if (error) {
    console.error('Error creating rollen instanzen:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste')
  revalidatePath(`/helferliste/${helferEventId}`)
  return { success: true, count: instanzen.length }
}

/**
 * Update a role instance
 */
export async function updateRollenInstanz(
  id: string,
  data: HelferRollenInstanzUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('helfer_rollen_instanzen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating rollen instanz:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste')
  return { success: true }
}

/**
 * Delete a role instance
 */
export async function deleteRollenInstanz(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('helfer_rollen_instanzen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting rollen instanz:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste')
  return { success: true }
}

// =============================================================================
// Anmeldungen (Registrations)
// =============================================================================

/**
 * Get all registrations for a role instance
 */
export async function getAnmeldungen(
  rollenInstanzId: string
): Promise<HelferAnmeldung[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('helfer_anmeldungen')
    .select('*')
    .eq('rollen_instanz_id', rollenInstanzId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching anmeldungen:', error)
    return []
  }

  return (data || []) as HelferAnmeldung[]
}

/**
 * Get own registrations for the current user
 */
export async function getOwnAnmeldungen(): Promise<
  HelferAnmeldungMitDetails[]
> {
  const profile = await getUserProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('helfer_anmeldungen')
    .select(
      `
      *,
      rollen_instanz:helfer_rollen_instanzen(
        *,
        template:helfer_rollen_templates(id, name),
        helfer_event:helfer_events(id, name, datum_start, datum_end, ort)
      ),
      profile:profiles(id, display_name, email)
    `
    )
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching own anmeldungen:', error)
    return []
  }

  return (data || []) as HelferAnmeldungMitDetails[]
}

/**
 * Register for a role (internal - authenticated user)
 * Uses atomic DB function to prevent race conditions
 */
export async function anmelden(
  rollenInstanzId: string
): Promise<{ success: boolean; error?: string; id?: string; isWaitlist?: boolean; abmeldungToken?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Check for time conflicts via DB function
  const { data: conflictCheck } = await supabase.rpc('check_helfer_time_conflicts', {
    p_rollen_instanz_ids: [rollenInstanzId],
    p_profile_id: profile.id,
  })

  const conflicts = conflictCheck as CheckHelferTimeConflictsResult | null
  if (conflicts?.has_conflicts) {
    const conflict = conflicts.conflicts[0]
    return {
      success: false,
      error: `Zeitüberschneidung mit "${conflict?.rolle_b || 'anderem Einsatz'}"`,
    }
  }

  // Atomic booking via DB function (handles capacity + duplicate check)
  const { data: result, error } = await supabase.rpc('book_helfer_slot', {
    p_rollen_instanz_id: rollenInstanzId,
    p_profile_id: profile.id,
  })

  if (error) {
    console.error('Error booking helfer slot:', error)
    if (error.code === '23505') {
      return { success: false, error: 'Bereits angemeldet' }
    }
    return { success: false, error: error.message }
  }

  const booking = result as BookHelferSlotResult
  if (!booking.success) {
    return { success: false, error: booking.error }
  }

  // Send confirmation email (async, don't block)
  if (booking.anmeldung_id) {
    notifyRegistrationConfirmed(booking.anmeldung_id, booking.is_waitlist ?? false).catch(console.error)
  }

  revalidatePath('/helferliste')
  revalidatePath('/mein-bereich')
  return { success: true, id: booking.anmeldung_id, isWaitlist: booking.is_waitlist, abmeldungToken: booking.abmeldung_token }
}

/**
 * Cancel a registration
 */
export async function abmelden(
  anmeldungId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Check if user owns this registration or is management
  const { data: anmeldung } = await supabase
    .from('helfer_anmeldungen')
    .select('profile_id')
    .eq('id', anmeldungId)
    .single()

  if (!anmeldung) {
    return { success: false, error: 'Anmeldung nicht gefunden' }
  }

  if (anmeldung.profile_id !== profile.id && !isManagement(profile.role)) {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const { error } = await supabase
    .from('helfer_anmeldungen')
    .delete()
    .eq('id', anmeldungId)

  if (error) {
    console.error('Error deleting anmeldung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste')
  revalidatePath('/mein-bereich')
  return { success: true }
}

/**
 * Update registration status (management only)
 */
export async function updateAnmeldungStatus(
  anmeldungId: string,
  status: HelferAnmeldung['status']
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('helfer_anmeldungen')
    .update({ status } as never)
    .eq('id', anmeldungId)

  if (error) {
    console.error('Error updating anmeldung status:', error)
    return { success: false, error: error.message }
  }

  // Send notification for status changes (async, don't block)
  if (status === 'bestaetigt' || status === 'abgelehnt' || status === 'warteliste') {
    notifyStatusChange(anmeldungId, status).catch(console.error)
  }

  revalidatePath('/helferliste')
  return { success: true }
}

// =============================================================================
// Public Access (via token)
// =============================================================================

/**
 * Get a public event by token (no authentication required)
 */
export async function getPublicEventByToken(
  token: string
): Promise<PublicHelferEventData | null> {
  const supabase = await createClient()

  // Get event by public token
  const { data: event, error: eventError } = await supabase
    .from('helfer_events')
    .select(
      `
      *,
      veranstaltung:veranstaltungen(id, titel)
    `
    )
    .eq('public_token', token)
    .single()

  if (eventError || !event) {
    console.error('Error fetching public event:', eventError)
    return null
  }

  // Get only public roles
  const { data: rollen, error: rollenError } = await supabase
    .from('helfer_rollen_instanzen')
    .select(
      `
      *,
      template:helfer_rollen_templates(id, name),
      anmeldungen:helfer_anmeldungen(
        id,
        external_name,
        status,
        created_at
      )
    `
    )
    .eq('helfer_event_id', event.id)
    .eq('sichtbarkeit', 'public')
    .order('zeitblock_start', { ascending: true })

  if (rollenError) {
    console.error('Error fetching public rollen:', rollenError)
    return null
  }

  const rollenMitCount = (rollen || []).map((rolle) => ({
    ...rolle,
    angemeldet_count:
      rolle.anmeldungen?.filter(
        (a: { status: string }) => a.status !== 'abgelehnt'
      ).length || 0,
  }))

  // Fetch info blocks if event is linked to a veranstaltung
  let infoBloecke: InfoBlock[] = []
  if (event.veranstaltung_id) {
    const { data: infoData } = await supabase
      .from('info_bloecke')
      .select('*')
      .eq('veranstaltung_id', event.veranstaltung_id)
      .order('sortierung', { ascending: true })

    if (infoData) {
      infoBloecke = infoData as InfoBlock[]
    }
  }

  return {
    ...event,
    veranstaltung: event.veranstaltung || null,
    rollen: rollenMitCount as RollenInstanzMitAnmeldungen[],
    infoBloecke,
  } as PublicHelferEventData
}

/**
 * Register for a public role (external helper)
 * Uses atomic DB function to prevent race conditions
 */
export async function anmeldenPublic(
  rollenInstanzId: string,
  data: {
    name: string
    email?: string
    telefon?: string
  }
): Promise<{ success: boolean; error?: string; id?: string; isWaitlist?: boolean; abmeldungToken?: string }> {
  const supabase = await createClient()

  // If email provided, find or create the external helper profile
  let externalHelperId: string | null = null
  if (data.email) {
    const nameParts = data.name.trim().split(/\s+/)
    const vorname = nameParts[0] || data.name
    const nachname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : vorname

    const { data: helperId, error: helperError } = await supabase
      .rpc('find_or_create_external_helper', {
        p_email: data.email,
        p_vorname: vorname,
        p_nachname: nachname,
        p_telefon: data.telefon || null,
      })

    if (helperError) {
      console.error('Error finding/creating helper profile:', helperError)
      return { success: false, error: 'Fehler bei der Registrierung' }
    }

    externalHelperId = helperId as string
  }

  // Atomic booking via DB function (handles capacity + waitlist automatically)
  const rpcParams: Record<string, unknown> = {
    p_rollen_instanz_id: rollenInstanzId,
  }

  if (externalHelperId) {
    rpcParams.p_external_helper_id = externalHelperId
  } else {
    rpcParams.p_external_name = data.name
    rpcParams.p_external_email = data.email || null
    rpcParams.p_external_telefon = data.telefon || null
  }

  const { data: result, error } = await supabase.rpc('book_helfer_slot', rpcParams)

  if (error) {
    console.error('Error booking helfer slot:', error)
    if (error.code === '23505') {
      return { success: false, error: 'Bereits für diese Rolle angemeldet' }
    }
    return { success: false, error: 'Fehler bei der Anmeldung' }
  }

  const booking = result as BookHelferSlotResult
  if (!booking.success) {
    return { success: false, error: booking.error }
  }

  // Send confirmation email (async, don't block)
  if (booking.anmeldung_id && data.email) {
    notifyRegistrationConfirmed(
      booking.anmeldung_id,
      booking.is_waitlist ?? false
    ).catch(console.error)
  }

  revalidatePath('/helferliste')
  return {
    success: true,
    id: booking.anmeldung_id,
    isWaitlist: booking.is_waitlist,
    abmeldungToken: booking.abmeldung_token,
  }
}
