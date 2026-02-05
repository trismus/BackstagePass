'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { getUserProfile } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type {
  WartelisteEintragMitDetails,
  WartelisteStatus,
} from '../supabase/types'

// =============================================================================
// Warteliste Actions
// =============================================================================

/**
 * Add the current user to the waitlist for a shift
 */
export async function addToWaitlist(
  schichtId: string
): Promise<{ success: boolean; error?: string; position?: number }> {
  await requirePermission('helferliste:register')

  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Check if already on waitlist
  const { data: existing } = await supabase
    .from('helfer_warteliste')
    .select('id')
    .eq('schicht_id', schichtId)
    .eq('profile_id', profile.id)
    .single()

  if (existing) {
    return { success: false, error: 'Du bist bereits auf der Warteliste' }
  }

  // Check if already registered for this schicht
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (person) {
    const { data: zuweisung } = await supabase
      .from('auffuehrung_zuweisungen')
      .select('id')
      .eq('schicht_id', schichtId)
      .eq('person_id', person.id)
      .neq('status', 'abgesagt')
      .single()

    if (zuweisung) {
      return { success: false, error: 'Du bist bereits fuer diese Schicht angemeldet' }
    }
  }

  // Get next position
  const { data: maxPosition } = await supabase
    .rpc('get_next_waitlist_position', { p_schicht_id: schichtId })

  const position = maxPosition || 1

  // Add to waitlist
  const { error: insertError } = await supabase
    .from('helfer_warteliste')
    .insert({
      schicht_id: schichtId,
      profile_id: profile.id,
      position,
      status: 'wartend',
    } as never)

  if (insertError) {
    console.error('Error adding to waitlist:', insertError)
    if (insertError.code === '23505') {
      return { success: false, error: 'Du bist bereits auf der Warteliste' }
    }
    return { success: false, error: 'Fehler beim Hinzufuegen zur Warteliste' }
  }

  // Get veranstaltung_id for revalidation
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', schichtId)
    .single()

  if (schicht) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)
  }

  return { success: true, position }
}

/**
 * Remove the current user from the waitlist
 */
export async function removeFromWaitlist(
  schichtId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Get the waitlist entry
  const { data: entry } = await supabase
    .from('helfer_warteliste')
    .select('id')
    .eq('schicht_id', schichtId)
    .eq('profile_id', profile.id)
    .single()

  if (!entry) {
    return { success: false, error: 'Du bist nicht auf der Warteliste' }
  }

  // Delete the entry
  const { error: deleteError } = await supabase
    .from('helfer_warteliste')
    .delete()
    .eq('id', entry.id)

  if (deleteError) {
    console.error('Error removing from waitlist:', deleteError)
    return { success: false, error: 'Fehler beim Entfernen von der Warteliste' }
  }

  // Get veranstaltung_id for revalidation
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', schichtId)
    .single()

  if (schicht) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)
  }

  return { success: true }
}

/**
 * Process the waitlist for a shift (called when someone unregisters)
 * Note: This is also handled by the database trigger, but can be called manually
 */
