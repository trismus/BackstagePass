'use server'

import { createClient } from '../supabase/server'
import { getEmailTemplateInternal } from './email-templates'
import { renderEmailTemplate, formatDateForEmail, formatTimeForEmail, formatDeadlineForEmail } from '../utils/email-renderer'
import { generateHelferSchichtIcal, generateIcalFilename } from '../utils/ical-generator'
import { sendEmailWithRetry } from '../email/client'
import type { EmailPlaceholderData, EmailTemplateTyp, EmailLogStatus } from '../supabase/types'

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Log an email send attempt
 */
async function logEmailSend(params: {
  anmeldungId?: string
  helferAnmeldungId?: string
  templateTyp: string
  recipientEmail: string
  recipientName?: string
  status: EmailLogStatus
  errorMessage?: string
}): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_logs')
    .insert({
      anmeldung_id: params.anmeldungId || null,
      helfer_anmeldung_id: params.helferAnmeldungId || null,
      template_typ: params.templateTyp,
      recipient_email: params.recipientEmail,
      recipient_name: params.recipientName || null,
      status: params.status,
      error_message: params.errorMessage || null,
      sent_at: params.status === 'sent' ? new Date().toISOString() : null,
    } as never)
    .select('id')
    .single()

  if (error) {
    console.error('[Email] Failed to log email:', error)
    return null
  }

  return data?.id || null
}

/**
 * Update email log status
 */
async function updateEmailLogStatus(
  logId: string,
  status: EmailLogStatus,
  errorMessage?: string
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('email_logs')
    .update({
      status,
      error_message: errorMessage || null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    } as never)
    .eq('id', logId)
}

/**
 * Get veranstaltung coordinator info
 */
export async function getKoordinatorInfo(koordinatorId: string | null): Promise<{
  name: string
  email: string
  telefon: string
}> {
  if (!koordinatorId) {
    return {
      name: 'TGW Koordination',
      email: 'helfer@tgw.ch',
      telefon: '',
    }
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('personen')
    .select('vorname, nachname, email, telefon')
    .eq('id', koordinatorId)
    .single()

  if (!data) {
    return {
      name: 'TGW Koordination',
      email: 'helfer@tgw.ch',
      telefon: '',
    }
  }

  return {
    name: `${data.vorname} ${data.nachname}`,
    email: data.email || 'helfer@tgw.ch',
    telefon: data.telefon || '',
  }
}

/**
 * Get info blocks for a veranstaltung (briefing, helferessen times)
 */
async function getInfoBlockTimes(veranstaltungId: string): Promise<{
  briefingZeit: string
  helferssenZeit: string
  treffpunkt: string
}> {
  const supabase = await createClient()

  const { data: infoBloecke } = await supabase
    .from('info_bloecke')
    .select('titel, startzeit, beschreibung')
    .eq('veranstaltung_id', veranstaltungId)

  let briefingZeit = ''
  let helferessenZeit = ''
  let treffpunkt = ''

  for (const block of infoBloecke || []) {
    const titelLower = block.titel.toLowerCase()
    if (titelLower.includes('briefing')) {
      briefingZeit = block.startzeit ? formatTimeForEmail(block.startzeit) + ' Uhr' : ''
      treffpunkt = block.beschreibung || ''
    }
    if (titelLower.includes('essen') || titelLower.includes('helferessen')) {
      helferessenZeit = block.startzeit ? formatTimeForEmail(block.startzeit) + ' Uhr' : ''
    }
  }

  return {
    briefingZeit,
    helferssenZeit: helferessenZeit,
    treffpunkt,
  }
}

/**
 * Build the cancellation link URL
 */
function buildCancellationLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/helfer/abmeldung/${token}`
}

/**
 * Build the public registration link URL
 */
function buildPublicLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/helfer/anmeldung/${token}`
}

// =============================================================================
// Email Sending Actions
// =============================================================================

/**
 * Send booking confirmation email for an auffuehrung_zuweisung
 */
