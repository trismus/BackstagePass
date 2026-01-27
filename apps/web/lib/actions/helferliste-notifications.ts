'use server'

import { createClient } from '../supabase/server'
import { sendEmail, isEmailConfigured } from '../email'
import {
  eventPublishedEmail,
  registrationConfirmationEmail,
  statusUpdateEmail,
} from '../email/templates/helferliste'

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
