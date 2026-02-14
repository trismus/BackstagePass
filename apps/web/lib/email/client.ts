/**
 * Email Service Client
 *
 * Uses Nodemailer for sending transactional emails via SMTP (e.g. Gmail).
 * Falls back gracefully if SMTP credentials are not configured.
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

interface EmailSendOptions {
  to: string | string[]
  subject: string
  html: string
  text: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Get the configured email sender address
 */
function getSenderAddress(): string {
  return process.env.EMAIL_FROM_ADDRESS || 'BackstagePass <noreply@tgw.ch>'
}

/**
 * Create SMTP transporter
 */
function createTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10)

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

/**
 * Send an email using SMTP
 */
export async function sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
  const { to, subject, html, text, from, replyTo, attachments } = options

  const transporter = createTransporter()

  // If no transporter available, log the email (development mode)
  if (!transporter) {
    console.warn('[Email] SMTP not configured. Would send email:', {
      to,
      subject,
      from: from || getSenderAddress(),
    })

    // In development, treat as success
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      }
    }

    return {
      success: false,
      error: 'Email service not configured',
    }
  }

  try {
    const result = await transporter.sendMail({
      from: from || getSenderAddress(),
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
      replyTo,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send an email with retry logic
 */
export async function sendEmailWithRetry(
  options: EmailSendOptions,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<EmailSendResult> {
  let lastError: string | undefined
  let delay = initialDelay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(options)

    if (result.success) {
      return result
    }

    lastError = result.error

    // Don't retry on certain errors
    if (
      lastError?.includes('Invalid email address') ||
      lastError?.includes('not configured')
    ) {
      break
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2 // Double delay for each retry
    }
  }

  return {
    success: false,
    error: lastError || 'Max retries exceeded',
  }
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS
}

/**
 * Get email service status
 */
export function getEmailServiceStatus(): {
  configured: boolean
  provider: string
  mode: 'production' | 'development' | 'disabled'
} {
  const hasSmtp = isEmailServiceConfigured()

  if (hasSmtp) {
    return {
      configured: true,
      provider: 'SMTP',
      mode: 'production',
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return {
      configured: false,
      provider: 'Mock',
      mode: 'development',
    }
  }

  return {
    configured: false,
    provider: 'None',
    mode: 'disabled',
  }
}
