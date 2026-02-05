'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { getUserProfile } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type { Person, Zeitblock } from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type VerfuegbarerHelfer = {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'telefon' | 'email'>
  status: 'verfuegbar' | 'teilweise_verfuegbar'
  aktuelleSchichten: {
    rolle: string
    startzeit: string
    endzeit: string
  }[]
  isCheckedIn: boolean
}

export type WartelisteHelfer = {
  id: string
  position: number
  person: {
    name: string
    email: string | null
    telefon: string | null
  }
  isExternal: boolean
}

// =============================================================================
// Find Available Replacements
// =============================================================================

/**
 * Find helpers who could replace a no-show
 * Returns helpers who are already checked in and don't have time conflicts
 */
export async function findAvailableReplacements(
  schichtId: string
): Promise<{
  verfuegbar: VerfuegbarerHelfer[]
  warteliste: WartelisteHelfer[]
}> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get the schicht and its zeitblock
  const { data: schicht, error: schichtError } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      veranstaltung_id,
      zeitblock:zeitbloecke(id, startzeit, endzeit)
    `)
    .eq('id', schichtId)
    .single()

  if (schichtError || !schicht) {
    console.error('Error fetching schicht:', schichtError)
    return { verfuegbar: [], warteliste: [] }
  }

  const zeitblock = schicht.zeitblock as unknown as Pick<
    Zeitblock,
    'id' | 'startzeit' | 'endzeit'
  > | null

  // Get all zuweisungen for this veranstaltung that are checked in
  const { data: alleZuweisungen, error: zuweisungenError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id,
      person_id,
      checked_in_at,
      schicht:auffuehrung_schichten(
        id,
        rolle,
        veranstaltung_id,
        zeitblock:zeitbloecke(startzeit, endzeit)
      ),
      person:personen(id, vorname, nachname, telefon, email)
    `)
    .not('checked_in_at', 'is', null)
    .eq('no_show', false)

  if (zuweisungenError) {
    console.error('Error fetching zuweisungen:', zuweisungenError)
    return { verfuegbar: [], warteliste: [] }
  }

  // Filter to zuweisungen from the same veranstaltung
  const veranstaltungZuweisungen = (alleZuweisungen || []).filter((z) => {
    const zSchicht = z.schicht as unknown as { veranstaltung_id: string } | null
    return zSchicht?.veranstaltung_id === schicht.veranstaltung_id
  })

  // Get existing person_ids for this schicht (to exclude)
  const { data: existingZuweisungen } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('person_id')
    .eq('schicht_id', schichtId)
    .neq('no_show', true)

  const existingPersonIds = new Set(
    (existingZuweisungen || []).map((z) => z.person_id)
  )

  // Group zuweisungen by person
  const helferMap = new Map<
    string,
    {
      person: VerfuegbarerHelfer['person']
      schichten: VerfuegbarerHelfer['aktuelleSchichten']
      isCheckedIn: boolean
    }
  >()

  for (const zuweisung of veranstaltungZuweisungen) {
    const person = zuweisung.person as unknown as Person | null
    if (!person) continue

    // Skip if already assigned to this schicht
    if (existingPersonIds.has(person.id)) continue

    const entry = helferMap.get(person.id) || {
      person: {
        id: person.id,
        vorname: person.vorname,
        nachname: person.nachname,
        telefon: person.telefon,
        email: person.email,
      },
      schichten: [],
      isCheckedIn: true,
    }

    const zSchicht = zuweisung.schicht as unknown as {
      rolle: string
      zeitblock: { startzeit: string; endzeit: string } | null
    } | null

    if (zSchicht?.zeitblock) {
      entry.schichten.push({
        rolle: zSchicht.rolle,
        startzeit: zSchicht.zeitblock.startzeit,
        endzeit: zSchicht.zeitblock.endzeit,
      })
    }

    helferMap.set(person.id, entry)
  }

  // Check for time conflicts and categorize
  const verfuegbar: VerfuegbarerHelfer[] = []

  for (const helfer of helferMap.values()) {
    let hasConflict = false

    if (zeitblock) {
      for (const s of helfer.schichten) {
        // Check time overlap
        if (
          zeitblock.startzeit < s.endzeit &&
          zeitblock.endzeit > s.startzeit
        ) {
          hasConflict = true
          break
        }
      }
    }

    if (!hasConflict) {
      verfuegbar.push({
        person: helfer.person,
        status: 'verfuegbar',
        aktuelleSchichten: helfer.schichten,
        isCheckedIn: helfer.isCheckedIn,
      })
    }
  }

  // Get warteliste entries for this schicht
  const { data: wartelisteData, error: wartelisteError } = await supabase
    .from('helfer_warteliste')
    .select(`
      id,
      position,
      profile:profiles(id, display_name, email),
      external_helper:externe_helfer_profile(id, vorname, nachname, email, telefon)
    `)
    .eq('schicht_id', schichtId)
    .eq('status', 'wartend')
    .order('position', { ascending: true })

  if (wartelisteError) {
    console.error('Error fetching warteliste:', wartelisteError)
  }

  const warteliste: WartelisteHelfer[] = (wartelisteData || []).map((entry) => {
    const profile = entry.profile as unknown as {
      display_name: string | null
      email: string
    } | null
    const external = entry.external_helper as unknown as {
      vorname: string
      nachname: string
      email: string | null
      telefon: string | null
    } | null

    if (external) {
      return {
        id: entry.id,
        position: entry.position,
        person: {
          name: `${external.vorname} ${external.nachname}`,
          email: external.email,
          telefon: external.telefon,
        },
        isExternal: true,
      }
    }

    return {
      id: entry.id,
      position: entry.position,
      person: {
        name: profile?.display_name || 'Unbekannt',
        email: profile?.email || null,
        telefon: null,
      },
      isExternal: false,
    }
  })

  return { verfuegbar, warteliste }
}

