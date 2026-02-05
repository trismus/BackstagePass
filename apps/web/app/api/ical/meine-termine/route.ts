import { NextResponse } from 'next/server'
import { generatePersonalICalFeed } from '@/lib/actions/persoenlicher-kalender'

/**
 * GET /api/ical/meine-termine
 * Returns iCal feed of personal events for the authenticated user
 */
export async function GET() {
  try {
    const icalContent = await generatePersonalICalFeed()

    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="meine-termine.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating iCal feed:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren des iCal-Feeds' },
      { status: 500 }
    )
  }
}
