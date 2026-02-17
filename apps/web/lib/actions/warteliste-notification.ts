'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { createAdminClient } from '../supabase/admin'
import { sendWaitlistAssignedEmail, sendTemplatedEmail } from './email-sender'
import type { WartelisteStatus } from '../supabase/types'

// =============================================================================
// Constants
// =============================================================================

// Default deadline is 24 hours after notification
const DEFAULT_DEADLINE_HOURS = 24

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate the confirmation deadline (24 hours from now)
 */
function calculateDeadline(): Date {
  const deadline = new Date()
  deadline.setHours(deadline.getHours() + DEFAULT_DEADLINE_HOURS)
  return deadline
}

/**
 * Get the public link for a veranstaltung
 */
function buildPublicLink(token: string | null): string {
  if (!token) return ''
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/helfer/anmeldung/${token}`
}

// =============================================================================
// Waitlist Processing
// =============================================================================

/**
 * Process waitlist when a slot becomes free
 * Called when someone unregisters from a shift
 */
export async function processWaitlistWithNotification(
  schichtId: string
): Promise<{ success: boolean; notified?: boolean; error?: string }> {
  const supabase = await createClient()

  // Get schicht info
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      veranstaltung_id,
      rolle,
      anzahl_benoetigt,
      zuweisungen:auffuehrung_zuweisungen(id, status)
    `)
    .eq('id', schichtId)
    .single()

  if (!schicht) {
    return { success: false, error: 'Schicht nicht gefunden' }
  }

  // Count active zuweisungen
  const activeCount = (schicht.zuweisungen || []).filter(
    (z: { status: string }) => z.status !== 'abgesagt'
  ).length

  // Check if there's space
  if (activeCount >= schicht.anzahl_benoetigt) {
    return { success: true, notified: false }
  }

  // Get next person on waitlist
  const { data: nextWaiter } = await supabase
    .from('helfer_warteliste')
    .select(`
      id,
      profile_id,
      external_helper_id,
      confirmation_token,
      profile:profiles(id, email, display_name)
    `)
    .eq('schicht_id', schichtId)
    .eq('status', 'wartend')
    .order('position', { ascending: true })
    .limit(1)
    .single()

  if (!nextWaiter) {
    return { success: true, notified: false }
  }

  // Calculate deadline
  const deadline = calculateDeadline()

  // Update waitlist entry with notification status and deadline
  const { error: updateError } = await supabase
    .from('helfer_warteliste')
    .update({
      status: 'benachrichtigt' as WartelisteStatus,
      benachrichtigt_am: new Date().toISOString(),
      antwort_deadline: deadline.toISOString(),
    } as never)
    .eq('id', nextWaiter.id)

  if (updateError) {
    console.error('Error updating waitlist entry:', updateError)
    return { success: false, error: 'Fehler beim Aktualisieren der Warteliste' }
  }

  // Send notification email
  try {
    await sendWaitlistAssignedEmail(nextWaiter.id, deadline)
  } catch (err) {
    console.error('Error sending waitlist notification:', err)
    // Don't fail the whole operation if email fails
  }

  revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)

  return { success: true, notified: true }
}

/**
 * Confirm waitlist assignment (accept the slot)
 */
export async function confirmWaitlistByToken(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Find the waitlist entry by token
  const { data: entry, error: fetchError } = await supabase
    .from('helfer_warteliste')
    .select(`
      id,
      schicht_id,
      profile_id,
      status,
      antwort_deadline,
      profile:profiles(email)
    `)
    .eq('confirmation_token', token)
    .single()

  if (fetchError || !entry) {
    return { success: false, error: 'Link ungültig oder abgelaufen' }
  }

  if (entry.status !== 'benachrichtigt') {
    if (entry.status === 'zugewiesen') {
      return { success: false, error: 'Du bist bereits für diese Schicht angemeldet' }
    }
    if (entry.status === 'abgelehnt') {
      return { success: false, error: 'Du hast diesen Platz bereits abgelehnt' }
    }
    return { success: false, error: 'Dieser Link ist nicht mehr gültig' }
  }

  // Check if deadline has passed
  if (entry.antwort_deadline && new Date(entry.antwort_deadline) < new Date()) {
    return { success: false, error: 'Die Bestätigungsfrist ist abgelaufen' }
  }

  // Get person_id from profile
  let personId: string | null = null
  if (entry.profile_id) {
    const profileData = entry.profile as unknown as { email: string } | null
    if (profileData?.email) {
      const { data: person } = await supabase
        .from('personen')
        .select('id')
        .eq('email', profileData.email)
        .single()
      personId = person?.id || null
    }
  }

  if (!personId) {
    return { success: false, error: 'Keine Person gefunden' }
  }

  // Create zuweisung
  const { error: insertError } = await supabase
    .from('auffuehrung_zuweisungen')
    .insert({
      schicht_id: entry.schicht_id,
      person_id: personId,
      status: 'zugesagt',
    } as never)

  if (insertError) {
    console.error('Error creating zuweisung from waitlist:', insertError)
    if (insertError.code === '23505') {
      return { success: false, error: 'Du bist bereits für diese Schicht angemeldet' }
    }
    return { success: false, error: 'Fehler beim Zuweisen' }
  }

  // Update waitlist entry
  await supabase
    .from('helfer_warteliste')
    .update({
      status: 'zugewiesen' as WartelisteStatus,
    } as never)
    .eq('id', entry.id)

  // Get veranstaltung_id for revalidation
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', entry.schicht_id)
    .single()

  if (schicht) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)
  }

  return { success: true }
}

