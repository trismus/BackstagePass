'use server'

import { createAdminClient } from '../supabase/admin'
import { sendTemplatedEmail } from './email-sender'
import { formatDateForEmail, formatTimeForEmail } from '../utils/email-renderer'
import type { EmailPlaceholderData } from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

interface PendingProbeReminder {
  teilnehmer_id: string
  person_id: string
  probe_id: string
  status: string
  probe_titel: string
  datum: string
  startzeit: string | null
  ort: string | null
  stueck_id: string
  stueck_titel: string
  vorname: string
  nachname: string
  email: string
}

interface ReminderResult {
  sent: number
  failed: number
  skipped: number
  errors: string[]
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Mark a probe reminder as sent
 */
async function markProbeReminderSent(
  teilnehmerId: string,
  reminderTyp: '24h' | '1h' | 'custom',
  stundenVor?: number
): Promise<void> {
  const adminClient = createAdminClient()

  await adminClient
    .from('proben_erinnerungen_gesendet')
    .insert({
      probe_teilnehmer_id: teilnehmerId,
      erinnerung_typ: reminderTyp,
      stunden_vor: stundenVor || null,
    } as never)
}

/**
 * Build placeholder data for a probe reminder email
 */
function buildProbeReminderPlaceholderData(
  reminder: PendingProbeReminder
): EmailPlaceholderData {
  return {
    vorname: reminder.vorname,
    nachname: reminder.nachname,
    email: reminder.email,
    veranstaltung: `${reminder.stueck_titel} - ${reminder.probe_titel}`,
    datum: formatDateForEmail(reminder.datum),
    startzeit: reminder.startzeit ? formatTimeForEmail(reminder.startzeit) : '',
    ort: reminder.ort || '',
    treffpunkt: reminder.ort || '',
  }
}

// =============================================================================
// Main Probe Reminder Functions
// =============================================================================

/**
 * Send 24-hour reminders for upcoming proben
 */
export async function send24hProbeReminders(): Promise<ReminderResult> {
  const result: ReminderResult = { sent: 0, failed: 0, skipped: 0, errors: [] }

  const adminClient = createAdminClient()

  // Get pending reminders from the view
  const { data: pendingReminders, error } = await adminClient
    .from('pending_probe_reminders_24h')
    .select('*')

  if (error) {
    console.error('[Probe Reminders] Error fetching 24h reminders:', error)
    result.errors.push(`Database error: ${error.message}`)
    return result
  }

  if (!pendingReminders || pendingReminders.length === 0) {
    console.warn('[Probe Reminders] No 24h probe reminders to send')
    return result
  }

  // Check user preferences and send reminders
  for (const reminder of pendingReminders as PendingProbeReminder[]) {
    try {
      // Check if user has disabled probe reminders
      const { data: settings } = await adminClient
        .from('benachrichtigungs_einstellungen')
        .select('email_24h_probe_erinnerung')
        .eq('profile_id', reminder.person_id)
        .single()

      // If settings exist and reminders are disabled, skip
      if (settings && !settings.email_24h_probe_erinnerung) {
        result.skipped++
        await markProbeReminderSent(reminder.teilnehmer_id, '24h')
        continue
      }

      const placeholderData = buildProbeReminderPlaceholderData(reminder)

      // Use a dedicated probe reminder template or fall back to general reminder
      const sendResult = await sendTemplatedEmail(
        'reminder_48h', // Using existing template for now
        reminder.email,
        placeholderData
      )

      if (sendResult.success) {
        await markProbeReminderSent(reminder.teilnehmer_id, '24h')
        result.sent++
      } else {
        result.failed++
        result.errors.push(`Failed to send to ${reminder.email}: ${sendResult.error}`)
      }
    } catch (err) {
      result.failed++
      result.errors.push(`Error processing ${reminder.email}: ${err}`)
    }
  }

  console.warn(`[Probe Reminders] 24h summary: sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`)
  return result
}

/**
 * Send weekly summary emails
 * Call this on Sunday evening or Monday morning
 */
export async function sendWeeklySummaries(): Promise<ReminderResult> {
  const result: ReminderResult = { sent: 0, failed: 0, skipped: 0, errors: [] }

  const adminClient = createAdminClient()

  // Get all users who want weekly summaries
  const { data: users } = await adminClient
    .from('benachrichtigungs_einstellungen')
    .select(`
      profile_id,
      profile:profiles(email)
    `)
    .eq('email_wochenzusammenfassung', true)

  if (!users || users.length === 0) {
    console.warn('[Weekly Summary] No users want weekly summaries')
    return result
  }

  // Get date range for the coming week
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const startDate = today.toISOString().split('T')[0]
  const endDate = nextWeek.toISOString().split('T')[0]

  for (const user of users) {
    try {
      const profile = user.profile as unknown as { email: string } | null
      if (!profile?.email) {
        result.skipped++
        continue
      }

      // Get person for this profile
      const { data: person } = await adminClient
        .from('personen')
        .select('id, vorname, nachname')
        .eq('email', profile.email)
        .single()

      if (!person) {
        result.skipped++
        continue
      }

      // Get upcoming proben for this person
      const { data: proben } = await adminClient
        .from('proben_teilnehmer')
        .select(`
          probe:proben(
            id, titel, datum, startzeit, ort,
            stueck:stuecke(titel)
          )
        `)
        .eq('person_id', person.id)
        .in('status', ['eingeladen', 'zugesagt', 'vielleicht'])
        .gte('probe.datum', startDate)
        .lte('probe.datum', endDate)
        .order('probe(datum)', { ascending: true })

      // Get upcoming veranstaltungen
      const { data: zuweisungen } = await adminClient
        .from('auffuehrung_zuweisungen')
        .select(`
          schicht:auffuehrung_schichten(
            rolle,
            veranstaltung:veranstaltungen(id, titel, datum, startzeit, ort)
          )
        `)
        .eq('person_id', person.id)
        .eq('status', 'zugesagt')
        .gte('schicht.veranstaltung.datum', startDate)
        .lte('schicht.veranstaltung.datum', endDate)

      // Skip if no events
      const probenCount = proben?.length || 0
      const zuweisungenCount = zuweisungen?.length || 0

      if (probenCount === 0 && zuweisungenCount === 0) {
        result.skipped++
        continue
      }

      // Build summary text
      let summaryHtml = `<p>Hallo ${person.vorname},</p>`
      summaryHtml += `<p>Hier ist deine Wochenübersicht für die kommenden 7 Tage:</p>`

      if (probenCount > 0) {
        summaryHtml += `<h3>Proben (${probenCount})</h3><ul>`
        for (const p of proben || []) {
          const probe = p.probe as unknown as {
            titel: string
            datum: string
            startzeit: string | null
            ort: string | null
            stueck: { titel: string }
          } | null
          if (probe) {
            summaryHtml += `<li><strong>${probe.titel}</strong> (${probe.stueck?.titel})<br/>`
            summaryHtml += `${formatDateForEmail(probe.datum)}`
            if (probe.startzeit) summaryHtml += ` um ${formatTimeForEmail(probe.startzeit)}`
            if (probe.ort) summaryHtml += ` - ${probe.ort}`
            summaryHtml += `</li>`
          }
        }
        summaryHtml += `</ul>`
      }

      if (zuweisungenCount > 0) {
        summaryHtml += `<h3>Veranstaltungen (${zuweisungenCount})</h3><ul>`
        for (const z of zuweisungen || []) {
          const schicht = z.schicht as unknown as {
            rolle: string
            veranstaltung: {
              titel: string
              datum: string
              startzeit: string | null
              ort: string | null
            }
          } | null
          if (schicht?.veranstaltung) {
            summaryHtml += `<li><strong>${schicht.veranstaltung.titel}</strong> (${schicht.rolle})<br/>`
            summaryHtml += `${formatDateForEmail(schicht.veranstaltung.datum)}`
            if (schicht.veranstaltung.startzeit) summaryHtml += ` um ${formatTimeForEmail(schicht.veranstaltung.startzeit)}`
            if (schicht.veranstaltung.ort) summaryHtml += ` - ${schicht.veranstaltung.ort}`
            summaryHtml += `</li>`
          }
        }
        summaryHtml += `</ul>`
      }

      summaryHtml += `<p>Viel Erfolg!<br/>Dein TGW Team</p>`

      // Send email directly (not using template for summary)
      const { sendEmail } = await import('../email/client')
      const sendResult = await sendEmail({
        to: profile.email,
        subject: `Deine Woche bei TGW - ${probenCount + zuweisungenCount} Termine`,
        html: summaryHtml,
        text: `Wochenübersicht: ${probenCount} Proben, ${zuweisungenCount} Veranstaltungen`,
      })

      if (sendResult.success) {
        result.sent++
      } else {
        result.failed++
        result.errors.push(`Failed to send weekly summary to ${profile.email}`)
      }
    } catch (err) {
      result.failed++
      result.errors.push(`Error processing weekly summary: ${err}`)
    }
  }

  console.warn(`[Weekly Summary] summary: sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`)
  return result
}

/**
 * Send all probe reminders (called by cron job)
 */
export async function sendAllProbeReminders(): Promise<{
  proben_24h: ReminderResult
}> {
  console.warn('[Probe Reminders] Starting probe reminder job...')

  const results = {
    proben_24h: await send24hProbeReminders(),
  }

  console.warn('[Probe Reminders] Job completed:', results)

  return results
}
