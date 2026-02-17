'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission, getUserProfile } from '../supabase/auth-helpers'
import { getEmailTemplateInternal } from './email-templates'
import { renderEmailTemplate, formatDateForEmail } from '../utils/email-renderer'
import { sendEmailWithRetry } from '../email/client'
import type { EmailPlaceholderData, ThankYouEmailsSentInsert } from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type ThankYouPreviewHelfer = {
  personId: string
  name: string
  email: string
  rollen: string[]
  stunden: number
  isExtern: boolean
  feedbackToken: string | null
}

export type ThankYouEmailsPreview = {
  veranstaltungId: string
  veranstaltungTitel: string
  veranstaltungDatum: string
  helfer: ThankYouPreviewHelfer[]
  bereitsGesendet: boolean
  bereitsGesendetAm: string | null
  bereitsGesendetAnzahl: number
}

export type ThankYouEmailsSendResult = {
  success: boolean
  error?: string
  gesendet?: number
  fehlgeschlagen?: number
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build feedback link URL
 */
function buildFeedbackLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/helfer/feedback/${token}`
}

/**
 * Calculate hours from start and end time
 */
function calculateHours(startzeit: string, endzeit: string): number {
  const start = new Date(`2000-01-01T${startzeit}`)
  const end = new Date(`2000-01-01T${endzeit}`)
  let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  if (hours < 0) hours += 24
  return Math.round(hours * 4) / 4
}

// =============================================================================
// Data Fetching
// =============================================================================

/**
 * Get preview data for thank you emails
 */
export async function getThankYouEmailsPreview(
  veranstaltungId: string,
  onlyAttended: boolean = true
): Promise<ThankYouEmailsPreview | null> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get veranstaltung
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum')
    .eq('id', veranstaltungId)
    .single()

  if (veranstaltungError || !veranstaltung) {
    console.error('Error fetching veranstaltung:', veranstaltungError)
    return null
  }

  // Check if emails already sent
  const { data: sentRecord } = await supabase
    .from('thank_you_emails_sent')
    .select('id, sent_at, recipient_count')
    .eq('veranstaltung_id', veranstaltungId)
    .single()

  // Get all zuweisungen
  const { data: schichten, error: schichtenError } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      zeitblock:zeitbloecke(startzeit, endzeit),
      zuweisungen:auffuehrung_zuweisungen(
        id,
        person_id,
        checked_in_at,
        no_show,
        status,
        feedback_token,
        person:personen(id, vorname, nachname, email)
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)

  if (schichtenError) {
    console.error('Error fetching schichten:', schichtenError)
    return null
  }

  // Build helper map - deduplicate by person
  const helferMap = new Map<string, ThankYouPreviewHelfer>()

  for (const schicht of schichten || []) {
    const zeitblockData = schicht.zeitblock as unknown as {
      startzeit: string
      endzeit: string
    } | null

    for (const zuw of schicht.zuweisungen || []) {
      // Skip cancelled
      if (zuw.status === 'abgesagt') continue

      // If onlyAttended, skip non-checked-in and no-shows
      if (onlyAttended && (!zuw.checked_in_at || zuw.no_show)) continue

      const personData = zuw.person as unknown as {
        id: string
        vorname: string
        nachname: string
        email: string | null
      } | null

      if (!personData || !personData.email) continue

      const key = personData.id

      if (!helferMap.has(key)) {
        helferMap.set(key, {
          personId: personData.id,
          name: `${personData.vorname} ${personData.nachname}`,
          email: personData.email,
          rollen: [],
          stunden: 0,
          isExtern: false, // We'll determine this based on profile linkage if needed
          feedbackToken: zuw.feedback_token || null,
        })
      }

      const helfer = helferMap.get(key)!
      if (!helfer.rollen.includes(schicht.rolle)) {
        helfer.rollen.push(schicht.rolle)
      }

      // Add hours
      if (zeitblockData?.startzeit && zeitblockData?.endzeit) {
        helfer.stunden += calculateHours(zeitblockData.startzeit, zeitblockData.endzeit)
      }

      // Use first available feedback token
      if (!helfer.feedbackToken && zuw.feedback_token) {
        helfer.feedbackToken = zuw.feedback_token
      }
    }
  }

  return {
    veranstaltungId: veranstaltung.id,
    veranstaltungTitel: veranstaltung.titel,
    veranstaltungDatum: veranstaltung.datum,
    helfer: Array.from(helferMap.values()),
    bereitsGesendet: !!sentRecord,
    bereitsGesendetAm: sentRecord?.sent_at || null,
    bereitsGesendetAnzahl: sentRecord?.recipient_count || 0,
  }
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Send thank you emails to helpers
 */
export async function sendThankYouEmails(
  veranstaltungId: string,
  options: {
    onlyAttended?: boolean
    includeFeedbackLink?: boolean
    resend?: boolean
  } = {}
): Promise<ThankYouEmailsSendResult> {
  await requirePermission('veranstaltungen:write')

  const { onlyAttended = true, includeFeedbackLink = true, resend = false } = options

  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Check if already sent
  const { data: existingSent } = await supabase
    .from('thank_you_emails_sent')
    .select('id, sent_at')
    .eq('veranstaltung_id', veranstaltungId)
    .single()

  if (existingSent && !resend) {
    const date = new Date(existingSent.sent_at).toLocaleDateString('de-CH')
    return {
      success: false,
      error: `Dankes-Emails wurden bereits am ${date} versendet. Waehle "Erneut senden" um nochmals zu senden.`,
    }
  }

  // Get preview data
  const preview = await getThankYouEmailsPreview(veranstaltungId, onlyAttended)
  if (!preview) {
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  if (preview.helfer.length === 0) {
    return { success: true, gesendet: 0, fehlgeschlagen: 0 }
  }

  // Get email template
  const template = await getEmailTemplateInternal('thank_you')
  if (!template) {
    return { success: false, error: 'E-Mail Template "thank_you" nicht gefunden oder inaktiv' }
  }

  // Send emails
  let gesendet = 0
  let fehlgeschlagen = 0

  for (const helfer of preview.helfer) {
    // Build placeholder data
    const placeholderData: EmailPlaceholderData = {
      vorname: helfer.name.split(' ')[0],
      nachname: helfer.name.split(' ').slice(1).join(' '),
      email: helfer.email,
      veranstaltung: preview.veranstaltungTitel,
      datum: formatDateForEmail(preview.veranstaltungDatum),
      rolle: helfer.rollen.join(', '),
    }

    // Add feedback link if requested and token available
    if (includeFeedbackLink && helfer.feedbackToken) {
      placeholderData.absage_link = buildFeedbackLink(helfer.feedbackToken)
    }

    // Render template
    const rendered = renderEmailTemplate(template, placeholderData)

    // Send email
    const result = await sendEmailWithRetry({
      to: helfer.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    })

    if (result.success) {
      gesendet++
    } else {
      fehlgeschlagen++
      console.error(`Failed to send thank you email to ${helfer.email}:`, result.error)
    }
  }

  // Record that emails were sent
  if (existingSent) {
    // Delete old record and create new
    await supabase
      .from('thank_you_emails_sent')
      .delete()
      .eq('id', existingSent.id)
  }

  const insertData: ThankYouEmailsSentInsert = {
    veranstaltung_id: veranstaltungId,
    sent_by: profile.id,
    recipient_count: gesendet,
    only_attended: onlyAttended,
  }

  await supabase
    .from('thank_you_emails_sent')
    .insert(insertData as never)

  // Revalidate
  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}/helfer-koordination`)

  return {
    success: true,
    gesendet,
    fehlgeschlagen,
  }
}
