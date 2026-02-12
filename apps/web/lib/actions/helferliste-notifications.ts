'use server'

import { createClient } from '../supabase/server'
import {
  sendEmail,
  isEmailServiceConfigured as isEmailConfigured,
} from '../email/client'
import {
  eventPublishedEmail,
  registrationConfirmationEmail,
  statusUpdateEmail,
  multiRegistrationConfirmationEmail,
  cancellationConfirmationEmail,
  waitlistPromotionEmail,
  type ShiftInfo,
} from '../email/templates/helferliste'
import {
  generateHelferSchichtIcal,
  mergeICalEvents,
  generateIcalFilename,
} from '../utils/ical-generator'

/**
 * Format date for display in emails
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-CH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format time range for display
 */
function formatTimeRange(start: string | null, end: string | null): string {
  if (!start || !end) return ''
  const startTime = new Date(start).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const endTime = new Date(end).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${startTime} - ${endTime}`
}

/**
 * Send notification when a new HelferEvent is published
 * Called when event status changes to 'publiziert' or is created as public
 */
export async function notifyEventPublished(
  eventId: string
): Promise<{ success: boolean; sent: number; errors: number }> {
  if (!isEmailConfigured()) {
    return { success: true, sent: 0, errors: 0 }
  }

  const supabase = await createClient()

  // Get event details
  const { data: event } = await supabase
    .from('helfer_events')
    .select('id, name, datum_start, ort, public_token')
    .eq('id', eventId)
    .single()

  if (!event) {
    return { success: false, sent: 0, errors: 1 }
  }

  // Get all active members who should receive notifications
  // (those with email and notification preference, if implemented)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('role', ['ADMIN', 'VORSTAND', 'MITGLIED_AKTIV', 'HELFER'])
    .not('email', 'is', null)

  if (!profiles || profiles.length === 0) {
    return { success: true, sent: 0, errors: 0 }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://backstagepass.app'
  const publicLink = event.public_token
    ? `${baseUrl}/public/helfer/${event.public_token}`
    : `${baseUrl}/helferliste/${event.id}`

  let sent = 0
  let errors = 0

  for (const profile of profiles) {
    if (!profile.email) continue

    const { subject, html, text } = eventPublishedEmail(
      profile.display_name || 'Helfer',
      {
        name: event.name,
        datum: formatDate(event.datum_start),
        ort: event.ort || undefined,
      },
      publicLink
    )

    const result = await sendEmail({
      to: profile.email,
      subject,
      html,
      text,
    })

    if (result.success) {
      sent++
    } else {
      errors++
    }
  }

  return { success: true, sent, errors }
}

/**
 * Send confirmation email after registration
 */
export async function notifyRegistrationConfirmed(
  anmeldungId: string,
  isWaitlist: boolean = false
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { success: true }
  }

  const supabase = await createClient()

  // Get registration with all details
  const { data: anmeldung } = await supabase
    .from('helfer_anmeldungen')
    .select(
      `
      id,
      profile_id,
      external_name,
      external_email,
      rollen_instanz:helfer_rollen_instanzen(
        zeitblock_start,
        zeitblock_end,
        template:helfer_rollen_templates(name),
        helfer_event:helfer_events(name, datum_start, ort)
      )
    `
    )
    .eq('id', anmeldungId)
    .single()

  if (!anmeldung) {
    return { success: false, error: 'Anmeldung nicht gefunden' }
  }

  // Get email address - either from profile or external
  let recipientEmail: string | null = null
  let recipientName = 'Helfer'

  if (anmeldung.profile_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', anmeldung.profile_id)
      .single()

    if (profile?.email) {
      recipientEmail = profile.email
      recipientName = profile.display_name || 'Helfer'
    }
  } else if (anmeldung.external_email) {
    recipientEmail = anmeldung.external_email
    recipientName = anmeldung.external_name || 'Helfer'
  }

  if (!recipientEmail) {
    return { success: true } // No email to send to
  }

  // Extract nested data safely
  const rollenInstanz = anmeldung.rollen_instanz as unknown as {
    zeitblock_start: string | null
    zeitblock_end: string | null
    template: { name: string } | null
    helfer_event: { name: string; datum_start: string; ort: string | null } | null
  } | null

  const helferEvent = rollenInstanz?.helfer_event
  const template = rollenInstanz?.template

  if (!helferEvent) {
    return { success: false, error: 'Event nicht gefunden' }
  }

  const { subject, html, text } = registrationConfirmationEmail(
    recipientName,
    {
      name: helferEvent.name,
      datum: formatDate(helferEvent.datum_start),
      ort: helferEvent.ort || undefined,
      rolle: template?.name || undefined,
      zeitblock: formatTimeRange(
        rollenInstanz?.zeitblock_start || null,
        rollenInstanz?.zeitblock_end || null
      ) || undefined,
    },
    isWaitlist
  )

  const result = await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  })

  return result.success
    ? { success: true }
    : { success: false, error: result.error }
}

/**
 * Send notification when registration status changes
 */
export async function notifyStatusChange(
  anmeldungId: string,
  newStatus: 'bestaetigt' | 'abgelehnt' | 'warteliste',
  message?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { success: true }
  }

  const supabase = await createClient()

  // Get registration with all details
  const { data: anmeldung } = await supabase
    .from('helfer_anmeldungen')
    .select(
      `
      id,
      profile_id,
      external_name,
      external_email,
      rollen_instanz:helfer_rollen_instanzen(
        template:helfer_rollen_templates(name),
        helfer_event:helfer_events(name, datum_start)
      )
    `
    )
    .eq('id', anmeldungId)
    .single()

  if (!anmeldung) {
    return { success: false, error: 'Anmeldung nicht gefunden' }
  }

  // Get email address
  let recipientEmail: string | null = null
  let recipientName = 'Helfer'

  if (anmeldung.profile_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', anmeldung.profile_id)
      .single()

    if (profile?.email) {
      recipientEmail = profile.email
      recipientName = profile.display_name || 'Helfer'
    }
  } else if (anmeldung.external_email) {
    recipientEmail = anmeldung.external_email
    recipientName = anmeldung.external_name || 'Helfer'
  }

  if (!recipientEmail) {
    return { success: true }
  }

  // Extract nested data safely
  const rollenInstanz = anmeldung.rollen_instanz as unknown as {
    template: { name: string } | null
    helfer_event: { name: string; datum_start: string } | null
  } | null

  const helferEvent = rollenInstanz?.helfer_event
  const template = rollenInstanz?.template

  if (!helferEvent) {
    return { success: false, error: 'Event nicht gefunden' }
  }

  const { subject, html, text } = statusUpdateEmail(
    recipientName,
    {
      name: helferEvent.name,
      datum: formatDate(helferEvent.datum_start),
      rolle: template?.name || undefined,
    },
    newStatus,
    message
  )

  const result = await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  })

  return result.success
    ? { success: true }
    : { success: false, error: result.error }
}

// =============================================================================
// Multi-Registration Confirmation (US-8)
// =============================================================================

/**
 * Build public cancellation link from abmeldung_token
 */
function buildAbmeldungLink(token: string | null): string {
  if (!token) return ''
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/helfer/helferliste/abmeldung/${token}`
}

