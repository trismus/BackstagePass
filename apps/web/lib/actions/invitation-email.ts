'use server'

import { isEmailServiceConfigured, sendEmailWithRetry } from '@/lib/email'
import { renderEmailTemplate } from '@/lib/utils/email-renderer'
import { getEmailTemplateInternal } from './email-templates'

/**
 * Send a branded invitation email using the member_invitation template.
 * Returns success/error — caller handles fallback behavior.
 */
export async function sendInvitationEmail(
  email: string,
  vorname: string,
  magicLink: string
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailServiceConfigured()) {
    return { success: false, error: 'SMTP nicht konfiguriert' }
  }

  const template = await getEmailTemplateInternal('member_invitation')
  if (!template) {
    return { success: false, error: 'Einladungs-Template nicht gefunden oder inaktiv' }
  }

  const rendered = renderEmailTemplate(template, {
    vorname,
    magic_link: magicLink,
  })

  const emailResult = await sendEmailWithRetry({
    to: email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  })

  if (!emailResult.success) {
    return { success: false, error: emailResult.error || 'E-Mail-Versand fehlgeschlagen' }
  }

  return { success: true }
}
