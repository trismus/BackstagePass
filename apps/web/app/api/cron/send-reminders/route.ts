import { NextResponse } from 'next/server'
import { sendAllReminders } from '@/lib/actions/reminder-sender'
import { processExpiredWaitlistNotifications } from '@/lib/actions/warteliste-notification'

// Cron job for sending reminder emails and processing waitlists
// Schedule: Every 6 hours (0 0,6,12,18 * * *)
// - Sends 48h reminders for events starting in ~48 hours
// - Sends 6h reminders for events starting in ~6 hours
// - Processes expired waitlist notifications (24h timeout)
// Security: Uses CRON_SECRET to verify the request is from Vercel Cron

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')

  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production') {
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  try {
    console.warn('[Cron] Starting reminder job...')
    const startTime = Date.now()

    // Send reminders
    const reminderResults = await sendAllReminders()

    // Process expired waitlist notifications
    const waitlistResults = await processExpiredWaitlistNotifications()

    const duration = Date.now() - startTime

    console.warn('[Cron] Cron job completed in', duration, 'ms')

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      results: {
        ...reminderResults,
        waitlist: waitlistResults,
      },
    })
  } catch (error) {
    console.error('[Cron] Error in reminder job:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
