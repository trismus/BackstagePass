import { NextResponse } from 'next/server'
import { sendEmail, isEmailServiceConfigured } from '@/lib/email/client'
import { sendBookingConfirmation } from '@/lib/actions/email-sender'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zuweisungId = searchParams.get('zuweisung')

  // If zuweisung ID provided, test sendBookingConfirmation
  if (zuweisungId) {
    try {
      const result = await sendBookingConfirmation(zuweisungId)
      return NextResponse.json({ test: 'sendBookingConfirmation', zuweisungId, result })
    } catch (err) {
      return NextResponse.json({
        test: 'sendBookingConfirmation',
        zuweisungId,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })
    }
  }

  // Default: simple SMTP test
  const configured = isEmailServiceConfigured()

  if (!configured) {
    return NextResponse.json({ error: 'SMTP not configured', configured })
  }

  const result = await sendEmail({
    to: process.env.SMTP_USER || '',
    subject: 'BackstagePass Test-Email',
    html: '<p>Dies ist eine Test-Email von BackstagePass.</p>',
    text: 'Dies ist eine Test-Email von BackstagePass.',
  })

  return NextResponse.json({ configured, result })
}
