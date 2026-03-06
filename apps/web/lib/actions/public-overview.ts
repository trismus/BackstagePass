'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase/admin'
import type {
  HelferEvent,
  HelferRollenInstanz,
  HelferRollenTemplate,
  BookHelferSlotResult,
} from '../supabase/types'
import { anmeldenPublicMulti } from './helferliste'

// =============================================================================
// Types
// =============================================================================

export type PublicOverviewRolle = Pick<
  HelferRollenInstanz,
  | 'id'
  | 'helfer_event_id'
  | 'template_id'
  | 'custom_name'
  | 'zeitblock_start'
  | 'zeitblock_end'
  | 'anzahl_benoetigt'
  | 'sichtbarkeit'
> & {
  template: Pick<HelferRollenTemplate, 'id' | 'name'> | null
  angemeldet_count: number
  freie_plaetze: number
}

export type PublicOverviewEventData = {
  event: Pick<
    HelferEvent,
    'id' | 'name' | 'datum_start' | 'datum_end' | 'ort' | 'public_token'
  > & {
    veranstaltung: { id: string; titel: string } | null
  }
  rollen: PublicOverviewRolle[]
}

export type PublicOverviewData = {
  events: PublicOverviewEventData[]
}

export type MultiRegistrationResult = {
  success: boolean
  results: BookHelferSlotResult[]
  dashboardToken?: string
  error?: string
  fieldErrors?: Record<string, string>
}

// =============================================================================
// Data Fetching
// =============================================================================

/**
 * Get all published helfer_events with available public roles.
 * No authentication required - this is for the public /mitmachen page.
 * Reads from System A (helfer_events + helfer_rollen_instanzen + helfer_anmeldungen).
 */
export async function getPublicShiftOverview(): Promise<PublicOverviewData> {
  const supabase = createAdminClient()

  // Get today's date (start of day) for filtering future events
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  // Fetch all helfer_events with future dates, including linked veranstaltung name
  const { data: events, error: eventsError } = await supabase
    .from('helfer_events')
    .select(`
      id,
      name,
      datum_start,
      datum_end,
      ort,
      public_token,
      veranstaltung:veranstaltungen(id, titel)
    `)
    .gte('datum_start', todayStr)
    .order('datum_start', { ascending: true })

  if (eventsError || !events?.length) {
    return { events: [] }
  }

  const eventIds = events.map((e) => e.id)

  // Fetch public rollen_instanzen with their templates and anmeldungen count
  const { data: rollen, error: rollenError } = await supabase
    .from('helfer_rollen_instanzen')
    .select(`
      id,
      helfer_event_id,
      template_id,
      custom_name,
      zeitblock_start,
      zeitblock_end,
      anzahl_benoetigt,
      sichtbarkeit,
      template:helfer_rollen_templates(id, name),
      anmeldungen:helfer_anmeldungen(id, status)
    `)
    .in('helfer_event_id', eventIds)
    .eq('sichtbarkeit', 'public')
    .order('zeitblock_start', { ascending: true })

  if (rollenError) {
    return { events: [] }
  }

  const alleRollen = rollen || []

  // Build events with rollen
  const result: PublicOverviewEventData[] = []

  for (const event of events) {
    const eventRollen = alleRollen
      .filter((r) => r.helfer_event_id === event.id)
      .map((r) => {
        const anmeldungen = (r.anmeldungen as unknown as { id: string; status: string }[]) || []
        const angemeldet_count = anmeldungen.filter(
          (a) => a.status !== 'abgelehnt'
        ).length
        const freie_plaetze = Math.max(0, r.anzahl_benoetigt - angemeldet_count)

        return {
          id: r.id,
          helfer_event_id: r.helfer_event_id,
          template_id: r.template_id,
          custom_name: r.custom_name,
          zeitblock_start: r.zeitblock_start,
          zeitblock_end: r.zeitblock_end,
          anzahl_benoetigt: r.anzahl_benoetigt,
          sichtbarkeit: r.sichtbarkeit as 'intern' | 'public',
          template: (Array.isArray(r.template) ? r.template[0] : r.template) as { id: string; name: string } | null,
          angemeldet_count,
          freie_plaetze,
        }
      })

    // Only include events that have at least one role with free spots
    const hasFreeSpots = eventRollen.some((r) => r.freie_plaetze > 0)

    if (eventRollen.length > 0 && hasFreeSpots) {
      result.push({
        event: {
          id: event.id,
          name: event.name,
          datum_start: event.datum_start,
          datum_end: event.datum_end,
          ort: event.ort,
          public_token: event.public_token,
          veranstaltung: (Array.isArray(event.veranstaltung) ? event.veranstaltung[0] : event.veranstaltung) as { id: string; titel: string } | null,
        },
        rollen: eventRollen,
      })
    }
  }

  return { events: result }
}

// =============================================================================
// Multi-Role Registration (delegates to System A)
// =============================================================================

/**
 * Register an external helper for multiple roles across events.
 * Delegates to anmeldenPublicMulti() from helferliste.ts (System A).
 */
export async function registerForMultipleShifts(
  rollenInstanzIds: string[],
  helperData: {
    email: string
    vorname: string
    nachname: string
    telefon?: string
    datenschutz: boolean
  }
): Promise<MultiRegistrationResult> {
  if (!rollenInstanzIds.length) {
    return { success: false, results: [], error: 'Keine Rollen ausgewählt' }
  }

  const result = await anmeldenPublicMulti(rollenInstanzIds, {
    vorname: helperData.vorname,
    nachname: helperData.nachname,
    email: helperData.email,
    telefon: helperData.telefon,
    datenschutz: helperData.datenschutz,
  })

  if (!result.success) {
    return {
      success: false,
      results: result.results || [],
      error: result.error,
      fieldErrors: result.fieldErrors,
    }
  }

  // Get dashboard token for the helper
  const supabase = createAdminClient()
  const { data: helperId } = await supabase.rpc(
    'find_or_create_external_helper',
    {
      p_email: helperData.email,
      p_vorname: helperData.vorname,
      p_nachname: helperData.nachname,
      p_telefon: helperData.telefon || null,
    }
  )

  let dashboardToken: string | undefined
  if (helperId) {
    const { data: token } = await supabase.rpc(
      'get_externe_helfer_dashboard_token',
      { p_helper_id: helperId as string }
    )
    dashboardToken = (token as string) || undefined
  }

  revalidatePath('/mitmachen')

  return {
    success: true,
    results: result.results || [],
    dashboardToken,
  }
}
