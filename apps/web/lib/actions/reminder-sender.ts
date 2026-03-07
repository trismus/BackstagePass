'use server'

import { createClient } from '../supabase/server'
import { createAdminClient } from '../supabase/admin'
import { sendTemplatedEmail } from './email-sender'
import { formatDateForEmail, formatTimeForEmail } from '../utils/email-renderer'
import type { EmailPlaceholderData } from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

interface PendingReminder {
  zuweisung_id: string
  person_id: string
  schicht_id: string
  veranstaltung_id: string
  veranstaltung_titel: string
  datum: string
  startzeit: string | null
  ort: string | null
  koordinator_id: string | null
  rolle: string
  zeitblock_name: string | null
  schicht_startzeit: string | null
  schicht_endzeit: string | null
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
 * Get coordinator info for a veranstaltung
 */
async function getKoordinatorInfo(koordinatorId: string | null): Promise<{
  name: string
  email: string
  telefon: string
}> {
  if (!koordinatorId) {
    return {
      name: 'TGW Koordination',
      email: 'helfer@tgw.ch',
      telefon: '',
    }
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('personen')
    .select('vorname, nachname, email, telefon')
    .eq('id', koordinatorId)
    .single()

  if (!data) {
    return {
      name: 'TGW Koordination',
      email: 'helfer@tgw.ch',
      telefon: '',
    }
  }

  return {
    name: `${data.vorname} ${data.nachname}`,
    email: data.email || 'helfer@tgw.ch',
    telefon: data.telefon || '',
  }
}

/**
 * Get info blocks for a veranstaltung (briefing, helferessen times)
 */
async function getInfoBlockTimes(veranstaltungId: string): Promise<{
  briefingZeit: string
  treffpunkt: string
}> {
  const supabase = await createClient()

  const { data: infoBloecke } = await supabase
    .from('info_bloecke')
    .select('titel, startzeit, beschreibung')
    .eq('veranstaltung_id', veranstaltungId)

  let briefingZeit = ''
  let treffpunkt = ''

  for (const block of infoBloecke || []) {
    const titelLower = block.titel.toLowerCase()
    if (titelLower.includes('briefing')) {
      briefingZeit = block.startzeit ? formatTimeForEmail(block.startzeit) + ' Uhr' : ''
      treffpunkt = block.beschreibung || ''
    }
  }

  return { briefingZeit, treffpunkt }
}

/**
 * Mark a reminder as sent
 */
async function markRemindersSentBatch(
  zuweisungIds: string[],
  reminderTyp: '48h' | '6h'
): Promise<void> {
  if (zuweisungIds.length === 0) return

  const supabase = await createClient()

  const rows = zuweisungIds.map((id) => ({
    anmeldung_id: id,
    reminder_typ: reminderTyp,
  }))

  const { error } = await supabase
    .from('reminders_sent')
    .insert(rows as never)

  if (error) {
    console.error('[Reminders] Error batch-marking reminders as sent:', error)
  }
}

/**
 * Group reminders by helper to send one email per helper
 */
function groupRemindersByHelper(
  reminders: PendingReminder[]
): Map<string, PendingReminder[]> {
  const grouped = new Map<string, PendingReminder[]>()

  for (const reminder of reminders) {
    const key = `${reminder.person_id}-${reminder.veranstaltung_id}`
    const existing = grouped.get(key) || []
    existing.push(reminder)
    grouped.set(key, existing)
  }

  return grouped
}

/**
 * Build placeholder data for a reminder email
 */
async function buildReminderPlaceholderData(
  reminders: PendingReminder[]
): Promise<EmailPlaceholderData> {
  const first = reminders[0]

  // Get coordinator info
  const koordinator = await getKoordinatorInfo(first.koordinator_id)

  // Get info blocks
  const infoTimes = await getInfoBlockTimes(first.veranstaltung_id)

  // If multiple shifts, format as list (for the email template)
  // For now, we use the first shift's info (template can be extended later)
  const schichtInfo = reminders.length > 1
    ? reminders.map(r => `${r.rolle} (${formatTimeForEmail(r.schicht_startzeit || '')} - ${formatTimeForEmail(r.schicht_endzeit || '')})`).join(', ')
    : first.rolle

  return {
    vorname: first.vorname,
    nachname: first.nachname,
    email: first.email,
    veranstaltung: first.veranstaltung_titel,
    datum: formatDateForEmail(first.datum),
    ort: first.ort || '',
    rolle: schichtInfo,
    startzeit: first.schicht_startzeit ? formatTimeForEmail(first.schicht_startzeit) : '',
    endzeit: first.schicht_endzeit ? formatTimeForEmail(first.schicht_endzeit) : '',
    treffpunkt: infoTimes.treffpunkt || first.ort || '',
    briefing_zeit: infoTimes.briefingZeit,
    koordinator_name: koordinator.name,
    koordinator_email: koordinator.email,
    koordinator_telefon: koordinator.telefon,
  }
}

// =============================================================================
// Main Reminder Functions
// =============================================================================

/**
 * Send 48-hour reminders for upcoming events
 */
export async function send48hReminders(): Promise<ReminderResult> {
  const result: ReminderResult = { sent: 0, failed: 0, skipped: 0, errors: [] }

  // Use admin client for accessing views
  const adminClient = createAdminClient()

  // Get pending reminders from the view
  const { data: pendingReminders, error } = await adminClient
    .from('pending_reminders_48h')
    .select('*')

  if (error) {
    console.error('[Reminders] Error fetching 48h reminders:', error)
    result.errors.push(`Database error: ${error.message}`)
    return result
  }

  if (!pendingReminders || pendingReminders.length === 0) {
    console.warn('[Reminders] No 48h reminders to send')
    return result
  }

  // Group by helper (one email per helper per event)
  const grouped = groupRemindersByHelper(pendingReminders as PendingReminder[])

  for (const reminders of grouped.values()) {
    try {
      const placeholderData = await buildReminderPlaceholderData(reminders)

      const sendResult = await sendTemplatedEmail(
        'reminder_48h',
        reminders[0].email,
        placeholderData,
        { anmeldungId: reminders[0].zuweisung_id }
      )

      if (sendResult.success) {
        // Batch mark all reminders for this helper as sent
        await markRemindersSentBatch(
          reminders.map((r) => r.zuweisung_id),
          '48h'
        )
        result.sent += reminders.length
      } else {
        result.failed += reminders.length
        result.errors.push(`Failed to send to ${reminders[0].email}: ${sendResult.error}`)
      }
    } catch (err) {
      result.failed += reminders.length
      result.errors.push(`Error processing ${reminders[0].email}: ${err}`)
    }
  }

  console.warn(`[Reminders] 48h summary: sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`)
  return result
}

/**
 * Send 6-hour reminders for upcoming events
 */
export async function send6hReminders(): Promise<ReminderResult> {
  const result: ReminderResult = { sent: 0, failed: 0, skipped: 0, errors: [] }

  // Use admin client for accessing views
  const adminClient = createAdminClient()

  // Get pending reminders from the view
  const { data: pendingReminders, error } = await adminClient
    .from('pending_reminders_6h')
    .select('*')

  if (error) {
    console.error('[Reminders] Error fetching 6h reminders:', error)
    result.errors.push(`Database error: ${error.message}`)
    return result
  }

  if (!pendingReminders || pendingReminders.length === 0) {
    console.warn('[Reminders] No 6h reminders to send')
    return result
  }

  // Group by helper (one email per helper per event)
  const grouped = groupRemindersByHelper(pendingReminders as PendingReminder[])

  for (const reminders of grouped.values()) {
    try {
      const placeholderData = await buildReminderPlaceholderData(reminders)

      const sendResult = await sendTemplatedEmail(
        'reminder_6h',
        reminders[0].email,
        placeholderData,
        { anmeldungId: reminders[0].zuweisung_id }
      )

      if (sendResult.success) {
        // Batch mark all reminders for this helper as sent
        await markRemindersSentBatch(
          reminders.map((r) => r.zuweisung_id),
          '6h'
        )
        result.sent += reminders.length
      } else {
        result.failed += reminders.length
        result.errors.push(`Failed to send to ${reminders[0].email}: ${sendResult.error}`)
      }
    } catch (err) {
      result.failed += reminders.length
      result.errors.push(`Error processing ${reminders[0].email}: ${err}`)
    }
  }

  console.warn(`[Reminders] 6h summary: sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`)
  return result
}

/**
 * Send all pending reminders (both 48h and 6h)
 * This is the main function called by the cron job
 */
export async function sendAllReminders(): Promise<{
  reminders_48h: ReminderResult
  reminders_6h: ReminderResult
}> {
  console.warn('[Reminders] Starting reminder job...')

  const results = {
    reminders_48h: await send48hReminders(),
    reminders_6h: await send6hReminders(),
  }

  console.warn('[Reminders] Reminder job completed:', results)

  return results
}
