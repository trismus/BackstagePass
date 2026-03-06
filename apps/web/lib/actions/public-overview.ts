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

  // Get dashboard token
  const { data: dashboardToken, error: tokenError } = await supabase.rpc(
    'get_externe_helfer_dashboard_token',
    { p_helper_id: helperId }
  )
  if (tokenError) {
    console.error('[PublicOverview] Failed to get dashboard token:', tokenError)
  }

  const anySuccess = results.some((r) => r.success)

  if (anySuccess) {
    revalidatePath('/mitmachen')

    // Fire-and-forget confirmation email
    const successSchichtIds = results.filter((r) => r.success).map((r) => r.schichtId)
    sendConfirmationEmail(
      supabase,
      successSchichtIds,
      results,
      validData,
      dashboardToken || undefined
    ).catch(console.error)
  }
  revalidatePath('/mitmachen')

  return {
    success: true,
    results: result.results || [],
    dashboardToken,
  }

  if (schicht.sichtbarkeit !== 'public') {
    return { success: false, error: 'Diese Schicht ist nicht öffentlich verfügbar' }
  }

  // Verify veranstaltung is still published and in the future
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, helfer_status, datum, helfer_buchung_deadline')
    .eq('id', schicht.veranstaltung_id)
    .single()

  if (veranstaltungError || !veranstaltung) {
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  if (veranstaltung.helfer_status !== 'veroeffentlicht') {
    return { success: false, error: 'Anmeldung nicht mehr möglich' }
  }

  const eventDate = new Date(veranstaltung.datum)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (eventDate < today) {
    return { success: false, error: 'Veranstaltung hat bereits stattgefunden' }
  }

  if (veranstaltung.helfer_buchung_deadline) {
    const deadline = new Date(veranstaltung.helfer_buchung_deadline)
    if (deadline < new Date()) {
      return { success: false, error: 'Anmeldefrist abgelaufen' }
    }
  }

  // Check duplicate
  const { data: existingZuweisung } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id')
    .eq('schicht_id', schichtId)
    .eq('external_helper_id', helperId)
    .neq('status', 'abgesagt')
    .single()

  if (existingZuweisung) {
    return { success: false, error: 'Bereits für diese Schicht angemeldet' }
  }

  // Check capacity
  const { count: currentCount } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id', { count: 'exact', head: true })
    .eq('schicht_id', schichtId)
    .neq('status', 'abgesagt')

  const isWaitlist = (currentCount ?? 0) >= schicht.anzahl_benoetigt

  // Create zuweisung
  const { error: insertError } = await supabase
    .from('auffuehrung_zuweisungen')
    .insert({
      schicht_id: schichtId,
      external_helper_id: helperId,
      status: 'zugesagt',
    } as never)

  if (insertError) {
    console.error('Error creating zuweisung:', insertError)
    if (insertError.code === '23505') {
      return { success: false, error: 'Bereits für diese Schicht angemeldet' }
    }
    return { success: false, error: 'Fehler bei der Anmeldung' }
  }

  return { success: true, waitlist: isWaitlist }
}

// =============================================================================
// Helper: Send Confirmation Email
// =============================================================================

async function sendConfirmationEmail(
  supabase: ReturnType<typeof createAdminClient>,
  successSchichtIds: string[],
  results: MultiRegistrationResult['results'],
  helperData: { email: string; vorname: string; nachname: string },
  dashboardToken: string | undefined
): Promise<void> {
  if (!successSchichtIds.length || !helperData.email) return

  // Fetch schichten with zeitblock and veranstaltung data
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      veranstaltung_id,
      zeitblock:zeitbloecke(id, name, startzeit, endzeit),
      zuweisungen:auffuehrung_zuweisungen(abmeldung_token, external_helper_id)
    `)
    .in('id', successSchichtIds)

  if (!schichten?.length) return

  // Get veranstaltung info from the first schicht
  const veranstaltungId = schichten[0].veranstaltung_id
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, ort, koordinator_id')
    .eq('id', veranstaltungId)
    .single()

  if (!veranstaltung) return

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Build shift info for email
  const shifts: ShiftInfo[] = schichten.map((s) => {
    const zeitblock = s.zeitblock as unknown as {
      id: string; name: string; startzeit: string; endzeit: string
    } | null
    const zuweisungen = (s.zuweisungen as unknown as {
      abmeldung_token: string | null; external_helper_id: string
    }[]) || []
    // Find the abmeldung_token for this helper's zuweisung
    const abmeldungToken = zuweisungen[zuweisungen.length - 1]?.abmeldung_token
    const resultEntry = results.find((r) => r.schichtId === s.id)

    return {
      rolle: s.rolle,
      zeitblock: zeitblock
        ? `${zeitblock.name} (${formatTimeForEmail(zeitblock.startzeit)}–${formatTimeForEmail(zeitblock.endzeit)})`
        : '',
      status: resultEntry?.waitlist ? 'warteliste' as const : 'angemeldet' as const,
      abmeldungLink: abmeldungToken
        ? `${baseUrl}/helfer/abmeldung/${abmeldungToken}`
        : '',
    }
  })

  const koordinator = await getKoordinatorInfo(veranstaltung.koordinator_id)

  const dashboardLink = dashboardToken
    ? `${baseUrl}/helfer/meine-einsaetze/${dashboardToken}`
    : `${baseUrl}/mitmachen`

  const { subject, html, text } = multiRegistrationConfirmationEmail(
    `${helperData.vorname} ${helperData.nachname}`,
    {
      name: veranstaltung.titel,
      datum: formatDateForEmail(veranstaltung.datum),
      ort: veranstaltung.ort || undefined,
    },
    shifts,
    dashboardLink,
    {
      name: koordinator.name,
      email: koordinator.email,
      telefon: koordinator.telefon || undefined,
    }
  )

  await sendEmail({
    to: helperData.email,
    subject,
    html,
    text,
    replyTo: koordinator.email,
  })
}