export async function sendBookingConfirmation(
  zuweisungId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Fetch all required data
  const { data: zuweisung, error: zuweisungError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id,
      abmeldung_token,
      person:personen(id, vorname, nachname, email),
      schicht:auffuehrung_schichten(
        id,
        rolle,
        veranstaltung_id,
        zeitblock:zeitbloecke(id, name, startzeit, endzeit)
      )
    `)
    .eq('id', zuweisungId)
    .single()

  if (zuweisungError || !zuweisung) {
    console.error('[Email] Zuweisung not found:', zuweisungError)
    return { success: false, error: 'Anmeldung nicht gefunden' }
  }

  const person = zuweisung.person as unknown as { id: string; vorname: string; nachname: string; email: string } | null
  const schicht = zuweisung.schicht as unknown as {
    id: string
    rolle: string
    veranstaltung_id: string
    zeitblock: { id: string; name: string; startzeit: string; endzeit: string } | null
  } | null

  if (!person?.email) {
    console.error('[Email] No email for person')
    return { success: false, error: 'Keine E-Mail-Adresse vorhanden' }
  }

  if (!schicht) {
    console.error('[Email] No schicht data')
    return { success: false, error: 'Schicht nicht gefunden' }
  }

  // Get veranstaltung
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, startzeit, ort, public_helfer_token, koordinator_id')
    .eq('id', schicht.veranstaltung_id)
    .single()

  if (!veranstaltung) {
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  // Get coordinator info
  const koordinator = await getKoordinatorInfo(veranstaltung.koordinator_id)

  // Get info blocks (briefing, helferessen)
  const infoTimes = await getInfoBlockTimes(veranstaltung.id)

  // Get email template
  const template = await getEmailTemplateInternal('confirmation')
  if (!template) {
    return { success: false, error: 'E-Mail Template nicht gefunden oder inaktiv' }
  }

  // Build placeholder data
  const placeholderData: EmailPlaceholderData = {
    vorname: person.vorname,
    nachname: person.nachname,
    email: person.email,
    veranstaltung: veranstaltung.titel,
    datum: formatDateForEmail(veranstaltung.datum),
    ort: veranstaltung.ort || '',
    rolle: schicht.rolle,
    zeitblock: schicht.zeitblock?.name || '',
    startzeit: schicht.zeitblock?.startzeit ? formatTimeForEmail(schicht.zeitblock.startzeit) : '',
    endzeit: schicht.zeitblock?.endzeit ? formatTimeForEmail(schicht.zeitblock.endzeit) : '',
    treffpunkt: infoTimes.treffpunkt || veranstaltung.ort || '',
    briefing_zeit: infoTimes.briefingZeit,
    helferessen_zeit: infoTimes.helferssenZeit,
    absage_link: zuweisung.abmeldung_token
      ? buildCancellationLink(zuweisung.abmeldung_token)
      : '',
    public_link: veranstaltung.public_helfer_token
      ? buildPublicLink(veranstaltung.public_helfer_token)
      : '',
    koordinator_name: koordinator.name,
    koordinator_email: koordinator.email,
    koordinator_telefon: koordinator.telefon,
  }

  // Render template
  const rendered = renderEmailTemplate(template, placeholderData)

  // Generate iCal attachment if we have time data
  let icalAttachment: { filename: string; content: string; contentType: string } | undefined
  if (schicht.zeitblock?.startzeit && schicht.zeitblock?.endzeit) {
    const icalContent = generateHelferSchichtIcal({
      veranstaltung: veranstaltung.titel,
      rolle: schicht.rolle,
      datum: veranstaltung.datum,
      startzeit: schicht.zeitblock.startzeit,
      endzeit: schicht.zeitblock.endzeit,
      ort: veranstaltung.ort || undefined,
      treffpunkt: infoTimes.treffpunkt || undefined,
      briefingZeit: infoTimes.briefingZeit || undefined,
      koordinatorName: koordinator.name,
      koordinatorEmail: koordinator.email,
    })

    icalAttachment = {
      filename: generateIcalFilename(veranstaltung.titel, schicht.rolle),
      content: icalContent,
      contentType: 'text/calendar',
    }
  }

  // Log the attempt
  const logId = await logEmailSend({
    anmeldungId: zuweisungId,
    templateTyp: 'confirmation',
    recipientEmail: person.email,
    recipientName: `${person.vorname} ${person.nachname}`,
    status: 'pending',
  })

  // Send email
  const sendResult = await sendEmailWithRetry({
    to: person.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: koordinator.email,
    attachments: icalAttachment ? [icalAttachment] : undefined,
  })

  // Update log
  if (logId) {
    await updateEmailLogStatus(
      logId,
      sendResult.success ? 'sent' : 'failed',
      sendResult.error
    )
  }

  if (!sendResult.success) {
    console.error('[Email] Failed to send confirmation:', sendResult.error)
    // Don't return error - email is nice-to-have, booking succeeded
  }

  return { success: true }
}

/**
 * Send a generic email using a template
 */
export async function sendTemplatedEmail(
  templateTyp: EmailTemplateTyp,
  recipientEmail: string,
  data: EmailPlaceholderData,
  options?: {
    anmeldungId?: string
    helferAnmeldungId?: string
    replyTo?: string
  }
): Promise<{ success: boolean; error?: string }> {
  // Get email template
  const template = await getEmailTemplateInternal(templateTyp)
  if (!template) {
    return { success: false, error: 'E-Mail Template nicht gefunden oder inaktiv' }
  }

  // Render template
  const rendered = renderEmailTemplate(template, data)

  // Log the attempt
  const logId = await logEmailSend({
    anmeldungId: options?.anmeldungId,
    helferAnmeldungId: options?.helferAnmeldungId,
    templateTyp,
    recipientEmail,
    recipientName: data.vorname && data.nachname
      ? `${data.vorname} ${data.nachname}`
      : undefined,
    status: 'pending',
  })

  // Send email
  const sendResult = await sendEmailWithRetry({
    to: recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: options?.replyTo,
  })

  // Update log
  if (logId) {
    await updateEmailLogStatus(
      logId,
      sendResult.success ? 'sent' : 'failed',
      sendResult.error
    )
  }

  if (!sendResult.success) {
    return { success: false, error: sendResult.error }
  }

  return { success: true }
}

/**
 * Send cancellation confirmation email
 */
export async function sendCancellationConfirmation(
  zuweisungId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Fetch required data
  const { data: zuweisung } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id,
      person:personen(id, vorname, nachname, email),
      schicht:auffuehrung_schichten(
        id,
        rolle,
        veranstaltung_id
      )
    `)
    .eq('id', zuweisungId)
    .single()

  if (!zuweisung) {
    return { success: false, error: 'Anmeldung nicht gefunden' }
  }

  const person = zuweisung.person as unknown as { vorname: string; nachname: string; email: string } | null
  const schicht = zuweisung.schicht as unknown as { rolle: string; veranstaltung_id: string } | null

  if (!person?.email || !schicht) {
    return { success: false, error: 'Ungültige Daten' }
  }

  // Get veranstaltung
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, public_helfer_token')
    .eq('id', schicht.veranstaltung_id)
    .single()

  if (!veranstaltung) {
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  return sendTemplatedEmail('cancellation', person.email, {
    vorname: person.vorname,
    nachname: person.nachname,
    veranstaltung: veranstaltung.titel,
    datum: formatDateForEmail(veranstaltung.datum),
    rolle: schicht.rolle,
    public_link: veranstaltung.public_helfer_token
      ? buildPublicLink(veranstaltung.public_helfer_token)
      : '',
  }, {
    anmeldungId: zuweisungId,
  })
}

/**
 * Send waitlist assignment notification
 */
export async function sendWaitlistAssignedEmail(
  wartelisteId: string,
  confirmationDeadline: Date
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Fetch waitlist entry with details
  const { data: entry } = await supabase
    .from('helfer_warteliste')
    .select(`
      id,
      confirmation_token,
      profile:profiles(id, email, display_name),
      schicht:auffuehrung_schichten(
        id,
        rolle,
        veranstaltung_id,
        zeitblock:zeitbloecke(startzeit, endzeit)
      )
    `)
    .eq('id', wartelisteId)
    .single()

  if (!entry) {
    return { success: false, error: 'Warteliste-Eintrag nicht gefunden' }
  }

  const profile = entry.profile as unknown as { email: string; display_name: string } | null
  const schicht = entry.schicht as unknown as {
    rolle: string
    veranstaltung_id: string
    zeitblock: { startzeit: string; endzeit: string } | null
  } | null

  if (!profile?.email || !schicht) {
    return { success: false, error: 'Ungültige Daten' }
  }

  // Get veranstaltung
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum')
    .eq('id', schicht.veranstaltung_id)
    .single()

  if (!veranstaltung) {
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  // Parse display_name to get vorname/nachname
  const nameParts = (profile.display_name || '').split(' ')
  const vorname = nameParts[0] || 'Helfer'
  const nachname = nameParts.slice(1).join(' ') || ''

  const confirmToken = (entry as unknown as { confirmation_token?: string }).confirmation_token
  const confirmLink = confirmToken
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/helfer/warteliste/bestaetigen/${confirmToken}`
    : ''

  return sendTemplatedEmail('waitlist_assigned', profile.email, {
    vorname,
    nachname,
    veranstaltung: veranstaltung.titel,
    datum: formatDateForEmail(veranstaltung.datum),
    rolle: schicht.rolle,
    startzeit: schicht.zeitblock?.startzeit ? formatTimeForEmail(schicht.zeitblock.startzeit) : '',
    endzeit: schicht.zeitblock?.endzeit ? formatTimeForEmail(schicht.zeitblock.endzeit) : '',
    frist: formatDeadlineForEmail(confirmationDeadline),
    absage_link: confirmLink,
  })
}
