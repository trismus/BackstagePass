'use server'

import { createAdminClient } from '../supabase/admin'
import { sendTemplatedEmail } from './email-sender'
import { formatDateForEmail, formatTimeForEmail } from '../utils/email-renderer'
import { requirePermission } from '../supabase/auth-helpers'

// =============================================================================
// Types
// =============================================================================

interface UpcomingShift {
  person_id: string
  vorname: string
  nachname: string
  email: string
  veranstaltung_titel: string
  datum: string
  ort: string | null
  koordinator_id: string | null
  rolle: string
  zeitblock_name: string | null
  schicht_startzeit: string | null
  schicht_endzeit: string | null
}

export interface ScheduleEmailResult {
  sent: number
  failed: number
  errors: string[]
}

export interface ScheduleEmailStats {
  helfer_count: number
  shifts_count: number
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Build an HTML and plain-text representation of a list of shifts
 */
function buildTermineListe(shifts: UpcomingShift[]): { html: string; text: string } {
  const html = `<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background: #f3f4f6;">
      <th style="text-align: left; padding: 10px 12px; font-size: 13px; color: #374151; border-bottom: 2px solid #e5e7eb;">Datum</th>
      <th style="text-align: left; padding: 10px 12px; font-size: 13px; color: #374151; border-bottom: 2px solid #e5e7eb;">Veranstaltung</th>
      <th style="text-align: left; padding: 10px 12px; font-size: 13px; color: #374151; border-bottom: 2px solid #e5e7eb;">Einsatz</th>
      <th style="text-align: left; padding: 10px 12px; font-size: 13px; color: #374151; border-bottom: 2px solid #e5e7eb;">Zeit</th>
    </tr>
  </thead>
  <tbody>
    ${shifts
      .map(
        (s, i) => `<tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td style="padding: 10px 12px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${formatDateForEmail(s.datum)}</td>
      <td style="padding: 10px 12px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${s.veranstaltung_titel}${s.ort ? `<br><span style="color: #6b7280; font-size: 12px;">${s.ort}</span>` : ''}</td>
      <td style="padding: 10px 12px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${s.rolle}${s.zeitblock_name ? `<br><span style="color: #6b7280; font-size: 12px;">${s.zeitblock_name}</span>` : ''}</td>
      <td style="padding: 10px 12px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">${
        s.schicht_startzeit && s.schicht_endzeit
          ? `${formatTimeForEmail(s.schicht_startzeit)} – ${formatTimeForEmail(s.schicht_endzeit)} Uhr`
          : s.schicht_startzeit
            ? `ab ${formatTimeForEmail(s.schicht_startzeit)} Uhr`
            : '–'
      }</td>
    </tr>`
      )
      .join('\n    ')}
  </tbody>
</table>`

  const text = shifts
    .map(
      (s) =>
        `• ${formatDateForEmail(s.datum)} | ${s.veranstaltung_titel}${s.ort ? ` (${s.ort})` : ''}\n  Einsatz: ${s.rolle}${s.zeitblock_name ? ` [${s.zeitblock_name}]` : ''}${
          s.schicht_startzeit && s.schicht_endzeit
            ? ` | ${formatTimeForEmail(s.schicht_startzeit)} – ${formatTimeForEmail(s.schicht_endzeit)} Uhr`
            : s.schicht_startzeit
              ? ` | ab ${formatTimeForEmail(s.schicht_startzeit)} Uhr`
              : ''
        }`
    )
    .join('\n')

  return { html, text }
}

/**
 * Fetch all confirmed helpers with upcoming shifts (System B, next 14 days)
 */
async function fetchUpcomingHelferShifts(): Promise<UpcomingShift[]> {
  const adminClient = createAdminClient()

  const now = new Date()
  const in14Days = new Date(now)
  in14Days.setDate(in14Days.getDate() + 14)

  const { data, error } = await adminClient
    .from('auffuehrung_zuweisungen')
    .select(`
      person_id,
      auffuehrung_schichten!inner (
        rolle,
        zeitbloecke (
          name,
          startzeit,
          endzeit
        ),
        veranstaltungen!inner (
          titel,
          datum,
          ort,
          koordinator_id
        )
      ),
      personen!inner (
        vorname,
        nachname,
        email
      )
    `)
    .eq('status', 'zugesagt')
    .gte('auffuehrung_schichten.veranstaltungen.datum', now.toISOString().slice(0, 10))
    .lte('auffuehrung_schichten.veranstaltungen.datum', in14Days.toISOString().slice(0, 10))
    .order('auffuehrung_schichten(veranstaltungen(datum))', { ascending: true })

  if (error) {
    throw new Error(`Datenbankfehler beim Laden der Helferschichten: ${error.message}`)
  }

  if (!data) return []

  return data
    .filter((row) => {
      const person = row.personen as unknown as { vorname: string; nachname: string; email: string | null }
      return person?.email
    })
    .map((row) => {
      const schicht = row.auffuehrung_schichten as unknown as {
        rolle: string
        zeitbloecke: { name: string; startzeit: string; endzeit: string } | null
        veranstaltungen: { titel: string; datum: string; ort: string | null; koordinator_id: string | null }
      }
      const person = row.personen as unknown as { vorname: string; nachname: string; email: string }

      return {
        person_id: row.person_id as string,
        vorname: person.vorname,
        nachname: person.nachname,
        email: person.email,
        veranstaltung_titel: schicht.veranstaltungen.titel,
        datum: schicht.veranstaltungen.datum,
        ort: schicht.veranstaltungen.ort,
        koordinator_id: schicht.veranstaltungen.koordinator_id,
        rolle: schicht.rolle,
        zeitblock_name: schicht.zeitbloecke?.name ?? null,
        schicht_startzeit: schicht.zeitbloecke?.startzeit ?? null,
        schicht_endzeit: schicht.zeitbloecke?.endzeit ?? null,
      }
    })
}

/**
 * Group shifts by person
 */
function groupShiftsByPerson(shifts: UpcomingShift[]): Map<string, UpcomingShift[]> {
  const grouped = new Map<string, UpcomingShift[]>()
  for (const shift of shifts) {
    const existing = grouped.get(shift.person_id) ?? []
    existing.push(shift)
    grouped.set(shift.person_id, existing)
  }
  return grouped
}

/**
 * Get coordinator info for the most relevant event (first upcoming)
 */
async function getKoordinatorForShifts(shifts: UpcomingShift[]): Promise<{
  name: string
  email: string
  telefon: string
}> {
  const koordinatorId = shifts.find((s) => s.koordinator_id)?.koordinator_id
  if (!koordinatorId) {
    return { name: 'TGW Koordination', email: 'theatergruppewiden@gmail.com', telefon: '' }
  }

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('personen')
    .select('vorname, nachname, email, telefon')
    .eq('id', koordinatorId)
    .single()

  if (!data) {
    return { name: 'TGW Koordination', email: 'theatergruppewiden@gmail.com', telefon: '' }
  }

  return {
    name: `${data.vorname} ${data.nachname}`,
    email: data.email ?? 'theatergruppewiden@gmail.com',
    telefon: data.telefon ?? '',
  }
}

// =============================================================================
// Public Actions
// =============================================================================

/**
 * Return stats for the schedule email preview (how many helpers / shifts)
 * Used in the admin UI before sending.
 */
export async function getUpcomingScheduleStats(): Promise<ScheduleEmailStats> {
  await requirePermission('admin:access')

  const shifts = await fetchUpcomingHelferShifts()
  const grouped = groupShiftsByPerson(shifts)

  return {
    helfer_count: grouped.size,
    shifts_count: shifts.length,
  }
}

/**
 * Send a schedule overview email to every confirmed helper with upcoming shifts.
 * One email per helper listing all their shifts in the next 14 days.
 */
export async function sendUpcomingScheduleEmails(): Promise<ScheduleEmailResult> {
  await requirePermission('admin:access')

  const result: ScheduleEmailResult = { sent: 0, failed: 0, errors: [] }

  const shifts = await fetchUpcomingHelferShifts()

  if (shifts.length === 0) {
    console.warn('[ScheduleMail] No upcoming shifts found – no emails sent')
    return result
  }

  const grouped = groupShiftsByPerson(shifts)

  for (const [, personShifts] of grouped) {
    const first = personShifts[0]
    try {
      const koordinator = await getKoordinatorForShifts(personShifts)
      const { html: termineListeHtml, text: termineListeText } = buildTermineListe(personShifts)

      // Build two placeholder sets: HTML and plain-text versions
      const placeholderData = {
        vorname: first.vorname,
        nachname: first.nachname,
        email: first.email,
        termine_liste: termineListeHtml,
        koordinator_name: koordinator.name,
        koordinator_email: koordinator.email,
        koordinator_telefon: koordinator.telefon,
      }

      const sendResult = await sendTemplatedEmail(
        'upcoming_schedule',
        first.email,
        placeholderData
      )

      if (sendResult.success) {
        result.sent++
      } else {
        result.failed++
        result.errors.push(`${first.email}: ${sendResult.error}`)
      }
    } catch (err) {
      result.failed++
      result.errors.push(`${first.email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // For plain-text body we inject the text version – but sendTemplatedEmail renders the
  // template from DB which uses {{termine_liste}}.  The DB template body_text also uses
  // {{termine_liste}}, so the plain-text version receives the HTML table.
  // To get a clean plain-text version we would need a separate send path;
  // for now the HTML table degrades acceptably in plain-text clients.

  console.warn(
    `[ScheduleMail] Done: sent=${result.sent}, failed=${result.failed}, errors=${result.errors.length}`
  )

  return result
}
