'use server'

import { createClient } from '../supabase/server'
import { getUserProfile } from '../supabase/server'

// =============================================================================
// Types
// =============================================================================

export type SlotAvailabilityResult = {
  available: boolean
  reason?: string
  current: number
  required: number
}

export type TimeConflictResult = {
  hasConflict: boolean
  conflictingSlots: {
    schichtId: string
    rolle: string
    startzeit: string
    endzeit: string
  }[]
}

export type BookingLimitResult = {
  canBook: boolean
  current: number
  max: number | null
  limitActive: boolean
}

export type DeadlineCheckResult = {
  canRegister: boolean
  deadline: string | null
  reason?: string
}

export type FullValidationResult = {
  canRegister: boolean
  slotAvailability: SlotAvailabilityResult
  timeConflicts: TimeConflictResult
  bookingLimit: BookingLimitResult
  deadlineCheck: DeadlineCheckResult
  errors: string[]
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Check if a slot is still available
 */
export async function checkSlotAvailability(
  schichtId: string
): Promise<SlotAvailabilityResult> {
  const supabase = await createClient()

  const { data: schicht, error } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      anzahl_benoetigt,
      zuweisungen:auffuehrung_zuweisungen(id, status)
    `)
    .eq('id', schichtId)
    .single()

  if (error || !schicht) {
    return {
      available: false,
      reason: 'Schicht nicht gefunden',
      current: 0,
      required: 0,
    }
  }

  const activeCount = (schicht.zuweisungen || []).filter(
    (z: { status: string }) => z.status !== 'abgesagt'
  ).length

  const available = activeCount < schicht.anzahl_benoetigt

  return {
    available,
    reason: available ? undefined : 'Alle Plaetze sind bereits belegt',
    current: activeCount,
    required: schicht.anzahl_benoetigt,
  }
}

/**
 * Check for time conflicts with the user's existing registrations
 */
export async function checkTimeConflict(
  profileId: string,
  veranstaltungId: string,
  zeitblockId: string | null
): Promise<TimeConflictResult> {
  if (!zeitblockId) {
    return { hasConflict: false, conflictingSlots: [] }
  }

  const supabase = await createClient()

  // Find person ID from profile email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', profileId)
    .single()

  if (!profile) {
    return { hasConflict: false, conflictingSlots: [] }
  }

  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return { hasConflict: false, conflictingSlots: [] }
  }

  // Get the target zeitblock
  const { data: targetZeitblock } = await supabase
    .from('zeitbloecke')
    .select('startzeit, endzeit')
    .eq('id', zeitblockId)
    .single()

  if (!targetZeitblock) {
    return { hasConflict: false, conflictingSlots: [] }
  }

  // Get all schichten for this veranstaltung that the user is registered for
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      zeitblock:zeitbloecke(id, startzeit, endzeit)
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .neq('zeitblock_id', zeitblockId)

  if (!schichten || schichten.length === 0) {
    return { hasConflict: false, conflictingSlots: [] }
  }

  const conflictingSlots: TimeConflictResult['conflictingSlots'] = []

  for (const schicht of schichten) {
    // Check if user is registered for this schicht
    const { data: zuweisung } = await supabase
      .from('auffuehrung_zuweisungen')
      .select('id')
      .eq('schicht_id', schicht.id)
      .eq('person_id', person.id)
      .neq('status', 'abgesagt')
      .single()

    if (zuweisung && schicht.zeitblock) {
      const zb = schicht.zeitblock as unknown as {
        id: string
        startzeit: string
        endzeit: string
      }

      // Check time overlap
      if (
        targetZeitblock.startzeit < zb.endzeit &&
        targetZeitblock.endzeit > zb.startzeit
      ) {
        conflictingSlots.push({
          schichtId: schicht.id,
          rolle: schicht.rolle,
          startzeit: zb.startzeit,
          endzeit: zb.endzeit,
        })
      }
    }
  }

  return {
    hasConflict: conflictingSlots.length > 0,
    conflictingSlots,
  }
}

/**
 * Check if user has reached the booking limit for this veranstaltung
 */
export async function checkBookingLimit(
  profileId: string,
  veranstaltungId: string
): Promise<BookingLimitResult> {
  const supabase = await createClient()

  // Get veranstaltung with limit settings
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('max_schichten_pro_helfer, helfer_buchung_limit_aktiv')
    .eq('id', veranstaltungId)
    .single()

  if (!veranstaltung) {
    return { canBook: true, current: 0, max: null, limitActive: false }
  }

  // If limit is not active, allow booking
  if (!veranstaltung.helfer_buchung_limit_aktiv) {
    return {
      canBook: true,
      current: 0,
      max: veranstaltung.max_schichten_pro_helfer,
      limitActive: false,
    }
  }

  // Find person ID from profile email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', profileId)
    .single()

  if (!profile) {
    return {
      canBook: true,
      current: 0,
      max: veranstaltung.max_schichten_pro_helfer,
      limitActive: true,
    }
  }

  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return {
      canBook: true,
      current: 0,
      max: veranstaltung.max_schichten_pro_helfer,
      limitActive: true,
    }
  }

  // Count current bookings
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select('id')
    .eq('veranstaltung_id', veranstaltungId)

  if (!schichten || schichten.length === 0) {
    return {
      canBook: true,
      current: 0,
      max: veranstaltung.max_schichten_pro_helfer,
      limitActive: true,
    }
  }

  const schichtIds = schichten.map((s) => s.id)

  const { count: currentBookings } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id', { count: 'exact', head: true })
    .eq('person_id', person.id)
    .neq('status', 'abgesagt')
    .in('schicht_id', schichtIds)

  const current = currentBookings || 0
  const max = veranstaltung.max_schichten_pro_helfer || 3

  return {
    canBook: current < max,
    current,
    max,
    limitActive: true,
  }
}

/**
 * Check if registration deadline has passed
 */
export async function checkDeadline(
  veranstaltungId: string
): Promise<DeadlineCheckResult> {
  const supabase = await createClient()

  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('helfer_buchung_deadline')
    .eq('id', veranstaltungId)
    .single()

  if (!veranstaltung || !veranstaltung.helfer_buchung_deadline) {
    return { canRegister: true, deadline: null }
  }

  const deadline = new Date(veranstaltung.helfer_buchung_deadline)
  const now = new Date()

  if (now > deadline) {
    return {
      canRegister: false,
      deadline: veranstaltung.helfer_buchung_deadline,
      reason: `Anmeldungen waren nur bis ${deadline.toLocaleDateString('de-CH')} moeglich`,
    }
  }

  return {
    canRegister: true,
    deadline: veranstaltung.helfer_buchung_deadline,
  }
}

/**
 * Run all validations for a registration attempt
 */
export async function validateRegistration(
  schichtId: string
): Promise<FullValidationResult> {
  const profile = await getUserProfile()

  if (!profile) {
    return {
      canRegister: false,
      slotAvailability: { available: false, reason: 'Nicht eingeloggt', current: 0, required: 0 },
      timeConflicts: { hasConflict: false, conflictingSlots: [] },
      bookingLimit: { canBook: false, current: 0, max: null, limitActive: false },
      deadlineCheck: { canRegister: false, deadline: null, reason: 'Nicht eingeloggt' },
      errors: ['Nicht eingeloggt'],
    }
  }

  const supabase = await createClient()

  // Get schicht details
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id, zeitblock_id')
    .eq('id', schichtId)
    .single()

  if (!schicht) {
    return {
      canRegister: false,
      slotAvailability: { available: false, reason: 'Schicht nicht gefunden', current: 0, required: 0 },
      timeConflicts: { hasConflict: false, conflictingSlots: [] },
      bookingLimit: { canBook: false, current: 0, max: null, limitActive: false },
      deadlineCheck: { canRegister: false, deadline: null },
      errors: ['Schicht nicht gefunden'],
    }
  }

  // Run all checks in parallel
  const [slotAvailability, timeConflicts, bookingLimit, deadlineCheck] =
    await Promise.all([
      checkSlotAvailability(schichtId),
      checkTimeConflict(profile.id, schicht.veranstaltung_id, schicht.zeitblock_id),
      checkBookingLimit(profile.id, schicht.veranstaltung_id),
      checkDeadline(schicht.veranstaltung_id),
    ])

  const errors: string[] = []

  if (!slotAvailability.available) {
    errors.push(slotAvailability.reason || 'Platz nicht verfuegbar')
  }

  if (timeConflicts.hasConflict) {
    const conflicts = timeConflicts.conflictingSlots
      .map((c) => `${c.rolle} (${c.startzeit.slice(0, 5)} - ${c.endzeit.slice(0, 5)})`)
      .join(', ')
    errors.push(`Zeitkonflikt mit: ${conflicts}`)
  }

  if (!bookingLimit.canBook && bookingLimit.limitActive) {
    errors.push(`Buchungslimit erreicht: ${bookingLimit.current}/${bookingLimit.max} Schichten`)
  }

  if (!deadlineCheck.canRegister) {
    errors.push(deadlineCheck.reason || 'Anmeldeschluss ueberschritten')
  }

  const canRegister =
    slotAvailability.available &&
    !timeConflicts.hasConflict &&
    (bookingLimit.canBook || !bookingLimit.limitActive) &&
    deadlineCheck.canRegister

  return {
    canRegister,
    slotAvailability,
    timeConflicts,
    bookingLimit,
    deadlineCheck,
    errors,
  }
}

/**
 * Get booking status info for display in UI
 */
export async function getBookingStatusForUser(
  veranstaltungId: string
): Promise<{
  currentBookings: number
  maxBookings: number | null
  limitActive: boolean
  deadline: string | null
  deadlinePassed: boolean
}> {
  const profile = await getUserProfile()

  if (!profile) {
    return {
      currentBookings: 0,
      maxBookings: null,
      limitActive: false,
      deadline: null,
      deadlinePassed: false,
    }
  }

  const [bookingLimit, deadlineCheck] = await Promise.all([
    checkBookingLimit(profile.id, veranstaltungId),
    checkDeadline(veranstaltungId),
  ])

  return {
    currentBookings: bookingLimit.current,
    maxBookings: bookingLimit.max,
    limitActive: bookingLimit.limitActive,
    deadline: deadlineCheck.deadline,
    deadlinePassed: !deadlineCheck.canRegister,
  }
}
