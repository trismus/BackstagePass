'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import {
  sendEmail,
  isEmailServiceConfigured as isEmailConfigured,
} from '../email/client'
import {
  schichterinnerungEmail,
  type ErinnerungSchicht,
} from '../email/templates/helferliste'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTimeRange(start: string | null, end: string | null): string {
  if (!start) return ''
  const fmt = (t: string) => {
    if (t.includes('T')) {
      return new Date(t).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
    }
    return t.substring(0, 5)
  }
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

export interface ErinnerungResult {
  success: boolean
  sent: number
  skipped: number
  errors: number
  details: Array<{ name: string; email: string; status: 'sent' | 'skipped' | 'error'; reason?: string }>
}

/**
 * Send shift reminder emails to all helpers who have upcoming assigned shifts.
 * Covers both internal (personen / auffuehrung_zuweisungen) and external helpers.
 */
export async function sendHelferSchichtErinnerung(): Promise<ErinnerungResult> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()
  const today = new Date().toISOString().substring(0, 10)

  const result: ErinnerungResult = {
    success: true,
    sent: 0,
    skipped: 0,
    errors: 0,
    details: [],
  }

  // ---------------------------------------------------------------------------
  // 1. Internal helpers (personen) via System B (auffuehrung_zuweisungen)
  // ---------------------------------------------------------------------------
  const { data: internRows, error: internError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      status,
      person:personen!auffuehrung_zuweisungen_person_id_fkey(
        id, vorname, nachname, email
      ),
      schicht:auffuehrung_schichten!inner(
        rolle,
        veranstaltung:veranstaltungen!inner(
          titel,
          datum,
          startzeit
        ),
        zeitblock:zeitbloecke(
          startzeit,
          endzeit
        )
      )
    `)
    .not('person_id', 'is', null)

  if (internError) {
    console.error('[Erinnerung] Error fetching internal assignments:', internError)
  }

  // Group by person
  const internMap = new Map<
    string,
    { vorname: string; nachname: string; email: string; schichten: ErinnerungSchicht[] }
  >()

  for (const row of internRows ?? []) {
    const person = row.person as unknown as {
      id: string; vorname: string; nachname: string; email: string | null
    } | null
    if (!person?.email) continue

    const schicht = row.schicht as unknown as {
      rolle: string
      veranstaltung: { titel: string; datum: string; startzeit: string | null }
      zeitblock: { startzeit: string; endzeit: string } | null
    } | null
    if (!schicht?.veranstaltung) continue
    // Only include upcoming shifts
    if (schicht.veranstaltung.datum < today) continue

    const key = person.id
    if (!internMap.has(key)) {
      internMap.set(key, {
        vorname: person.vorname,
        nachname: person.nachname,
        email: person.email,
        schichten: [],
      })
    }

    internMap.get(key)!.schichten.push({
      veranstaltung: schicht.veranstaltung.titel,
      datum: formatDate(schicht.veranstaltung.datum),
      rolle: schicht.rolle,
      zeitblock: formatTimeRange(
        schicht.zeitblock?.startzeit ?? schicht.veranstaltung.startzeit ?? null,
        schicht.zeitblock?.endzeit ?? null
      ) || undefined,
      status: row.status,
    })
  }

  // ---------------------------------------------------------------------------
  // 2. External helpers via System B (auffuehrung_zuweisungen)
  // ---------------------------------------------------------------------------
  const { data: externBRows, error: externBError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      status,
      external_helper:externe_helfer_profile!auffuehrung_zuweisungen_external_helper_id_fkey(
        id, vorname, nachname, email, dashboard_token
      ),
      schicht:auffuehrung_schichten!inner(
        rolle,
        veranstaltung:veranstaltungen!inner(
          titel,
          datum,
          startzeit
        ),
        zeitblock:zeitbloecke(
          startzeit,
          endzeit
        )
      )
    `)
    .not('external_helper_id', 'is', null)

  if (externBError) {
    console.error('[Erinnerung] Error fetching external System B assignments:', externBError)
  }

  // Group external System B by helper id
  type ExternEntry = {
    vorname: string
    nachname: string
    email: string
    dashboardToken: string | null
    schichten: ErinnerungSchicht[]
  }
  const externMap = new Map<string, ExternEntry>()

  for (const row of externBRows ?? []) {
    const helper = row.external_helper as unknown as {
      id: string; vorname: string; nachname: string; email: string | null; dashboard_token: string | null
    } | null
    if (!helper?.email) continue

    const schicht = row.schicht as unknown as {
      rolle: string
      veranstaltung: { titel: string; datum: string; startzeit: string | null }
      zeitblock: { startzeit: string; endzeit: string } | null
    } | null
    if (!schicht?.veranstaltung) continue
    // Only include upcoming shifts
    if (schicht.veranstaltung.datum < today) continue

    const key = helper.id
    if (!externMap.has(key)) {
      externMap.set(key, {
        vorname: helper.vorname,
        nachname: helper.nachname,
        email: helper.email,
        dashboardToken: helper.dashboard_token,
        schichten: [],
      })
    }

    externMap.get(key)!.schichten.push({
      veranstaltung: schicht.veranstaltung.titel,
      datum: formatDate(schicht.veranstaltung.datum),
      rolle: schicht.rolle,
      zeitblock: formatTimeRange(
        schicht.zeitblock?.startzeit ?? schicht.veranstaltung.startzeit ?? null,
        schicht.zeitblock?.endzeit ?? null
      ) || undefined,
      status: row.status,
    })
  }

  // ---------------------------------------------------------------------------
  // 3. Build send list – deduplicate by email (intern takes precedence)
  // ---------------------------------------------------------------------------
  type SendEntry = {
    name: string
    email: string
    schichten: ErinnerungSchicht[]
    dashboardLink?: string
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://backstage-pass.vercel.app'
  const sendList: SendEntry[] = []
  const seenEmails = new Set<string>()

  for (const [, entry] of internMap) {
    if (!entry.schichten.length) continue
    const emailLower = entry.email.toLowerCase()
    seenEmails.add(emailLower)
    sendList.push({
      name: `${entry.vorname} ${entry.nachname}`,
      email: entry.email,
      schichten: entry.schichten,
    })
  }

  for (const [, entry] of externMap) {
    if (!entry.schichten.length) continue
    const emailLower = entry.email.toLowerCase()
    if (seenEmails.has(emailLower)) {
      // Merge shifts into existing intern entry
      const existing = sendList.find((e) => e.email.toLowerCase() === emailLower)
      if (existing) {
        existing.schichten.push(...entry.schichten)
      }
      continue
    }
    seenEmails.add(emailLower)
    sendList.push({
      name: `${entry.vorname} ${entry.nachname}`,
      email: entry.email,
      schichten: entry.schichten,
      dashboardLink: entry.dashboardToken
        ? `${baseUrl}/helfer/meine-einsaetze/${entry.dashboardToken}`
        : undefined,
    })
  }

  // Sort each helper's shifts by date
  for (const entry of sendList) {
    entry.schichten.sort((a, b) => a.datum.localeCompare(b.datum))
  }

  // ---------------------------------------------------------------------------
  // 4. Send emails
  // ---------------------------------------------------------------------------
  if (!isEmailConfigured()) {
    console.warn('[Erinnerung] Email service not configured. Would send to:', sendList.length, 'helpers')
    // In development mode, still count as "sent"
    for (const entry of sendList) {
      result.details.push({ name: entry.name, email: entry.email, status: 'sent' })
      result.sent++
    }
    return result
  }

  for (const entry of sendList) {
    try {
      const { subject, html, text } = schichterinnerungEmail(
        entry.name.split(' ')[0] ?? entry.name,
        entry.schichten,
        entry.dashboardLink
      )

      const emailResult = await sendEmail({
        to: entry.email,
        subject,
        html,
        text,
        logging: {
          templateTyp: 'schicht_erinnerung',
          recipientName: entry.name,
        },
      })

      if (emailResult.success) {
        result.sent++
        result.details.push({ name: entry.name, email: entry.email, status: 'sent' })
      } else {
        result.errors++
        result.details.push({
          name: entry.name,
          email: entry.email,
          status: 'error',
          reason: emailResult.error,
        })
      }
    } catch (err) {
      console.error('[Erinnerung] Failed to send to', entry.email, err)
      result.errors++
      result.details.push({
        name: entry.name,
        email: entry.email,
        status: 'error',
        reason: err instanceof Error ? err.message : 'Unbekannter Fehler',
      })
    }
  }

  result.success = result.errors === 0 || result.sent > 0
  return result
}
