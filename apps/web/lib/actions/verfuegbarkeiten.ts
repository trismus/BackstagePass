'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission, getCurrentPersonId } from '@/lib/supabase/auth-helpers'
import type {
  Verfuegbarkeit,
  VerfuegbarkeitInsert,
  VerfuegbarkeitUpdate,
  VerfuegbarkeitMitMitglied,
  VerfuegbarkeitStatus,
} from '@/lib/supabase/types'

// =============================================================================
// Verfügbarkeiten CRUD
// =============================================================================

/**
 * Get all verfuegbarkeiten for a specific member
 */
export async function getVerfuegbarkeitenForMitglied(
  mitgliedId: string
): Promise<Verfuegbarkeit[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('verfuegbarkeiten')
    .select('id, mitglied_id, datum_von, datum_bis, zeitfenster_von, zeitfenster_bis, status, wiederholung, grund, notiz, created_at, updated_at')
    .eq('mitglied_id', mitgliedId)
    .order('datum_von', { ascending: true })

  if (error) {
    console.error('Error fetching verfuegbarkeiten:', error)
    return []
  }

  return data || []
}

/**
 * Get all verfuegbarkeiten for a date range (for planning views)
 * Only available for management
 */
export async function getVerfuegbarkeitenInRange(
  datumVon: string,
  datumBis: string
): Promise<VerfuegbarkeitMitMitglied[]> {
  await requirePermission('mitglieder:read')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('verfuegbarkeiten')
    .select(
      `
      *,
      mitglied:personen(id, vorname, nachname, email)
    `
    )
    .lte('datum_von', datumBis)
    .gte('datum_bis', datumVon)
    .order('datum_von', { ascending: true })

  if (error) {
    console.error('Error fetching verfuegbarkeiten in range:', error)
    return []
  }

  // Transform nested array to single object
  return (data || []).map((item) => ({
    ...item,
    mitglied: Array.isArray(item.mitglied) ? item.mitglied[0] : item.mitglied,
  })) as VerfuegbarkeitMitMitglied[]
}

/**
 * Get my own verfuegbarkeiten (for the current user)
 */
export async function getMeineVerfuegbarkeiten(): Promise<Verfuegbarkeit[]> {
  const personId = await getCurrentPersonId()
  if (!personId) {
    return []
  }

  return getVerfuegbarkeitenForMitglied(personId)
}

/**
 * Get my upcoming verfuegbarkeiten (from today onwards)
 */
export async function getMeineKommendeVerfuegbarkeiten(): Promise<
  Verfuegbarkeit[]
> {
  const personId = await getCurrentPersonId()
  if (!personId) {
    return []
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('verfuegbarkeiten')
    .select('id, mitglied_id, datum_von, datum_bis, zeitfenster_von, zeitfenster_bis, status, wiederholung, grund, notiz, created_at, updated_at')
    .eq('mitglied_id', personId)
    .gte('datum_bis', today)
    .order('datum_von', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming verfuegbarkeiten:', error)
    return []
  }

  return data || []
}

/**
 * Get a single verfuegbarkeit by ID
 */
export async function getVerfuegbarkeitById(
  id: string
): Promise<Verfuegbarkeit | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('verfuegbarkeiten')
    .select('id, mitglied_id, datum_von, datum_bis, zeitfenster_von, zeitfenster_bis, status, wiederholung, grund, notiz, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching verfuegbarkeit:', error)
    return null
  }

  return data
}

/**
 * Create a new verfuegbarkeit entry
 */
export async function createVerfuegbarkeit(
  data: VerfuegbarkeitInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()

  // Validate date range
  if (data.datum_von > data.datum_bis) {
    return { success: false, error: 'Startdatum muss vor Enddatum liegen' }
  }

  // Validate time range if both are set
  if (
    data.zeitfenster_von &&
    data.zeitfenster_bis &&
    data.zeitfenster_von >= data.zeitfenster_bis
  ) {
    return { success: false, error: 'Startzeit muss vor Endzeit liegen' }
  }

  const { data: newEntry, error } = await supabase
    .from('verfuegbarkeiten')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating verfuegbarkeit:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mein-bereich/verfuegbarkeit')
  revalidatePath('/mitglieder')
  return { success: true, id: newEntry.id }
}

/**
 * Update an existing verfuegbarkeit entry
 */
export async function updateVerfuegbarkeit(
  id: string,
  data: VerfuegbarkeitUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // If updating dates, validate range
  if (data.datum_von && data.datum_bis && data.datum_von > data.datum_bis) {
    return { success: false, error: 'Startdatum muss vor Enddatum liegen' }
  }

  // If updating times, validate range
  if (
    data.zeitfenster_von &&
    data.zeitfenster_bis &&
    data.zeitfenster_von >= data.zeitfenster_bis
  ) {
    return { success: false, error: 'Startzeit muss vor Endzeit liegen' }
  }

  const { error } = await supabase
    .from('verfuegbarkeiten')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating verfuegbarkeit:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mein-bereich/verfuegbarkeit')
  revalidatePath('/mitglieder')
  return { success: true }
}