/**
 * Extract YYYY-MM-DD from an ISO timestamp
 */
function formatISODate(dateStr: string): string {
  return dateStr.substring(0, 10)
}

/**
 * Extract HH:MM from an ISO timestamp
 */
function formatISOTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Send a single batched confirmation email after multi-slot booking.
 * Lists all shifts with per-shift cancellation links, dashboard link,
 * ICS calendar attachment for confirmed shifts.
 */
export async function notifyMultiRegistrationConfirmed(
  anmeldungIds: string[],
  _externalHelperId: string,
  dashboardToken: string,
  recipientEmail: string,
  recipientName: string
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { success: true }
  }

  const supabase = await createClient()

  // Fetch all registrations with role/event details in one query
  const { data: anmeldungen } = await supabase
    .from('helfer_anmeldungen')
    .select(
      `
      id,
      status,
      abmeldung_token,
      rollen_instanz:helfer_rollen_instanzen(
        zeitblock_start,
        zeitblock_end,
        template:helfer_rollen_templates(name),
        custom_name,
        helfer_event:helfer_events(
          id, name, datum_start, datum_end, ort,
          veranstaltung_id
        )
      )
    `
    )
    .in('id', anmeldungIds)

  if (!anmeldungen || anmeldungen.length === 0) {
    return { success: false, error: 'Keine Anmeldungen gefunden' }
  }

  // Extract event info from first registration (all belong to same event)
  type RollenInstanzNested = {
    zeitblock_start: string | null
    zeitblock_end: string | null
    template: { name: string } | null
    custom_name: string | null
    helfer_event: {
      id: string
      name: string
      datum_start: string
      datum_end: string
      ort: string | null
      veranstaltung_id: string | null
    } | null
  }

  const firstInstanz = anmeldungen[0].rollen_instanz as unknown as RollenInstanzNested | null
  const helferEvent = firstInstanz?.helfer_event

  if (!helferEvent) {
    return { success: false, error: 'Event nicht gefunden' }
  }

  // Build shift data for email template
  const shifts: ShiftInfo[] = anmeldungen.map((a) => {
    const instanz = a.rollen_instanz as unknown as RollenInstanzNested | null
    const rolle = instanz?.template?.name || instanz?.custom_name || 'Unbekannte Rolle'
    return {
      rolle,
      zeitblock: formatTimeRange(
        instanz?.zeitblock_start || null,
        instanz?.zeitblock_end || null
      ),
      status: a.status === 'warteliste' ? 'warteliste' : 'angemeldet',
      abmeldungLink: buildAbmeldungLink(a.abmeldung_token),
    }
  })

  // Build dashboard link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const dashboardLink = `${baseUrl}/helfer/meine-einsaetze/${dashboardToken}`

  // Fetch coordinator info (if event is linked to a veranstaltung)
  let koordinator: { name: string; email: string; telefon?: string } | undefined
  if (helferEvent.veranstaltung_id) {
    const { data: veranstaltung } = await supabase
      .from('veranstaltungen')
      .select('koordinator_id')
      .eq('id', helferEvent.veranstaltung_id)
      .single()

    if (veranstaltung?.koordinator_id) {
      const { data: person } = await supabase
        .from('personen')
        .select('vorname, nachname, email, telefon')
        .eq('id', veranstaltung.koordinator_id)
        .single()

      if (person?.email) {
        koordinator = {
          name: `${person.vorname} ${person.nachname}`,
          email: person.email,
          telefon: person.telefon || undefined,
        }
      }
    }
  }

  // Generate ICS for confirmed (non-waitlist) shifts
  const confirmedAnmeldungen = anmeldungen.filter((a) => a.status !== 'warteliste')
  let icsContent: string | null = null

  if (confirmedAnmeldungen.length > 0) {
    const icsEvents = confirmedAnmeldungen.map((a) => {
      const instanz = a.rollen_instanz as unknown as RollenInstanzNested | null
      const rolle = instanz?.template?.name || instanz?.custom_name || 'Helfereinsatz'
      const startStr = instanz?.zeitblock_start || helferEvent.datum_start
      const endStr = instanz?.zeitblock_end || helferEvent.datum_end

      return generateHelferSchichtIcal({
        veranstaltung: helferEvent.name,
        rolle,
        datum: formatISODate(startStr),
        startzeit: formatISOTime(startStr),
        endzeit: formatISOTime(endStr),
        ort: helferEvent.ort || undefined,
        koordinatorName: koordinator?.name,
        koordinatorEmail: koordinator?.email,
      })
    })

    icsContent = mergeICalEvents(icsEvents)
  }

  // Generate email
  const { subject, html, text } = multiRegistrationConfirmationEmail(
    recipientName,
    {
      name: helferEvent.name,
      datum: formatDate(helferEvent.datum_start),
      ort: helferEvent.ort || undefined,
    },
    shifts,
    dashboardLink,
    koordinator
  )

  // Send with ICS attachment
  const emailResult = await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
    replyTo: koordinator?.email,
    attachments: icsContent
      ? [
          {
            filename: generateIcalFilename(helferEvent.name, 'helfereinsaetze'),
            content: icsContent,
            contentType: 'text/calendar',
          },
        ]
      : undefined,
  })

  return emailResult.success
    ? { success: true }
    : { success: false, error: emailResult.error }
}

