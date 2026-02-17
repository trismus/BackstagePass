'use server'

import { createClient } from '../supabase/server'
import type {
  HelferEvent,
  BookHelferSlotResult,
  BookHelferSlotsResult,
  CheckHelferTimeConflictsResult,
  HelferTimeConflict,
  InfoBlock,
  PublicHelferEventData,
  RollenInstanzMitAnmeldungen,
} from '../supabase/types'
import {
  notifyMultiRegistrationConfirmed,
} from './helferliste-notifications'
import { externeHelferRegistrierungFormSchema } from '../validations/externe-helfer'

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
      .select('id, veranstaltung_id, titel, beschreibung, startzeit, endzeit, sortierung, created_at')
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
 * Register for multiple public roles at once (external helper)
 * Uses atomic DB function book_helfer_slots() for all-or-nothing booking
 * Validates with externeHelferRegistrierungFormSchema (DSGVO consent required)
 */
export async function anmeldenPublicMulti(
  rollenInstanzIds: string[],
  data: {
    vorname: string
    nachname: string
    email: string
    telefon?: string
    datenschutz: boolean
  }
): Promise<{
  success: boolean
  error?: string
  fieldErrors?: Record<string, string>
  results?: BookHelferSlotResult[]
  conflicts?: HelferTimeConflict[]
}> {
  if (!rollenInstanzIds.length) {
    return { success: false, error: 'Mindestens eine Rolle muss ausgewählt werden' }
  }

  // Server-side validation with Zod schema
  const parsed = externeHelferRegistrierungFormSchema.safeParse(data)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString()
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message
      }
    }
    return {
      success: false,
      error: Object.values(fieldErrors)[0] || 'Ungültige Eingabe',
      fieldErrors,
    }
  }

  const validated = parsed.data
  const supabase = await createClient()

  // Find or create the external helper profile (email is now required)
  const { data: helperId, error: helperError } = await supabase
    .rpc('find_or_create_external_helper', {
      p_email: validated.email,
      p_vorname: validated.vorname,
      p_nachname: validated.nachname,
      p_telefon: data.telefon || null,
    })

  if (helperError) {
    console.error('Error finding/creating helper profile:', helperError)
    return { success: false, error: 'Fehler bei der Registrierung' }
  }

  const externalHelperId = helperId as string

  // Check max_anmeldungen_pro_helfer limit
  const { data: instanzData } = await supabase
    .from('helfer_rollen_instanzen')
    .select('helfer_event_id')
    .in('id', rollenInstanzIds)
    .limit(1)

  if (instanzData?.[0]) {
    const { data: eventData } = await supabase
      .from('helfer_events')
      .select('max_anmeldungen_pro_helfer')
      .eq('id', instanzData[0].helfer_event_id)
      .single()

    const maxLimit = (eventData as HelferEvent | null)?.max_anmeldungen_pro_helfer
    if (maxLimit !== null && maxLimit !== undefined) {
      const { count } = await supabase
        .from('helfer_anmeldungen')
        .select('id', { count: 'exact', head: true })
        .eq('external_helper_id', externalHelperId)
        .in(
          'rollen_instanz_id',
          (
            await supabase
              .from('helfer_rollen_instanzen')
              .select('id')
              .eq('helfer_event_id', instanzData[0].helfer_event_id)
          ).data?.map((r: { id: string }) => r.id) || []
        )
        .neq('status', 'abgelehnt')

      const existingCount = count || 0
      if (existingCount + rollenInstanzIds.length > maxLimit) {
        return {
          success: false,
          error: `Maximal ${maxLimit} Anmeldungen pro Helfer erlaubt (${existingCount} bestehend + ${rollenInstanzIds.length} neu)`,
        }
      }
    }
  }

  // Check for time conflicts via DB function
  const { data: conflictCheck } = await supabase.rpc(
    'check_helfer_time_conflicts',
    {
      p_rollen_instanz_ids: rollenInstanzIds,
      p_external_helper_id: externalHelperId,
    }
  )

  const conflicts = conflictCheck as CheckHelferTimeConflictsResult | null
  if (conflicts?.has_conflicts) {
    const existingConflicts = conflicts.conflicts.filter(
      (c) =>
        !rollenInstanzIds.includes(c.instanz_a) ||
        !rollenInstanzIds.includes(c.instanz_b)
    )
    if (existingConflicts.length > 0) {
      return {
        success: false,
        error: 'Zeitüberschneidung mit bestehenden Anmeldungen',
        conflicts: existingConflicts,
      }
    }
  }

  // Atomic multi-slot booking via DB function
  const { data: result, error } = await supabase.rpc('book_helfer_slots', {
    p_rollen_instanz_ids: rollenInstanzIds,
    p_external_helper_id: externalHelperId,
    p_datenschutz_akzeptiert: new Date().toISOString(),
  })

  if (error) {
    console.error('Error booking helfer slots:', error)
    return { success: false, error: 'Fehler bei der Anmeldung' }
  }

  const booking = result as BookHelferSlotsResult
  if (!booking.success) {
    return { success: false, error: booking.error, results: booking.results }
  }

  // Send single batched confirmation email async (don't block)
  if (booking.results) {
    const anmeldungIds = booking.results
      .filter((slot) => slot.anmeldung_id)
      .map((slot) => slot.anmeldung_id!)

    if (anmeldungIds.length > 0) {
      const { data: dashboardToken } = await supabase.rpc(
        'get_externe_helfer_dashboard_token',
        { p_helper_id: externalHelperId }
      )

      notifyMultiRegistrationConfirmed(
        anmeldungIds,
        externalHelperId,
        dashboardToken as string,
        validated.email,
        `${validated.vorname} ${validated.nachname}`
      ).catch(console.error)
    }
  }

  return {
    success: true,
    results: booking.results,
    conflicts: conflicts?.conflicts,
  }
}
