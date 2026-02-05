/**
 * Email Service Client
 *
 * Uses Resend for sending transactional emails.
 * Falls back gracefully if API key is not configured.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResendClient = any

// Check if Resend is available (for optional dependency handling)
let ResendClass: ResendClient = null
try {
  // Dynamic import to handle cases where resend is not installed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ResendClass = require('resend').Resend
} catch {
  // Resend not installed - will use mock/log mode
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
 * Get Resend client instance
 */
function getResendClient(): ResendClient {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey || !ResendClass) {
    return null
  }

  return new ResendClass(apiKey)
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
  const { to, subject, html, text, from, replyTo, attachments } = options

  const resend = getResendClient()

  // If no Resend client available, log the email (development mode)
  if (!resend) {
    console.warn('[Email] Resend not configured. Would send email:', {
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
    const result = await resend.emails.send({
      from: from || getSenderAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: typeof a.content === 'string' ? Buffer.from(a.content) : a.content,
        content_type: a.contentType,
      })),
    })

    if (result.error) {
      console.error('[Email] Resend error:', result.error)
      return {
        success: false,
        error: result.error.message,
      }
    }

    return {
      success: true,
      messageId: result.data?.id,
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
  return !!process.env.RESEND_API_KEY && !!ResendClass
}

/**
 * Get email service status
 */
export function getEmailServiceStatus(): {
  configured: boolean
  provider: string
  mode: 'production' | 'development' | 'disabled'
} {
  const hasApiKey = !!process.env.RESEND_API_KEY
  const hasResend = !!ResendClass

  if (hasApiKey && hasResend) {
    return {
      configured: true,
      provider: 'Resend',
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