/**
 * Reject waitlist assignment (decline the slot)
 */
export async function rejectWaitlistByToken(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Find the waitlist entry by token
  const { data: entry, error: fetchError } = await supabase
    .from('helfer_warteliste')
    .select('id, schicht_id, status')
    .eq('confirmation_token', token)
    .single()

  if (fetchError || !entry) {
    return { success: false, error: 'Link ungültig oder abgelaufen' }
  }

  if (entry.status !== 'benachrichtigt') {
    if (entry.status === 'abgelehnt') {
      return { success: false, error: 'Du hast diesen Platz bereits abgelehnt' }
    }
    return { success: false, error: 'Dieser Link ist nicht mehr gültig' }
  }

  // Update waitlist entry to rejected
  await supabase
    .from('helfer_warteliste')
    .update({
      status: 'abgelehnt' as WartelisteStatus,
    } as never)
    .eq('id', entry.id)

  // Process waitlist to notify next person
  await processWaitlistWithNotification(entry.schicht_id)

  // Get veranstaltung_id for revalidation
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', entry.schicht_id)
    .single()

  if (schicht) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)
  }

  return { success: true }
}

/**
 * Process expired waitlist notifications (timeout after 24h)
 * Called by cron job
 */
export async function processExpiredWaitlistNotifications(): Promise<{
  processed: number
  notified: number
  errors: string[]
}> {
  const result = { processed: 0, notified: 0, errors: [] as string[] }

  // Use admin client for accessing views
  const adminClient = createAdminClient()

  // Get expired notifications from view
  const { data: expired, error } = await adminClient
    .from('expired_waitlist_notifications')
    .select('id, schicht_id, profile_id, external_helper_id, confirmation_token, antwort_deadline, benachrichtigt_am, rolle, veranstaltung_id, veranstaltung_titel, email, name')

  if (error) {
    console.error('[Waitlist] Error fetching expired notifications:', error)
    result.errors.push(`Database error: ${error.message}`)
    return result
  }

  if (!expired || expired.length === 0) {
    return result
  }

  const supabase = await createClient()

  for (const entry of expired) {
    try {
      // Mark as rejected (timed out)
      await supabase
        .from('helfer_warteliste')
        .update({
          status: 'abgelehnt' as WartelisteStatus,
        } as never)
        .eq('id', entry.id)

      result.processed++

      // Send timeout notification email
      if (entry.email) {
        // Get veranstaltung for public link
        const { data: veranstaltung } = await supabase
          .from('veranstaltungen')
          .select('public_helfer_token')
          .eq('id', entry.veranstaltung_id)
          .single()

        await sendTemplatedEmail('waitlist_timeout', entry.email, {
          vorname: entry.name?.split(' ')[0] || 'Helfer',
          nachname: entry.name?.split(' ').slice(1).join(' ') || '',
          veranstaltung: entry.veranstaltung_titel,
          rolle: entry.rolle,
          public_link: buildPublicLink(veranstaltung?.public_helfer_token || null),
        })
      }

      // Notify next person on waitlist
      const notifyResult = await processWaitlistWithNotification(entry.schicht_id)
      if (notifyResult.notified) {
        result.notified++
      }
    } catch (err) {
      result.errors.push(`Error processing ${entry.id}: ${err}`)
    }
  }

  console.warn(`[Waitlist] Processed ${result.processed} expired, notified ${result.notified} next`)
  return result
}
