import { NextResponse } from 'next/server'
import { sendEmail, isEmailServiceConfigured } from '@/lib/email/client'
import { notifyRegistrationConfirmed } from '@/lib/actions/helferliste-notifications'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const anmeldungId = searchParams.get('anmeldung')

  // If anmeldung ID provided, test the real notification flow
  if (anmeldungId) {
    try {
      const result = await notifyRegistrationConfirmed(anmeldungId, false)
      return NextResponse.json({ test: 'notifyRegistrationConfirmed', anmeldungId, result })
    } catch (err) {
      return NextResponse.json({
        test: 'notifyRegistrationConfirmed',
        anmeldungId,
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
