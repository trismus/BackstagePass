'use server'

/**
 * Proben Sofort-Mail Helper (Issue #489)
 *
 * Best-effort email dispatch for probe invitation / change / cancellation.
 * Triggered from `proben.ts` after the underlying mutation has succeeded.
 * Errors are logged but NEVER re-thrown — the probe action must succeed even
 * if email sending fails (SMTP outage, missing config, etc.).
 */

import { createAdminClient } from '../supabase/admin'
import { sendEmailWithRetry } from '../email/client'
import {
  probeEinladungEmail,
  probeAenderungEmail,
  probeAbsageEmail,
  type ProbeAenderungChange,
} from '../email/templates/proben'

// =============================================================================
// Types
// =============================================================================

export interface ProbeEmailResult {
  sent: number
  skipped: number
  failed: number
}

interface ProbeBasic {
  id: string
  titel: string
  datum: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  stueck_id: string
  status: string
  stueck_titel: string | null
}

interface PersonInfo {
  id: string
  vorname: string
  nachname: string
  email: string | null
  profile_id: string | null
}

type OptOutFlag = 'email_neue_einladung' | 'email_aenderungsbenachrichtigung'

// =============================================================================
// Helpers
// =============================================================================

function buildProbeLink(probeId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/proben/${probeId}`
}

async function fetchProbe(probeId: string): Promise<ProbeBasic | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('proben')
    .select('id, titel, datum, startzeit, endzeit, ort, stueck_id, status, stueck:stuecke(titel)')
    .eq('id', probeId)
    .single()

  if (error || !data) {
    if (error) console.error('[Proben Email] Failed to fetch probe:', error.message)
    return null
  }

  const stueck = (data as unknown as { stueck: { titel: string } | null }).stueck
  return {
    id: data.id as string,
    titel: data.titel as string,
    datum: data.datum as string,
    startzeit: (data.startzeit as string | null) ?? null,
    endzeit: (data.endzeit as string | null) ?? null,
    ort: (data.ort as string | null) ?? null,
    stueck_id: data.stueck_id as string,
    status: data.status as string,
    stueck_titel: stueck?.titel ?? null,
  }
}

async function fetchPersonsWithProfiles(personIds: string[]): Promise<PersonInfo[]> {
  if (personIds.length === 0) return []

  const admin = createAdminClient()

  const { data: personen, error } = await admin
    .from('personen')
    .select('id, vorname, nachname, email')
    .in('id', personIds)

  if (error || !personen) {
    if (error) console.error('[Proben Email] Failed to fetch personen:', error.message)
    return []
  }

  const withEmail = personen.filter(
    (p): p is { id: string; vorname: string; nachname: string; email: string } =>
      typeof p.email === 'string' && p.email.length > 0
  )

  if (withEmail.length === 0) return []

  const emails = withEmail.map((p) => p.email)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email')
    .in('email', emails)

  const profileMap = new Map<string, string>()
  for (const p of profiles || []) {
    if (typeof p.email === 'string') profileMap.set(p.email.toLowerCase(), p.id as string)
  }

  return withEmail.map((p) => ({
    id: p.id,
    vorname: p.vorname,
    nachname: p.nachname,
    email: p.email,
    profile_id: profileMap.get(p.email.toLowerCase()) ?? null,
  }))
}

async function isOptedOut(profileId: string | null, flag: OptOutFlag): Promise<boolean> {
  if (!profileId) return false

  const admin = createAdminClient()
  const { data } = await admin
    .from('benachrichtigungs_einstellungen')
    .select(flag)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (!data) return false
  return (data as Record<string, boolean | null>)[flag] === false
}

async function logEmailFailure(
  templateTyp: string,
  recipientEmail: string,
  recipientName: string,
  errorMessage: string
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('email_logs').insert({
      template_typ: templateTyp,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      status: 'failed',
      error_message: errorMessage,
    } as never)
  } catch (err) {
    console.error('[Proben Email] Failed to log email failure:', err)
  }
}

/**
 * Returns the set of person_ids currently in proben_teilnehmer for a given
 * probe. Used by callers in `proben.ts` to compute the "new IDs" diff.
 */
export async function getExistingTeilnehmerPersonIds(probeId: string): Promise<Set<string>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('proben_teilnehmer')
    .select('person_id')
    .eq('probe_id', probeId)

  if (error || !data) {
    if (error) console.error('[Proben Email] Failed to fetch existing teilnehmer:', error.message)
    return new Set()
  }

  return new Set(data.map((t: { person_id: string }) => t.person_id))
}

// =============================================================================
// Sofort-Einladung
// =============================================================================

export async function sendProbeEinladungEmails(
  probeId: string,
  personIds: string[]
): Promise<ProbeEmailResult> {
  const result: ProbeEmailResult = { sent: 0, skipped: 0, failed: 0 }

  if (personIds.length === 0) return result

  const probe = await fetchProbe(probeId)
  if (!probe) return result

  const persons = await fetchPersonsWithProfiles(personIds)

  for (const person of persons) {
    try {
      if (!person.email) {
        result.skipped++
        continue
      }

      const optedOut = await isOptedOut(person.profile_id, 'email_neue_einladung')
      if (optedOut) {
        result.skipped++
        continue
      }

      const { subject, html, text } = probeEinladungEmail({
        vorname: person.vorname,
        probeTitel: probe.titel,
        stueckTitel: probe.stueck_titel ?? undefined,
        datum: probe.datum,
        startzeit: probe.startzeit,
        endzeit: probe.endzeit,
        ort: probe.ort,
        probeLink: buildProbeLink(probe.id),
      })

      const sendResult = await sendEmailWithRetry({
        to: person.email,
        subject,
        html,
        text,
        logging: {
          templateTyp: 'probe_einladung',
          recipientName: `${person.vorname} ${person.nachname}`,
        },
      })

      if (sendResult.success) {
        result.sent++
      } else {
        result.failed++
        await logEmailFailure(
          'probe_einladung',
          person.email,
          `${person.vorname} ${person.nachname}`,
          sendResult.error || 'unknown error'
        )
      }
    } catch (err) {
      result.failed++
      console.error('[Proben Email] Unexpected error for', person.email, err)
    }
  }

  const handled = result.sent + result.failed + result.skipped
  const unaccounted = personIds.length - handled
  if (unaccounted > 0) {
    result.skipped += unaccounted
  }

  return result
}

// =============================================================================
// Änderungs-Mail
// =============================================================================

export async function sendProbeAenderungEmails(
  probeId: string,
  changes: ProbeAenderungChange[]
): Promise<ProbeEmailResult> {
  const result: ProbeEmailResult = { sent: 0, skipped: 0, failed: 0 }

  if (changes.length === 0) return result

  const probe = await fetchProbe(probeId)
  if (!probe) return result

  const admin = createAdminClient()
  const { data: teilnehmer, error } = await admin
    .from('proben_teilnehmer')
    .select('person_id, status')
    .eq('probe_id', probeId)
    .in('status', ['eingeladen', 'zugesagt', 'vielleicht'])

  if (error || !teilnehmer || teilnehmer.length === 0) {
    if (error) console.error('[Proben Email] Failed to fetch teilnehmer:', error.message)
    return result
  }

  const personIds = teilnehmer.map((t: { person_id: string }) => t.person_id)
  const persons = await fetchPersonsWithProfiles(personIds)

  for (const person of persons) {
    try {
      if (!person.email) {
        result.skipped++
        continue
      }

      const optedOut = await isOptedOut(person.profile_id, 'email_aenderungsbenachrichtigung')
      if (optedOut) {
        result.skipped++
        continue
      }

      const { subject, html, text } = probeAenderungEmail({
        vorname: person.vorname,
        probeTitel: probe.titel,
        stueckTitel: probe.stueck_titel ?? undefined,
        datum: probe.datum,
        startzeit: probe.startzeit,
        endzeit: probe.endzeit,
        ort: probe.ort,
        changes,
        probeLink: buildProbeLink(probe.id),
      })

      const sendResult = await sendEmailWithRetry({
        to: person.email,
        subject,
        html,
        text,
        logging: {
          templateTyp: 'probe_aenderung',
          recipientName: `${person.vorname} ${person.nachname}`,
        },
      })

      if (sendResult.success) {
        result.sent++
      } else {
        result.failed++
        await logEmailFailure(
          'probe_aenderung',
          person.email,
          `${person.vorname} ${person.nachname}`,
          sendResult.error || 'unknown error'
        )
      }
    } catch (err) {
      result.failed++
      console.error('[Proben Email] Unexpected error for', person.email, err)
    }
  }

  const handled = result.sent + result.failed + result.skipped
  const unaccounted = personIds.length - handled
  if (unaccounted > 0) result.skipped += unaccounted

  return result
}

// =============================================================================
// Absage-Mail
// =============================================================================

export async function sendProbeAbsageEmails(
  probeId: string,
  grund?: string
): Promise<ProbeEmailResult> {
  const result: ProbeEmailResult = { sent: 0, skipped: 0, failed: 0 }

  const probe = await fetchProbe(probeId)
  if (!probe) return result

  const admin = createAdminClient()
  const { data: teilnehmer, error } = await admin
    .from('proben_teilnehmer')
    .select('person_id, status')
    .eq('probe_id', probeId)
    .in('status', ['eingeladen', 'zugesagt', 'vielleicht'])

  if (error || !teilnehmer || teilnehmer.length === 0) {
    if (error) console.error('[Proben Email] Failed to fetch teilnehmer:', error.message)
    return result
  }

  const personIds = teilnehmer.map((t: { person_id: string }) => t.person_id)
  const persons = await fetchPersonsWithProfiles(personIds)

  for (const person of persons) {
    try {
      if (!person.email) {
        result.skipped++
        continue
      }

      const optedOut = await isOptedOut(person.profile_id, 'email_aenderungsbenachrichtigung')
      if (optedOut) {
        result.skipped++
        continue
      }

      const { subject, html, text } = probeAbsageEmail({
        vorname: person.vorname,
        probeTitel: probe.titel,
        stueckTitel: probe.stueck_titel ?? undefined,
        datum: probe.datum,
        grund: grund ?? null,
      })

      const sendResult = await sendEmailWithRetry({
        to: person.email,
        subject,
        html,
        text,
        logging: {
          templateTyp: 'probe_absage',
          recipientName: `${person.vorname} ${person.nachname}`,
        },
      })

      if (sendResult.success) {
        result.sent++
      } else {
        result.failed++
        await logEmailFailure(
          'probe_absage',
          person.email,
          `${person.vorname} ${person.nachname}`,
          sendResult.error || 'unknown error'
        )
      }
    } catch (err) {
      result.failed++
      console.error('[Proben Email] Unexpected error for', person.email, err)
    }
  }

  const handled = result.sent + result.failed + result.skipped
  const unaccounted = personIds.length - handled
  if (unaccounted > 0) result.skipped += unaccounted

  return result
}