// =============================================================================
// Assign Replacement
// =============================================================================

/**
 * Assign a replacement helper for a no-show
 */
export async function assignReplacement(
  schichtId: string,
  personId: string,
  originalZuweisungId: string,
  grund: string = 'No-Show Ersatz'
): Promise<{ success: boolean; error?: string; id?: string }> {
  await requirePermission('veranstaltungen:write')

  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Check if person is already assigned to this schicht
  const { data: existing } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id')
    .eq('schicht_id', schichtId)
    .eq('person_id', personId)
    .single()

  if (existing) {
    return { success: false, error: 'Person ist bereits fuer diese Schicht eingeteilt' }
  }

  // Create new zuweisung with replacement reference
  const { data: result, error } = await supabase
    .from('auffuehrung_zuweisungen')
    .insert({
      schicht_id: schichtId,
      person_id: personId,
      status: 'zugesagt',
      // Auto check-in the replacement
      checked_in_at: new Date().toISOString(),
      checked_in_by: profile.id,
      // Reference to original no-show
      ersetzt_zuweisung_id: originalZuweisungId,
      ersatz_grund: grund,
    } as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating replacement zuweisung:', error)
    return { success: false, error: 'Fehler beim Erstellen der Ersatzzuweisung' }
  }

  // Get veranstaltung_id for revalidation
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', schichtId)
    .single()

  if (schicht?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/checkin`)
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/live-board`)
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)
  }

  return { success: true, id: result?.id }
}

/**
 * Quick assign from warteliste
 */
export async function assignFromWarteliste(
  wartelisteId: string,
  schichtId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('veranstaltungen:write')

  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Get warteliste entry
  const { data: entry, error: entryError } = await supabase
    .from('helfer_warteliste')
    .select(`
      id,
      schicht_id,
      profile_id,
      external_helper_id
    `)
    .eq('id', wartelisteId)
    .single()

  if (entryError || !entry) {
    return { success: false, error: 'Wartelisten-Eintrag nicht gefunden' }
  }

  // For internal helpers, create zuweisung
  if (entry.profile_id) {
    // Find person by profile email
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', entry.profile_id)
      .single()

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

    // Create zuweisung
    const { error: insertError } = await supabase
      .from('auffuehrung_zuweisungen')
      .insert({
        schicht_id: schichtId,
        person_id: person.id,
        status: 'zugesagt',
        checked_in_at: new Date().toISOString(),
        checked_in_by: profile.id,
        ersatz_grund: 'Warteliste Nachruecker',
      } as never)

    if (insertError) {
      console.error('Error creating zuweisung from warteliste:', insertError)
      return { success: false, error: 'Fehler beim Zuweisen' }
    }
  }

  // Update warteliste status
  const { error: updateError } = await supabase
    .from('helfer_warteliste')
    .update({ status: 'zugewiesen' } as never)
    .eq('id', wartelisteId)

  if (updateError) {
    console.error('Error updating warteliste status:', updateError)
  }

  // Get veranstaltung_id for revalidation
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', schichtId)
    .single()

  if (schicht?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/checkin`)
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/live-board`)
  }

  return { success: true }
}