export async function processWaitlist(
  schichtId: string
): Promise<{ success: boolean; error?: string; assigned?: boolean }> {
  await requirePermission('helferliste:write')

  const supabase = await createClient()

  // Get schicht info
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      veranstaltung_id,
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
    return { success: true, assigned: false }
  }

  // Get next person on waitlist
  const { data: nextWaiter } = await supabase
    .from('helfer_warteliste')
    .select(`
      id,
      profile_id,
      external_helper_id,
      profile:profiles(id, email)
    `)
    .eq('schicht_id', schichtId)
    .eq('status', 'wartend')
    .order('position', { ascending: true })
    .limit(1)
    .single()

  if (!nextWaiter) {
    return { success: true, assigned: false }
  }

  // Find person_id from profile
  let personId: string | null = null

  if (nextWaiter.profile) {
    const profileData = nextWaiter.profile as unknown as { id: string; email: string }
    const { data: person } = await supabase
      .from('personen')
      .select('id')
      .eq('email', profileData.email)
      .single()

    if (person) {
      personId = person.id
    }
  }

  if (!personId) {
    // Mark as benachrichtigt but can't auto-assign
    await supabase
      .from('helfer_warteliste')
      .update({
        status: 'benachrichtigt' as WartelisteStatus,
        benachrichtigt_am: new Date().toISOString(),
      } as never)
      .eq('id', nextWaiter.id)

    return { success: true, assigned: false }
  }

  // Create zuweisung
  const { error: insertError } = await supabase
    .from('auffuehrung_zuweisungen')
    .insert({
      schicht_id: schichtId,
      person_id: personId,
      status: 'zugesagt',
    } as never)

  if (insertError) {
    console.error('Error creating zuweisung from waitlist:', insertError)
    return { success: false, error: 'Fehler beim Zuweisen' }
  }

  // Update waitlist entry
  await supabase
    .from('helfer_warteliste')
    .update({
      status: 'zugewiesen' as WartelisteStatus,
      benachrichtigt_am: new Date().toISOString(),
    } as never)
    .eq('id', nextWaiter.id)

  revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)
  revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}`)

  return { success: true, assigned: true }
}

/**
 * Get waitlist entries for a shift (admin/management)
 */
export async function getWaitlistForSchicht(
  schichtId: string
): Promise<WartelisteEintragMitDetails[]> {
  await requirePermission('helferliste:read')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('helfer_warteliste')
    .select(`
      *,
      profile:profiles(id, display_name, email),
      external_helper:externe_helfer_profile(id, vorname, nachname, email),
      schicht:auffuehrung_schichten(id, rolle, veranstaltung_id)
    `)
    .eq('schicht_id', schichtId)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching waitlist:', error)
    return []
  }

  return (data || []) as unknown as WartelisteEintragMitDetails[]
}

/**
 * Get waitlist position for current user
 */
export async function getMyWaitlistPosition(
  schichtId: string
): Promise<{ isOnWaitlist: boolean; position?: number; status?: WartelisteStatus }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { isOnWaitlist: false }
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('helfer_warteliste')
    .select('position, status')
    .eq('schicht_id', schichtId)
    .eq('profile_id', profile.id)
    .single()

  if (!data) {
    return { isOnWaitlist: false }
  }

  return {
    isOnWaitlist: true,
    position: data.position,
    status: data.status as WartelisteStatus,
  }
}

/**
 * Update waitlist entry position (admin only - for manual reordering)
 */
export async function updateWaitlistPosition(
  entryId: string,
  newPosition: number
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  // Get current entry
  const { data: entry } = await supabase
    .from('helfer_warteliste')
    .select('schicht_id, position')
    .eq('id', entryId)
    .single()

  if (!entry) {
    return { success: false, error: 'Eintrag nicht gefunden' }
  }

  // Update position
  const { error: updateError } = await supabase
    .from('helfer_warteliste')
    .update({ position: newPosition } as never)
    .eq('id', entryId)

  if (updateError) {
    console.error('Error updating waitlist position:', updateError)
    return { success: false, error: 'Fehler beim Aktualisieren' }
  }

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
 * Manually assign someone from waitlist to a slot (admin only)
 */
export async function assignFromWaitlist(
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  // Get waitlist entry with profile
  const { data: entry } = await supabase
    .from('helfer_warteliste')
    .select(`
      id,
      schicht_id,
      profile_id,
      profile:profiles(email)
    `)
    .eq('id', entryId)
    .single()

  if (!entry) {
    return { success: false, error: 'Eintrag nicht gefunden' }
  }

  if (!entry.profile_id) {
    return { success: false, error: 'Keine Person verknuepft' }
  }

  // Find person_id
  const profileData = entry.profile as unknown as { email: string } | null
  if (!profileData) {
    return { success: false, error: 'Profil nicht gefunden' }
  }

  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profileData.email)
    .single()

  if (!person) {
    return { success: false, error: 'Person nicht gefunden' }
  }

  // Check if already assigned
  const { data: existing } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id')
    .eq('schicht_id', entry.schicht_id)
    .eq('person_id', person.id)
    .single()

  if (existing) {
    return { success: false, error: 'Person ist bereits zugewiesen' }
  }

  // Create zuweisung
  const { error: insertError } = await supabase
    .from('auffuehrung_zuweisungen')
    .insert({
      schicht_id: entry.schicht_id,
      person_id: person.id,
      status: 'zugesagt',
    } as never)

  if (insertError) {
    console.error('Error assigning from waitlist:', insertError)
    return { success: false, error: 'Fehler beim Zuweisen' }
  }

  // Update waitlist entry
  await supabase
    .from('helfer_warteliste')
    .update({
      status: 'zugewiesen' as WartelisteStatus,
      benachrichtigt_am: new Date().toISOString(),
    } as never)
    .eq('id', entryId)

  // Get veranstaltung_id for revalidation
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', entry.schicht_id)
    .single()

  if (schicht) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}`)
  }

  return { success: true }
}

/**
 * Remove someone from waitlist (admin only)
 */
export async function removeFromWaitlistAdmin(
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  // Get the entry for revalidation path
  const { data: entry } = await supabase
    .from('helfer_warteliste')
    .select('schicht_id')
    .eq('id', entryId)
    .single()

  if (!entry) {
    return { success: false, error: 'Eintrag nicht gefunden' }
  }

  const { error: deleteError } = await supabase
    .from('helfer_warteliste')
    .delete()
    .eq('id', entryId)

  if (deleteError) {
    console.error('Error removing from waitlist:', deleteError)
    return { success: false, error: 'Fehler beim Entfernen' }
  }

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
