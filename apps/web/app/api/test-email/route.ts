import { NextResponse } from 'next/server'
import { isEmailServiceConfigured, sendEmail, getEmailServiceStatus } from '@/lib/email/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const testEmail = searchParams.get('to') || 'test@example.com'
  const actualSend = searchParams.get('send') === 'true'

  // Get email service status
  const status = getEmailServiceStatus()
  const isConfigured = isEmailServiceConfigured()

  // Check ENV vars (without exposing sensitive data)
  const envCheck = {
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    SMTP_PORT: process.env.SMTP_PORT || '587',
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || 'BackstagePass <noreply@tgw.ch>',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  }

  if (!isConfigured) {
    return NextResponse.json({
      status: 'error',
      message: 'SMTP not configured',
      emailServiceStatus: status,
      env: envCheck,
      missingVars: [
        !process.env.SMTP_HOST && 'SMTP_HOST',
        !process.env.SMTP_USER && 'SMTP_USER',
        !process.env.SMTP_PASS && 'SMTP_PASS',
      ].filter(Boolean),
    })
  }

  // If not actually sending, just return config check
  if (!actualSend) {
    return NextResponse.json({
      status: 'ok',
      message: 'SMTP is configured',
      emailServiceStatus: status,
      env: envCheck,
      note: 'Add ?send=true&to=your@email.com to actually send a test email',
    })
  }

  // Actually send test email
  try {
    const result = await sendEmail({
      to: testEmail,
      subject: 'BackstagePass Email Test',
      html: `
        <h1>Email Test</h1>
        <p>This is a test email from BackstagePass.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          SMTP Host: ${process.env.SMTP_HOST}<br>
          From: ${envCheck.EMAIL_FROM_ADDRESS}
        </p>
      `,
      text: `
Email Test

This is a test email from BackstagePass.
Timestamp: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV}

SMTP Host: ${process.env.SMTP_HOST}
From: ${envCheck.EMAIL_FROM_ADDRESS}
      `,
    })

    return NextResponse.json({
      status: result.success ? 'success' : 'failed',
      message: result.success
        ? `Test email sent to ${testEmail}`
        : `Failed to send email: ${result.error}`,
      emailServiceStatus: status,
      env: envCheck,
      result: {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      },
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Exception while sending email',
      error: error instanceof Error ? error.message : 'Unknown error',
      emailServiceStatus: status,
      env: envCheck,
    })
  }
}
