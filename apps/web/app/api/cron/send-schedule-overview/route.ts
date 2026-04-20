import { NextResponse } from 'next/server'
import { sendUpcomingScheduleEmails } from '@/lib/actions/schedule-emails'

// Cron job for sending the weekly schedule overview to all confirmed helpers
// Schedule: Every Monday at 08:00 UTC (0 8 * * 1)
// Security: Uses CRON_SECRET to verify the request is from Vercel Cron

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[Cron/ScheduleMail] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Cron/ScheduleMail] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.warn('[Cron/ScheduleMail] Starting weekly schedule overview job...')
    const startTime = Date.now()

    const results = await sendUpcomingScheduleEmails()

    const duration = Date.now() - startTime
    console.warn(`[Cron/ScheduleMail] Done in ${duration}ms:`, results)

    return NextResponse.json({ success: true, duration_ms: duration, results })
  } catch (error) {
    console.error('[Cron/ScheduleMail] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
