/**
 * iCal Generator Utility
 *
 * Creates iCalendar files (.ics) for helper shifts.
 * Compatible with most calendar applications (Google Calendar, Apple Calendar, Outlook).
 */

export interface ICalEvent {
  title: string
  description?: string
  location?: string
  startDate: Date
  endDate: Date
  organizer?: {
    name: string
    email: string
  }
  url?: string
  uid?: string
}

/**
 * Escape special characters for iCal format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Format date for iCal (YYYYMMDDTHHMMSSZ format)
 */
function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Format date for iCal with timezone (floating time)
 */
function formatICalDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}`
}

/**
 * Generate a unique UID for the event
 */
function generateUID(event: ICalEvent): string {
  if (event.uid) return event.uid
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${random}@backstagepass.tgw.ch`
}

/**
 * Generate an iCalendar file content for a single event
 */
export function generateICalEvent(event: ICalEvent): string {
  const uid = generateUID(event)
  const now = new Date()

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BackstagePass//TGW Helfer//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Zurich',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICalDate(now)}`,
    `DTSTART;TZID=Europe/Zurich:${formatICalDateLocal(event.startDate)}`,
    `DTEND;TZID=Europe/Zurich:${formatICalDateLocal(event.endDate)}`,
    `SUMMARY:${escapeICalText(event.title)}`,
  ]

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`)
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`)
  }

  if (event.organizer) {
    lines.push(
      `ORGANIZER;CN=${escapeICalText(event.organizer.name)}:mailto:${event.organizer.email}`
    )
  }

  if (event.url) {
    lines.push(`URL:${event.url}`)
  }

  // Add reminder 1 hour before
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Erinnerung: ${escapeICalText(event.title)}`,
    'END:VALARM'
  )

  // Add reminder 1 day before
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Morgen: ${escapeICalText(event.title)}`,
    'END:VALARM'
  )

  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Generate iCal for a helper shift
 */
export function generateHelferSchichtIcal(params: {
  veranstaltung: string
  rolle: string
  datum: string // YYYY-MM-DD
  startzeit: string // HH:MM
  endzeit: string // HH:MM
  ort?: string
  treffpunkt?: string
  briefingZeit?: string
  koordinatorName?: string
  koordinatorEmail?: string
}): string {
  const {
    veranstaltung,
    rolle,
    datum,
    startzeit,
    endzeit,
    ort,
    treffpunkt,
    briefingZeit,
    koordinatorName,
    koordinatorEmail,
  } = params

  // Parse date and times
  const [year, month, day] = datum.split('-').map(Number)
  const [startHour, startMin] = startzeit.split(':').map(Number)
  const [endHour, endMin] = endzeit.split(':').map(Number)

  const startDate = new Date(year, month - 1, day, startHour, startMin)
  const endDate = new Date(year, month - 1, day, endHour, endMin)

  // Build description
  const descriptionParts = [`Rolle: ${rolle}`]
  if (treffpunkt) descriptionParts.push(`Treffpunkt: ${treffpunkt}`)
  if (briefingZeit) descriptionParts.push(`Briefing: ${briefingZeit}`)
  if (koordinatorName) descriptionParts.push(`Koordinator: ${koordinatorName}`)
  if (koordinatorEmail) descriptionParts.push(`Kontakt: ${koordinatorEmail}`)

  return generateICalEvent({
    title: `Helfereinsatz: ${rolle} - ${veranstaltung}`,
    description: descriptionParts.join('\n'),
    location: ort,
    startDate,
    endDate,
    organizer: koordinatorName && koordinatorEmail
      ? { name: koordinatorName, email: koordinatorEmail }
      : undefined,
  })
}

/**
 * Convert iCal content to a data URL for download
 */
export function icalToDataUrl(icalContent: string): string {
  const encoded = encodeURIComponent(icalContent)
  return `data:text/calendar;charset=utf-8,${encoded}`
}

/**
 * Generate a filename for the iCal file
 */
export function generateIcalFilename(veranstaltung: string, rolle: string): string {
  const sanitized = `${veranstaltung}-${rolle}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `helfereinsatz-${sanitized}.ics`
}