// =============================================================================
// Cancellation & Waitlist Promotion Notifications (US-10)
// =============================================================================

/**
 * Send cancellation confirmation email.
 * Called AFTER the anmeldung row is deleted, so all data is passed in.
 */
export async function notifyCancellationConfirmed(params: {
  recipientEmail: string
  recipientName: string
  eventName: string
  eventDatumStart: string
  eventOrt: string | null
  rolleName: string | null
  zeitblockStart: string | null
  zeitblockEnd: string | null
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { success: true }
  }

  const { subject, html, text } = cancellationConfirmationEmail(
    params.recipientName,
    {
      name: params.eventName,
      datum: formatDate(params.eventDatumStart),
      ort: params.eventOrt || undefined,
      rolle: params.rolleName || undefined,
      zeitblock:
        formatTimeRange(params.zeitblockStart, params.zeitblockEnd) || undefined,
    }
  )

  const result = await sendEmail({
    to: params.recipientEmail,
    subject,
    html,
    text,
  })

  return result.success
    ? { success: true }
    : { success: false, error: result.error }
}

/**
 * Send waitlist promotion email after auto-promoting a helper.
 */
export async function notifyWaitlistPromotion(
  anmeldungId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { success: true }
  }

  const supabase = await createClient()

  // Fetch the promoted registration with details
  const { data: anmeldung } = await supabase
    .from('helfer_anmeldungen')
    .select(
      `
      id,
      profile_id,
      external_helper_id,
      external_name,
      external_email,
      abmeldung_token,
      rollen_instanz:helfer_rollen_instanzen(
        zeitblock_start,
        zeitblock_end,
        template:helfer_rollen_templates(name),
        helfer_event:helfer_events(name, datum_start, ort)
      )
    `
    )
    .eq('id', anmeldungId)
    .single()

  if (!anmeldung) {
    return { success: false, error: 'Anmeldung nicht gefunden' }
  }

  // Resolve email: profile → externe_helfer_profile → external_email
  let recipientEmail: string | null = null
  let recipientName = 'Helfer'

  if (anmeldung.profile_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', anmeldung.profile_id)
      .single()

    if (profile?.email) {
      recipientEmail = profile.email
      recipientName = profile.display_name || 'Helfer'
    }
  } else if (anmeldung.external_helper_id) {
    const { data: helper } = await supabase
      .from('externe_helfer_profile')
      .select('email, vorname, nachname')
      .eq('id', anmeldung.external_helper_id)
      .single()

    if (helper?.email) {
      recipientEmail = helper.email
      recipientName = `${helper.vorname} ${helper.nachname}`
    }
  } else if (anmeldung.external_email) {
    recipientEmail = anmeldung.external_email
    recipientName = anmeldung.external_name || 'Helfer'
  }

  if (!recipientEmail) {
    return { success: true } // No email to send to
  }

  // Extract nested data
  const rollenInstanz = anmeldung.rollen_instanz as unknown as {
    zeitblock_start: string | null
    zeitblock_end: string | null
    template: { name: string } | null
    helfer_event: {
      name: string
      datum_start: string
      ort: string | null
    } | null
  } | null

  const helferEvent = rollenInstanz?.helfer_event
  if (!helferEvent) {
    return { success: false, error: 'Event nicht gefunden' }
  }

  const abmeldungLink = buildAbmeldungLink(anmeldung.abmeldung_token)

  const { subject, html, text } = waitlistPromotionEmail(
    recipientName,
    {
      name: helferEvent.name,
      datum: formatDate(helferEvent.datum_start),
      ort: helferEvent.ort || undefined,
      rolle: rollenInstanz?.template?.name || undefined,
      zeitblock:
        formatTimeRange(
          rollenInstanz?.zeitblock_start || null,
          rollenInstanz?.zeitblock_end || null
        ) || undefined,
    },
    abmeldungLink || undefined
  )

  const result = await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  })

  return result.success
    ? { success: true }
    : { success: false, error: result.error }
}
