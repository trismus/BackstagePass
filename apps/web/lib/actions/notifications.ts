'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { createAdminClient } from '../supabase/admin'
import type {
  Benachrichtigung,
  BenachrichtigungsEinstellungen,
  BenachrichtigungsEinstellungenUpdate,
  BenachrichtigungTyp,
} from '../supabase/types'

// =============================================================================
// Get User Notifications
// =============================================================================

/**
 * Get all notifications for the current user
 */
export async function getUserNotifications(
  options: {
    unreadOnly?: boolean
    limit?: number
  } = {}
): Promise<Benachrichtigung[]> {
  const profile = await getUserProfile()
  if (!profile) return []

  const supabase = await createClient()

  let query = supabase
    .from('benachrichtigungen')
    .select('id, profile_id, typ, titel, nachricht, referenz_typ, referenz_id, metadata, gelesen, gelesen_am, action_url, created_at')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })

  if (options.unreadOnly) {
    query = query.eq('gelesen', false)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return (data as Benachrichtigung[]) || []
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const profile = await getUserProfile()
  if (!profile) return 0

  const supabase = await createClient()

  const { count, error } = await supabase
    .from('benachrichtigungen')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .eq('gelesen', false)

  if (error) {
    console.error('Error counting notifications:', error)
    return 0
  }

  return count || 0
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('benachrichtigungen')
    .update({
      gelesen: true,
      gelesen_am: new Date().toISOString(),
    } as never)
    .eq('id', notificationId)
    .eq('profile_id', profile.id)

  if (error) {
    console.error('Error marking notification read:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mein-bereich')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<{
  success: boolean
  error?: string
  count?: number
}> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  const supabase = await createClient()

  const { error, count } = await supabase
    .from('benachrichtigungen')
    .update({
      gelesen: true,
      gelesen_am: new Date().toISOString(),
    } as never)
    .eq('profile_id', profile.id)
    .eq('gelesen', false)

  if (error) {
    console.error('Error marking all notifications read:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mein-bereich')
  revalidatePath('/dashboard')
  return { success: true, count: count || 0 }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('benachrichtigungen')
    .delete()
    .eq('id', notificationId)
    .eq('profile_id', profile.id)

  if (error) {
    console.error('Error deleting notification:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mein-bereich')
  revalidatePath('/dashboard')
  return { success: true }
}

// =============================================================================
// Notification Settings
// =============================================================================

/**
 * Get notification settings for the current user
 */
export async function getNotificationSettings(): Promise<BenachrichtigungsEinstellungen | null> {
  const profile = await getUserProfile()
  if (!profile) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('benachrichtigungs_einstellungen')
    .select('id, profile_id, email_48h_erinnerung, email_6h_erinnerung, email_24h_probe_erinnerung, email_wochenzusammenfassung, email_aenderungsbenachrichtigung, inapp_termin_erinnerung, inapp_aenderungen, inapp_neue_termine, eigene_erinnerungszeiten, ruhezeit_von, ruhezeit_bis, created_at, updated_at')
    .eq('profile_id', profile.id)
    .single()

  if (error) {
    // No settings yet, return defaults
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching notification settings:', error)
    return null
  }

  return data as BenachrichtigungsEinstellungen
}

/**
 * Save notification settings
 */
export async function saveNotificationSettings(
  settings: BenachrichtigungsEinstellungenUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  const supabase = await createClient()

  // Check if settings exist
  const existing = await getNotificationSettings()

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('benachrichtigungs_einstellungen')
      .update(settings as never)
      .eq('profile_id', profile.id)

    if (error) {
      console.error('Error updating notification settings:', error)
      return { success: false, error: error.message }
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from('benachrichtigungs_einstellungen')
      .insert({
        profile_id: profile.id,
        ...settings,
      } as never)

    if (error) {
      console.error('Error inserting notification settings:', error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/mein-bereich/einstellungen')
  return { success: true }
}

// =============================================================================
// Create Notifications (Admin/System)
// =============================================================================

/**
 * Create a notification for a specific user (admin/system use)
 */
export async function createNotification(
  profileId: string,
  typ: BenachrichtigungTyp,
  titel: string,
  nachricht: string,
  options: {
    referenzTyp?: string
    referenzId?: string
    actionUrl?: string
    metadata?: Record<string, unknown>
  } = {}
): Promise<{ success: boolean; error?: string; id?: string }> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('benachrichtigungen')
    .insert({
      profile_id: profileId,
      typ,
      titel,
      nachricht,
      referenz_typ: options.referenzTyp || null,
      referenz_id: options.referenzId || null,
      action_url: options.actionUrl || null,
      metadata: options.metadata || {},
      gelesen: false,
    } as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    return { success: false, error: error.message }
  }

  return { success: true, id: data?.id }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  profileIds: string[],
  typ: BenachrichtigungTyp,
  titel: string,
  nachricht: string,
  options: {
    referenzTyp?: string
    referenzId?: string
    actionUrl?: string
    metadata?: Record<string, unknown>
  } = {}
): Promise<{ success: boolean; error?: string; count?: number }> {
  if (profileIds.length === 0) {
    return { success: true, count: 0 }
  }

  const adminClient = createAdminClient()

  const notifications = profileIds.map((profileId) => ({
    profile_id: profileId,
    typ,
    titel,
    nachricht,
    referenz_typ: options.referenzTyp || null,
    referenz_id: options.referenzId || null,
    action_url: options.actionUrl || null,
    metadata: options.metadata || {},
    gelesen: false,
  }))

  const { error, count } = await adminClient
    .from('benachrichtigungen')
    .insert(notifications as never)

  if (error) {
    console.error('Error creating bulk notifications:', error)
    return { success: false, error: error.message }
  }

  return { success: true, count: count || profileIds.length }
}

// =============================================================================
// Probe-specific Notifications
// =============================================================================

/**
 * Notify participants when a new probe is created
 */
export async function notifyNewProbe(
  probeId: string,
  probeTitel: string,
  probeDatum: string
): Promise<{ success: boolean; count?: number }> {
  const supabase = await createClient()

  // Get all participants with their profile IDs
  const { data: teilnehmer } = await supabase
    .from('proben_teilnehmer')
    .select(`
      person:personen(email),
      probe:proben(stueck:stuecke(titel))
    `)
    .eq('probe_id', probeId)

  if (!teilnehmer || teilnehmer.length === 0) {
    return { success: true, count: 0 }
  }

  // Get profile IDs for participants
  const emails = teilnehmer
    .map((t) => (t.person as unknown as { email: string | null })?.email)
    .filter(Boolean) as string[]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .in('email', emails)

  if (!profiles || profiles.length === 0) {
    return { success: true, count: 0 }
  }

  const profileIds = profiles.map((p) => p.id)
  const stueckTitel = (teilnehmer[0]?.probe as unknown as { stueck?: { titel?: string } })?.stueck?.titel || ''

  const formattedDate = new Date(probeDatum).toLocaleDateString('de-CH', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return createBulkNotifications(
    profileIds,
    'neue_probe',
    `Neue Probe: ${probeTitel}`,
    `Du wurdest zur Probe "${probeTitel}" (${stueckTitel}) am ${formattedDate} eingeladen.`,
    {
      referenzTyp: 'probe',
      referenzId: probeId,
      actionUrl: `/proben/${probeId}`,
    }
  )
}

/**
 * Notify a participant that their response was confirmed
 */
export async function notifyResponseConfirmed(
  probeId: string,
  personId: string,
  status: 'zugesagt' | 'abgesagt' | 'vielleicht'
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  // Get person and probe info
  const { data: person } = await supabase
    .from('personen')
    .select('email')
    .eq('id', personId)
    .single()

  if (!person?.email) {
    return { success: true }
  }

  // Get profile ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', person.email)
    .single()

  if (!profile) {
    return { success: true }
  }

  const { data: probe } = await supabase
    .from('proben')
    .select('titel')
    .eq('id', probeId)
    .single()

  const statusText =
    status === 'zugesagt'
      ? 'zugesagt'
      : status === 'abgesagt'
        ? 'abgesagt'
        : 'als unsicher markiert'

  await createNotification(
    profile.id,
    'zusage_bestaetigt',
    `Rückmeldung erfasst`,
    `Deine Rückmeldung zur Probe "${probe?.titel || ''}" wurde als "${statusText}" erfasst.`,
    {
      referenzTyp: 'probe',
      referenzId: probeId,
      actionUrl: `/proben/${probeId}`,
    }
  )

  return { success: true }
}
