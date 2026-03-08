/**
 * Email Service Client
 *
 * Uses Nodemailer for sending transactional emails via SMTP (e.g. Gmail).
 * Falls back gracefully if SMTP credentials are not configured.
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

export interface EmailLogContext {
  templateTyp?: string
  recipientName?: string
  anmeldungId?: string
  helferAnmeldungId?: string
}

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
  logging?: EmailLogContext
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
 * Write an email log entry to the database (fire-and-forget).
 * Never throws — silently skips if env vars are missing.
 */
async function writeEmailLog(
  recipientEmail: string,
  status: 'sent' | 'failed',
  logging?: EmailLogContext,
  errorMessage?: string
): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error } = await supabase
      .from('email_logs')
      .insert({
        template_typ: logging?.templateTyp || 'unknown',
        recipient_email: recipientEmail,
        recipient_name: logging?.recipientName || null,
        anmeldung_id: logging?.anmeldungId || null,
        helfer_anmeldung_id: logging?.helferAnmeldungId || null,
        status,
        error_message: errorMessage || null,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      } as never)

    if (error) {
      console.error('[Email] Failed to write email log:', error)
    }
  } catch (err) {
    console.error('[Email] Error in writeEmailLog:', err)
  }
}

/**
 * Send an email using SMTP
 */
export async function sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
  const { to, subject, html, text, from, replyTo, attachments, logging } = options

  const recipientEmail = Array.isArray(to) ? to[0] : to
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
      const result: EmailSendResult = {
        success: true,
        messageId: `dev-${Date.now()}`,
      }
      void writeEmailLog(recipientEmail, 'sent', logging)
      return result
    }

    const result: EmailSendResult = {
      success: false,
      error: 'Email service not configured',
    }
    void writeEmailLog(recipientEmail, 'failed', logging, result.error)
    return result
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

    void writeEmailLog(recipientEmail, 'sent', logging)

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    void writeEmailLog(recipientEmail, 'failed', logging, errorMsg)
    return {
      success: false,
      error: errorMsg,
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