/**
 * Delete a verfuegbarkeit entry
 */
export async function deleteVerfuegbarkeit(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('verfuegbarkeiten')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting verfuegbarkeit:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mein-bereich/verfuegbarkeit')
  revalidatePath('/mitglieder')
  return { success: true }
}

// =============================================================================
// Helper Functions for Availability Checking
// =============================================================================

/**
 * Check if a member is available on a specific date
 * Returns the most restrictive status found
 */
export async function checkMemberAvailability(
  mitgliedId: string,
  datum: string,
  zeitVon?: string,
  zeitBis?: string
): Promise<VerfuegbarkeitStatus> {
  const supabase = await createClient()

  // Build query
  const { data, error } = await supabase
    .from('verfuegbarkeiten')
    .select('status, zeitfenster_von, zeitfenster_bis')
    .eq('mitglied_id', mitgliedId)
    .lte('datum_von', datum)
    .gte('datum_bis', datum)

  if (error) {
    console.error('Error checking availability:', error)
    return 'verfuegbar' // Default to available if error
  }

  if (!data || data.length === 0) {
    return 'verfuegbar' // No entries means available
  }

  // Filter by time overlap if times are specified
  const relevantEntries = data.filter((entry) => {
    // If no time window on entry, it applies to whole day
    if (!entry.zeitfenster_von || !entry.zeitfenster_bis) {
      return true
    }
    // If no time specified in query, any entry applies
    if (!zeitVon || !zeitBis) {
      return true
    }
    // Check time overlap
    return zeitVon < entry.zeitfenster_bis && zeitBis > entry.zeitfenster_von
  })

  if (relevantEntries.length === 0) {
    return 'verfuegbar'
  }

  // Return most restrictive status
  if (relevantEntries.some((e) => e.status === 'nicht_verfuegbar')) {
    return 'nicht_verfuegbar'
  }
  if (relevantEntries.some((e) => e.status === 'eingeschraenkt')) {
    return 'eingeschraenkt'
  }
  return 'verfuegbar'
}

/**
 * Get availability status for multiple members on a date
 * Useful for planning views
 */
export async function checkMultipleMembersAvailability(
  mitgliedIds: string[],
  datum: string,
  zeitVon?: string,
  zeitBis?: string
): Promise<Map<string, VerfuegbarkeitStatus>> {
  const result = new Map<string, VerfuegbarkeitStatus>()

  // Initialize all as available
  for (const id of mitgliedIds) {
    result.set(id, 'verfuegbar')
  }

  if (mitgliedIds.length === 0) {
    return result
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('verfuegbarkeiten')
    .select('mitglied_id, status, zeitfenster_von, zeitfenster_bis')
    .in('mitglied_id', mitgliedIds)
    .lte('datum_von', datum)
    .gte('datum_bis', datum)

  if (error) {
    console.error('Error checking multiple availabilities:', error)
    return result
  }

  if (!data) {
    return result
  }

  // Process each entry
  for (const entry of data) {
    // Check time overlap
    const applies =
      !entry.zeitfenster_von ||
      !entry.zeitfenster_bis ||
      !zeitVon ||
      !zeitBis ||
      (zeitVon < entry.zeitfenster_bis && zeitBis > entry.zeitfenster_von)

    if (!applies) continue

    const currentStatus = result.get(entry.mitglied_id) || 'verfuegbar'

    // Update to more restrictive status
    if (entry.status === 'nicht_verfuegbar') {
      result.set(entry.mitglied_id, 'nicht_verfuegbar')
    } else if (
      entry.status === 'eingeschraenkt' &&
      currentStatus !== 'nicht_verfuegbar'
    ) {
      result.set(entry.mitglied_id, 'eingeschraenkt')
    }
  }

  return result
}

/**
 * Get all unavailable members for a date range (for conflict checking)
 */
export async function getUnavailableMembersForRange(
  datumVon: string,
  datumBis: string
): Promise<
  { mitglied_id: string; vorname: string; nachname: string; grund: string | null }[]
> {
  await requirePermission('mitglieder:read')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('verfuegbarkeiten')
    .select(
      `
      mitglied_id,
      grund,
      mitglied:personen(vorname, nachname)
    `
    )
    .eq('status', 'nicht_verfuegbar')
    .lte('datum_von', datumBis)
    .gte('datum_bis', datumVon)

  if (error) {
    console.error('Error fetching unavailable members:', error)
    return []
  }

  return (data || []).map((item) => {
    const mitglied = Array.isArray(item.mitglied)
      ? item.mitglied[0]
      : item.mitglied
    return {
      mitglied_id: item.mitglied_id,
      vorname: mitglied?.vorname || '',
      nachname: mitglied?.nachname || '',
      grund: item.grund,
    }
  })
}
