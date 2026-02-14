'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase/admin'
import { externeHelferRegistrierungSchema } from '../validations/externe-helfer'
import { sendEmail } from '../email/client'
import {
  multiRegistrationConfirmationEmail,
  type ShiftInfo,
} from '../email/templates/helferliste'
import { getKoordinatorInfo } from './email-sender'
import { formatDateForEmail, formatTimeForEmail } from '../utils/email-renderer'
import type {
  PublicVeranstaltungData,
  PublicSchichtData,
  PublicZeitblockData,
} from './external-registration'

// =============================================================================
// Types
// =============================================================================

export type PublicOverviewEventData = {
  veranstaltung: PublicVeranstaltungData & { public_helfer_token: string }
  zeitbloecke: PublicZeitblockData[]
}

export type PublicOverviewData = {
  events: PublicOverviewEventData[]
}

export type MultiRegistrationResult = {
  success: boolean
  results: Array<{
    schichtId: string
    success: boolean
    error?: string
    waitlist?: boolean
  }>
  dashboardToken?: string
  error?: string
}

// =============================================================================
// Data Fetching
// =============================================================================

/**
 * Get all published events with available public shifts.
 * No authentication required - this is for the public /mitmachen page.
 */
export async function getPublicShiftOverview(): Promise<PublicOverviewData> {
  const supabase = createAdminClient()

  // Get today's date (start of day) for filtering
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  // Fetch all published veranstaltungen with future dates
  const { data: veranstaltungen, error: veranstaltungenError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, startzeit, endzeit, ort, helfer_status, public_helfer_token')
    .eq('helfer_status', 'veroeffentlicht')
    .gte('datum', todayStr)
    .order('datum', { ascending: true })

  if (veranstaltungenError || !veranstaltungen?.length) {
    return { events: [] }
  }

  const veranstaltungIds = veranstaltungen.map((v) => v.id)

  // Fetch zeitbloecke and schichten in parallel
  const [zeitblockResult, schichtenResult] = await Promise.all([
    supabase
      .from('zeitbloecke')
      .select('id, name, startzeit, endzeit, typ, sortierung, veranstaltung_id')
      .in('veranstaltung_id', veranstaltungIds)
      .order('sortierung', { ascending: true }),
    supabase
      .from('auffuehrung_schichten')
      .select(`
        id,
        rolle,
        anzahl_benoetigt,
        zeitblock_id,
        veranstaltung_id,
        zuweisungen:auffuehrung_zuweisungen(id, status)
      `)
      .in('veranstaltung_id', veranstaltungIds)
      .eq('sichtbarkeit', 'public'),
  ])

  if (zeitblockResult.error || schichtenResult.error) {
    return { events: [] }
  }

  const zeitbloecke = zeitblockResult.data || []
  const schichten = schichtenResult.data || []

  // Build events
  const events: PublicOverviewEventData[] = []

  for (const v of veranstaltungen) {
    if (!v.public_helfer_token) continue

    const eventZeitbloecke = zeitbloecke.filter(
      (zb) => zb.veranstaltung_id === v.id
    )
    const eventSchichten = schichten.filter(
      (s) => s.veranstaltung_id === v.id
    )

    // Group schichten by zeitblock
    const zeitblockMap = new Map<string | null, PublicSchichtData[]>()

    for (const schicht of eventSchichten) {
      const zuweisungen =
        (schicht.zuweisungen as unknown as { id: string; status: string }[]) ||
        []
      const anzahl_belegt = zuweisungen.filter(
        (z) => z.status !== 'abgesagt'
      ).length
      const freie_plaetze = Math.max(
        0,
        schicht.anzahl_benoetigt - anzahl_belegt
      )

      const zeitblock = eventZeitbloecke.find(
        (zb) => zb.id === schicht.zeitblock_id
      )

      const schichtData: PublicSchichtData = {
        id: schicht.id,
        rolle: schicht.rolle,
        anzahl_benoetigt: schicht.anzahl_benoetigt,
        zeitblock: zeitblock
          ? {
              id: zeitblock.id,
              name: zeitblock.name,
              startzeit: zeitblock.startzeit,
              endzeit: zeitblock.endzeit,
            }
          : null,
        anzahl_belegt,
        freie_plaetze,
      }

      const key = schicht.zeitblock_id
      if (!zeitblockMap.has(key)) {
        zeitblockMap.set(key, [])
      }
      zeitblockMap.get(key)!.push(schichtData)
    }

    // Build zeitblock data with grouped schichten
    const transformedZeitbloecke: PublicZeitblockData[] = eventZeitbloecke
      .filter((zb) => zeitblockMap.has(zb.id))
      .map((zb) => ({
        id: zb.id,
        name: zb.name,
        startzeit: zb.startzeit,
        endzeit: zb.endzeit,
        typ: zb.typ,
        sortierung: zb.sortierung,
        schichten: zeitblockMap.get(zb.id) || [],
      }))

    // Add schichten without zeitblock
    const orphanSchichten = zeitblockMap.get(null)
    if (orphanSchichten?.length) {
      transformedZeitbloecke.push({
        id: 'ohne-zeitblock',
        name: 'Allgemein',
        startzeit: v.startzeit || '00:00',
        endzeit: v.endzeit || '23:59',
        typ: 'standard',
        sortierung: 9999,
        schichten: orphanSchichten,
      })
    }

    // Only include events that have at least one shift with free spots
    const hasFreeSpots = transformedZeitbloecke.some((zb) =>
      zb.schichten.some((s) => s.freie_plaetze > 0)
    )

    if (transformedZeitbloecke.length > 0 && hasFreeSpots) {
      events.push({
        veranstaltung: {
          id: v.id,
          titel: v.titel,
          datum: v.datum,
          startzeit: v.startzeit,
          endzeit: v.endzeit,
          ort: v.ort,
          helfer_status: v.helfer_status!,
          public_helfer_token: v.public_helfer_token,
        },
        zeitbloecke: transformedZeitbloecke,
      })
    }
  }

  return { events }
}

// =============================================================================
// Multi-Shift Registration
// =============================================================================

/**
 * Register an external helper for multiple shifts across events.
 * No authentication required - uses admin client.
 */
export async function registerForMultipleShifts(
  schichtIds: string[],
  helperData: {
    email: string
    vorname: string
    nachname: string
    telefon?: string
  }
): Promise<MultiRegistrationResult> {
  if (!schichtIds.length) {
    return { success: false, results: [], error: 'Keine Schichten ausgewählt' }
  }

  // Validate helper data
  const parseResult = externeHelferRegistrierungSchema.safeParse(helperData)
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0]
    return { success: false, results: [], error: firstIssue.message }
  }
  const validData = parseResult.data

  const supabase = createAdminClient()

  // Find or create external helper profile (once)
  const { data: helperId, error: helperError } = await supabase.rpc(
    'find_or_create_external_helper',
    {
      p_email: validData.email,
      p_vorname: validData.vorname,
      p_nachname: validData.nachname,
      p_telefon: validData.telefon || null,
    }
  )

  if (helperError || !helperId) {
    console.error('Error creating helper profile:', helperError)
    return {
      success: false,
      results: [],
      error: 'Fehler bei der Registrierung',
    }
  }

  // Process each shift sequentially
  const results: MultiRegistrationResult['results'] = []

  for (const schichtId of schichtIds) {
    const result = await registerSingleShift(supabase, schichtId, helperId)
    results.push({ schichtId, ...result })
  }

  // Get dashboard token
  const { data: dashboardToken } = await supabase.rpc(
    'get_externe_helfer_dashboard_token',
    { p_helper_id: helperId }
  )

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

  return {
    success: anySuccess,
    results,
    dashboardToken: dashboardToken || undefined,
  }
}

// =============================================================================
// Helper: Single Shift Registration
// =============================================================================

async function registerSingleShift(
  supabase: ReturnType<typeof createAdminClient>,
  schichtId: string,
  helperId: string
): Promise<{ success: boolean; error?: string; waitlist?: boolean }> {
  // Verify schicht exists and is public
  const { data: schicht, error: schichtError } = await supabase
    .from('auffuehrung_schichten')
    .select('id, veranstaltung_id, anzahl_benoetigt, sichtbarkeit')
    .eq('id', schichtId)
    .single()

  if (schichtError || !schicht) {
    return { success: false, error: 'Schicht nicht gefunden' }
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
