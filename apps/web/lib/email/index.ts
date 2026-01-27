/**
 * Email Service for BackstagePass
 *
 * Uses Resend for transactional emails.
 * Set RESEND_API_KEY in environment variables.
 */

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  error?: string
  id?: string
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set - email not sent')
    return { success: false, error: 'Email service not configured' }
  }

  const fromEmail = process.env.EMAIL_FROM || 'noreply@backstagepass.app'
  const fromName = process.env.EMAIL_FROM_NAME || 'BackstagePass'

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Email send error:', error)
      return { success: false, error: 'Failed to send email' }
    }

    const data = await response.json()
    return { success: true, id: data.id }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error: 'Email service error' }
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}
