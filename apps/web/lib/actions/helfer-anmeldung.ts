'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { getUserProfile } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { validateRegistration } from './booking-validations'
import type {
  AuffuehrungSchicht,
  Zeitblock,
  AuffuehrungZuweisung,
  InfoBlock,
  Person,
} from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type SchichtMitDetails = AuffuehrungSchicht & {
  zeitblock: Pick<Zeitblock, 'id' | 'name' | 'startzeit' | 'endzeit' | 'typ'> | null
  zuweisungen: (AuffuehrungZuweisung & {
    person: Pick<Person, 'id' | 'vorname' | 'nachname'> | null
  })[]
}

export type ZeitblockMitSchichten = Zeitblock & {
  schichten: SchichtMitDetails[]
}

export type HelferlisteData = {
  veranstaltung: {
    id: string
    titel: string
    datum: string
    startzeit: string | null
    endzeit: string | null
    ort: string | null
    helfer_status: 'entwurf' | 'veroeffentlicht' | 'abgeschlossen' | null
    public_helfer_token: string | null
  }
  zeitbloecke: ZeitblockMitSchichten[]
  infoBloecke: InfoBlock[]
  eigeneAnmeldungen: string[]  // Array of schicht_ids where user is registered
}

// =============================================================================
// Data Fetching
// =============================================================================

/**
 * Get all data needed for the helferliste page
 */
