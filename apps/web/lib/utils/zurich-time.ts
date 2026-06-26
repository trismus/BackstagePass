/**
 * Helpers for working with Europe/Zurich local times.
 *
 * The application's domain is exclusively Switzerland. Database functions like
 * `check_person_conflicts` interpret `TIMESTAMPTZ` inputs by converting them
 * `AT TIME ZONE 'Europe/Zurich'`. If we send a naïve `YYYY-MM-DDTHH:MM` string
 * Supabase will parse it as UTC and the DB will then strip ~1-2h back to Zurich
 * time, leading to off-by-offset errors. To avoid that, we serialize values
 * with an explicit Zurich UTC offset (`+01:00` winter / `+02:00` summer).
 */

/**
 * Determine the UTC offset for a given Zurich wall-clock date.
 * Returns `+01:00` (CET) or `+02:00` (CEST).
 *
 * Implementation uses `Intl.DateTimeFormat` with `timeZoneName: 'shortOffset'`
 * which Node 18+ supports.
 */
export function getZurichOffset(date: string): '+01:00' | '+02:00' {
  // Use noon on the given day to be safely past any DST transition that happens at 02:00
  const probe = new Date(`${date}T12:00:00Z`)
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Zurich',
    timeZoneName: 'shortOffset',
  })
  const parts = fmt.formatToParts(probe)
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+1'
  // tzPart looks like "GMT+1" or "GMT+2"
  if (tzPart.includes('+2')) return '+02:00'
  return '+01:00'
}

/**
 * Build an ISO-8601 timestamp string anchored in Europe/Zurich for the given
 * date and time. Result e.g. `2026-06-25T14:00:00+02:00`.
 *
 * @param date YYYY-MM-DD
 * @param time HH:MM or HH:MM:SS
 */
export function toZurichTimestamp(date: string, time: string): string {
  const normalizedTime = time.length === 5 ? `${time}:00` : time
  const offset = getZurichOffset(date)
  return `${date}T${normalizedTime}${offset}`
}
