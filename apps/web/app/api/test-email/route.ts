import { NextResponse } from 'next/server'
import { sendEmail, isEmailServiceConfigured } from '@/lib/email/client'

export async function GET() {
  const configured = isEmailServiceConfigured()

  if (!configured) {
    return NextResponse.json({ error: 'SMTP not configured', configured })
  }

  // Send a simple test email to verify SMTP works
  const result = await sendEmail({
    to: process.env.SMTP_USER || '',
    subject: 'BackstagePass Test-Email',
    html: '<p>Dies ist eine Test-Email von BackstagePass.</p>',
    text: 'Dies ist eine Test-Email von BackstagePass.',
  })

  return NextResponse.json({
    configured,
    result,
    smtp_host: process.env.SMTP_HOST,
    smtp_port: process.env.SMTP_PORT,
    smtp_user: process.env.SMTP_USER,
    from: process.env.EMAIL_FROM_ADDRESS,
  })
}