export async function getHelferlisteData(
  veranstaltungId: string
): Promise<HelferlisteData | null> {
  const supabase = await createClient()

  // Get veranstaltung
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, startzeit, endzeit, ort, helfer_status, public_helfer_token')
    .eq('id', veranstaltungId)
    .eq('typ', 'auffuehrung')
    .single()

  if (veranstaltungError || !veranstaltung) {
    console.error('Error fetching veranstaltung:', veranstaltungError)
    return null
  }

  // Get zeitbloecke with schichten and zuweisungen
  const { data: zeitbloecke, error: zeitblockError } = await supabase
    .from('zeitbloecke')
    .select(`
      *,
      schichten:auffuehrung_schichten(
        *,
        zuweisungen:auffuehrung_zuweisungen(
          *,
          person:personen(id, vorname, nachname)
        )
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .order('sortierung', { ascending: true })

  if (zeitblockError) {
    console.error('Error fetching zeitbloecke:', zeitblockError)
    return null
  }

  // Also get schichten without zeitblock
  const { data: orphanSchichten, error: orphanError } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      *,
      zuweisungen:auffuehrung_zuweisungen(
        *,
        person:personen(id, vorname, nachname)
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .is('zeitblock_id', null)

  if (orphanError) {
    console.error('Error fetching orphan schichten:', orphanError)
  }

  // Get info_bloecke
  const { data: infoBloecke, error: infoError } = await supabase
    .from('info_bloecke')
    .select('*')
    .eq('veranstaltung_id', veranstaltungId)
    .order('sortierung', { ascending: true })

  if (infoError) {
    console.error('Error fetching info_bloecke:', infoError)
  }

  // Get current user's anmeldungen
  const profile = await getUserProfile()
  let eigeneAnmeldungen: string[] = []

  if (profile) {
    // Find the person record linked to this profile
    const { data: person } = await supabase
      .from('personen')
      .select('id')
      .eq('email', profile.email)
      .single()

    if (person) {
      // Get all schicht IDs where this person is registered
      const allSchichtIds = [
        ...(zeitbloecke?.flatMap((zb) => zb.schichten?.map((s: AuffuehrungSchicht) => s.id) || []) || []),
        ...(orphanSchichten?.map((s) => s.id) || []),
      ]

      if (allSchichtIds.length > 0) {
        const { data: zuweisungen } = await supabase
          .from('auffuehrung_zuweisungen')
          .select('schicht_id')
          .eq('person_id', person.id)
          .in('schicht_id', allSchichtIds)
          .neq('status', 'abgesagt')

        eigeneAnmeldungen = zuweisungen?.map((z) => z.schicht_id) || []
      }
    }
  }

  // Transform zeitbloecke to include proper zeitblock reference in schichten
  const transformedZeitbloecke = (zeitbloecke || []).map((zb) => ({
    ...zb,
    schichten: (zb.schichten || []).map((s: AuffuehrungSchicht & { zuweisungen: unknown[] }) => ({
      ...s,
      zeitblock: {
        id: zb.id,
        name: zb.name,
        startzeit: zb.startzeit,
        endzeit: zb.endzeit,
        typ: zb.typ,
      },
    })),
  })) as ZeitblockMitSchichten[]

  // Add a "virtual" zeitblock for orphan schichten
  if (orphanSchichten && orphanSchichten.length > 0) {
    transformedZeitbloecke.push({
      id: 'no-zeitblock',
      veranstaltung_id: veranstaltungId,
      name: 'Ohne Zeitblock',
      startzeit: veranstaltung.startzeit || '00:00',
      endzeit: veranstaltung.endzeit || '23:59',
      typ: 'standard',
      sortierung: 9999,
      created_at: new Date().toISOString(),
      schichten: orphanSchichten.map((s) => ({
        ...s,
        zeitblock: null,
      })) as SchichtMitDetails[],
    })
  }

  return {
    veranstaltung,
    zeitbloecke: transformedZeitbloecke,
    infoBloecke: (infoBloecke || []) as InfoBlock[],
    eigeneAnmeldungen,
  }
}

// =============================================================================
// Registration Actions
// =============================================================================

/**
 * Register the current user for a shift slot
 *
 * Performs full validation:
 * - Slot availability
 * - Time conflicts
 * - Booking limits
 * - Registration deadline
 */
export async function registerForSlot(
  schichtId: string,
  skipConflictCheck = false
): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
  // Check permission - only active members and helpers can register
  await requirePermission('helferliste:register')

  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Find the person record linked to this profile
  const { data: person, error: personError } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (personError || !person) {
    return { success: false, error: 'Kein Mitgliederprofil gefunden' }
  }

  // Run full validation
  const validation = await validateRegistration(schichtId)

  // Check if user is already registered (separate check for clearer error)
  const { data: existingZuweisung } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id')
    .eq('schicht_id', schichtId)
    .eq('person_id', person.id)
    .single()

  if (existingZuweisung) {
    return { success: false, error: 'Du bist bereits fuer diese Schicht angemeldet' }
  }

  // Check validation results
  if (!validation.slotAvailability.available) {
    return { success: false, error: validation.slotAvailability.reason || 'Platz nicht verfuegbar' }
  }

  if (!validation.deadlineCheck.canRegister) {
    return { success: false, error: validation.deadlineCheck.reason || 'Anmeldeschluss ueberschritten' }
  }

  if (validation.bookingLimit.limitActive && !validation.bookingLimit.canBook) {
    return {
      success: false,
      error: `Buchungslimit erreicht: Du hast bereits ${validation.bookingLimit.current} von ${validation.bookingLimit.max} Schichten gebucht`,
    }
  }

  // Time conflicts are warnings unless skipConflictCheck is false
  const warnings: string[] = []
  if (validation.timeConflicts.hasConflict && !skipConflictCheck) {
    const conflicts = validation.timeConflicts.conflictingSlots
      .map((c) => `"${c.rolle}" (${c.startzeit.slice(0, 5)} - ${c.endzeit.slice(0, 5)})`)
      .join(', ')
    return {
      success: false,
      error: `Zeitkonflikt mit: ${conflicts}`,
      warnings: [`Du bist bereits fuer ${conflicts} angemeldet`],
    }
  }

  // Get schicht for revalidation
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id, rolle')
    .eq('id', schichtId)
    .single()

  // Create zuweisung
  const { data: insertedZuweisung, error: insertError } = await supabase
    .from('auffuehrung_zuweisungen')
    .insert({
      schicht_id: schichtId,
      person_id: person.id,
      status: 'zugesagt',
    } as never)
    .select('id')
    .single()

  if (insertError) {
    console.error('Error creating zuweisung:', insertError)
    if (insertError.code === '23505') {
      return { success: false, error: 'Du bist bereits fuer diese Schicht angemeldet' }
    }
    return { success: false, error: 'Fehler bei der Anmeldung' }
  }

  // Send confirmation email (async, don't wait)
  if (insertedZuweisung?.id) {
    // Dynamic import to avoid circular dependencies
    import('./email-sender').then(({ sendBookingConfirmation }) => {
      sendBookingConfirmation(insertedZuweisung.id).catch((err) => {
        console.error('Error sending confirmation email:', err)
      })
    })
  }

  // Revalidate paths
  if (schicht) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}`)
  }
  revalidatePath('/mein-bereich')

  return { success: true, warnings }
}

/**
 * Unregister the current user from a shift slot
 */
export async function unregisterFromSlot(
  schichtId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Find the person record linked to this profile
  const { data: person, error: personError } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (personError || !person) {
    return { success: false, error: 'Kein Mitgliederprofil gefunden' }
  }

  // Get the zuweisung
  const { data: zuweisung, error: zuweisungError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id, schicht_id')
    .eq('schicht_id', schichtId)
    .eq('person_id', person.id)
    .single()

  if (zuweisungError || !zuweisung) {
    return { success: false, error: 'Anmeldung nicht gefunden' }
  }

  // Get veranstaltung_id for revalidation
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', schichtId)
    .single()

  // Delete the zuweisung
  const { error: deleteError } = await supabase
    .from('auffuehrung_zuweisungen')
    .delete()
    .eq('id', zuweisung.id)

  if (deleteError) {
    console.error('Error deleting zuweisung:', deleteError)
    return { success: false, error: 'Fehler beim Abmelden' }
  }

  // Notify waitlist if someone was waiting for this slot
  import('./warteliste-notification').then(({ processWaitlistWithNotification }) => {
    processWaitlistWithNotification(schichtId).catch((err) => {
      console.error('Error processing waitlist:', err)
    })
  })

  // Revalidate paths
  if (schicht) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}`)
  }
  revalidatePath('/mein-bereich')

  return { success: true }
}

/**
 * Get time conflicts for the current user
 */
export async function getTimeConflicts(
  veranstaltungId: string,
  zeitblockId: string | null
): Promise<{ hasConflict: boolean; message?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { hasConflict: false }
  }

  const supabase = await createClient()

  // Find the person record
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return { hasConflict: false }
  }

  if (!zeitblockId) {
    return { hasConflict: false }
  }

  // Get the zeitblock details
  const { data: zeitblock } = await supabase
    .from('zeitbloecke')
    .select('startzeit, endzeit')
    .eq('id', zeitblockId)
    .single()

  if (!zeitblock) {
    return { hasConflict: false }
  }

  // Get all other zuweisungen for this veranstaltung
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      zeitblock:zeitbloecke(startzeit, endzeit)
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .neq('zeitblock_id', zeitblockId)

  if (!schichten || schichten.length === 0) {
    return { hasConflict: false }
  }

  // Check if user has any zuweisungen that overlap
  for (const schicht of schichten) {
    const { data: existingZuweisung } = await supabase
      .from('auffuehrung_zuweisungen')
      .select('id')
      .eq('schicht_id', schicht.id)
      .eq('person_id', person.id)
      .neq('status', 'abgesagt')
      .single()

    if (existingZuweisung && schicht.zeitblock) {
      const zb = schicht.zeitblock as unknown as { startzeit: string; endzeit: string }
      // Check time overlap
      if (zeitblock.startzeit < zb.endzeit && zeitblock.endzeit > zb.startzeit) {
        return {
          hasConflict: true,
          message: `Zeitüberschneidung mit "${schicht.rolle}" (${zb.startzeit.slice(0, 5)} - ${zb.endzeit.slice(0, 5)})`,
        }
      }
    }
  }

  return { hasConflict: false }
}
