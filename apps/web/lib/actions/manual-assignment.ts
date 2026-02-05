'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
// Types used for reference but not directly imported
// Person, Profile, ExterneHelferProfil are used in runtime queries

// =============================================================================
// Types
// =============================================================================

export type HelferSearchResult = {
  id: string
  type: 'intern' | 'extern'
  name: string
  email: string
  telefon: string | null
  einsaetzeCount: number
  letzterEinsatz: string | null
}

export type TimeConflict = {
  schichtId: string
  rolle: string
  startzeit: string
  endzeit: string
  ueberschneidungMinuten: number
}

export type AssignmentValidation = {
  hasConflict: boolean
  conflicts: TimeConflict[]
  bookingLimitReached: boolean
  currentBookings: number
  maxBookings: number | null
}

// =============================================================================
// Search
// =============================================================================

/**
 * Search for helpers by name or email
 */
export async function searchHelfer(
  query: string,
  veranstaltungId: string
): Promise<HelferSearchResult[]> {
  await requirePermission('veranstaltungen:write')

  if (!query || query.length < 2) {
    return []
  }

  const supabase = await createClient()
  const searchPattern = `%${query}%`

  // Search internal profiles (via personen table)
  const { data: personen } = await supabase
    .from('personen')
    .select('id, vorname, nachname, email, telefon')
    .or(`vorname.ilike.${searchPattern},nachname.ilike.${searchPattern},email.ilike.${searchPattern}`)
    .eq('aktiv', true)
    .limit(10)

  // Search external helpers
  const { data: externeHelfer } = await supabase
    .from('externe_helfer_profile')
    .select('id, vorname, nachname, email, telefon, letzter_einsatz')
    .or(`vorname.ilike.${searchPattern},nachname.ilike.${searchPattern},email.ilike.${searchPattern}`)
    .limit(10)

  // Get schicht IDs for counting previous assignments
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select('id')
    .eq('veranstaltung_id', veranstaltungId)

  const schichtIds = schichten?.map((s) => s.id) || []

  // Count assignments for internal helpers
  const personIds = personen?.map((p) => p.id) || []
  const assignmentCounts: Record<string, number> = {}

  if (personIds.length > 0 && schichtIds.length > 0) {
    const { data: assignments } = await supabase
      .from('auffuehrung_zuweisungen')
      .select('person_id')
      .in('person_id', personIds)
      .in('schicht_id', schichtIds)
      .neq('status', 'abgesagt')

    assignments?.forEach((a) => {
      assignmentCounts[a.person_id] = (assignmentCounts[a.person_id] || 0) + 1
    })
  }

  const results: HelferSearchResult[] = []

  // Add internal helpers
  personen?.forEach((p) => {
    results.push({
      id: p.id,
      type: 'intern',
      name: `${p.vorname} ${p.nachname}`,
      email: p.email || '',
      telefon: p.telefon,
      einsaetzeCount: assignmentCounts[p.id] || 0,
      letzterEinsatz: null,
    })
  })

  // Add external helpers
  externeHelfer?.forEach((e) => {
    results.push({
      id: e.id,
      type: 'extern',
      name: `${e.vorname} ${e.nachname}`,
      email: e.email,
      telefon: e.telefon,
      einsaetzeCount: 0, // TODO: Count external assignments
      letzterEinsatz: e.letzter_einsatz,
    })
  })

  return results
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate assignment before creating it
 */
export async function validateAssignment(
  schichtId: string,
  personId: string,
  personType: 'intern' | 'extern'
): Promise<AssignmentValidation> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get schicht and veranstaltung info
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      veranstaltung_id,
      zeitblock_id,
      zeitblock:zeitbloecke(startzeit, endzeit)
    `)
    .eq('id', schichtId)
    .single()

  if (!schicht) {
    return {
      hasConflict: false,
      conflicts: [],
      bookingLimitReached: false,
      currentBookings: 0,
      maxBookings: null,
    }
  }

  // Get veranstaltung booking limits
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('max_schichten_pro_helfer, helfer_buchung_limit_aktiv')
    .eq('id', schicht.veranstaltung_id)
    .single()

  const conflicts: TimeConflict[] = []
  let currentBookings = 0

  if (personType === 'intern') {
    // Get all other schichten for this veranstaltung
    const { data: alleSchichten } = await supabase
      .from('auffuehrung_schichten')
      .select(`
        id,
        rolle,
        zeitblock:zeitbloecke(startzeit, endzeit)
      `)
      .eq('veranstaltung_id', schicht.veranstaltung_id)
      .neq('id', schichtId)

    // Get existing assignments for this person
    const { data: assignments } = await supabase
      .from('auffuehrung_zuweisungen')
      .select('schicht_id')
      .eq('person_id', personId)
      .in('schicht_id', alleSchichten?.map((s) => s.id) || [])
      .neq('status', 'abgesagt')

    currentBookings = assignments?.length || 0

    // Check for time conflicts
    const targetZeitblock = schicht.zeitblock as unknown as { startzeit: string; endzeit: string } | null
    if (targetZeitblock && assignments) {
      const assignedSchichtIds = new Set(assignments.map((a) => a.schicht_id))

      alleSchichten?.forEach((s) => {
        if (assignedSchichtIds.has(s.id)) {
          const zb = s.zeitblock as unknown as { startzeit: string; endzeit: string } | null
          if (zb) {
            // Check overlap
            if (targetZeitblock.startzeit < zb.endzeit && targetZeitblock.endzeit > zb.startzeit) {
              // Calculate overlap in minutes
              const overlapStart = targetZeitblock.startzeit > zb.startzeit
                ? targetZeitblock.startzeit
                : zb.startzeit
              const overlapEnd = targetZeitblock.endzeit < zb.endzeit
                ? targetZeitblock.endzeit
                : zb.endzeit

              const startMinutes = parseInt(overlapStart.split(':')[0]) * 60 + parseInt(overlapStart.split(':')[1])
              const endMinutes = parseInt(overlapEnd.split(':')[0]) * 60 + parseInt(overlapEnd.split(':')[1])

              conflicts.push({
                schichtId: s.id,
                rolle: s.rolle,
                startzeit: zb.startzeit,
                endzeit: zb.endzeit,
                ueberschneidungMinuten: endMinutes - startMinutes,
              })
            }
          }
        }
      })
    }
  }

  const maxBookings = veranstaltung?.helfer_buchung_limit_aktiv
    ? veranstaltung.max_schichten_pro_helfer
    : null

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    bookingLimitReached: maxBookings !== null && currentBookings >= maxBookings,
    currentBookings,
    maxBookings,
  }
}

// =============================================================================
// Assignment
// =============================================================================

/**
 * Manually assign a helper to a shift
 */
export async function assignHelferManual(
  schichtId: string,
  personId: string,
  personType: 'intern' | 'extern',
  override = false,
  notizen?: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()
  const profile = await getUserProfile()

  // Validate if not overriding
  if (!override) {
    const validation = await validateAssignment(schichtId, personId, personType)

    if (validation.hasConflict) {
      const conflictRoles = validation.conflicts.map((c) => c.rolle).join(', ')
      return { success: false, error: `Zeitkonflikt mit: ${conflictRoles}` }
    }

    if (validation.bookingLimitReached) {
      return {
        success: false,
        error: `Buchungslimit erreicht: ${validation.currentBookings}/${validation.maxBookings} Schichten`,
      }
    }
  } else {
    // Override requires admin permission
    await requirePermission('admin:access')
  }

  // Get veranstaltung_id for revalidation
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', schichtId)
    .single()

  if (!schicht) {
    return { success: false, error: 'Schicht nicht gefunden' }
  }

  if (personType === 'intern') {
    // Check for existing assignment
    const { data: existing } = await supabase
      .from('auffuehrung_zuweisungen')
      .select('id')
      .eq('schicht_id', schichtId)
      .eq('person_id', personId)
      .single()

    if (existing) {
      return { success: false, error: 'Diese Person ist bereits für diese Schicht zugewiesen' }
    }

    // Create assignment
    const assignmentNotizen = notizen
      ? `${notizen}\n\nManuell zugewiesen von ${profile?.display_name || profile?.email}`
      : `Manuell zugewiesen von ${profile?.display_name || profile?.email}`

    const { error } = await supabase
      .from('auffuehrung_zuweisungen')
      .insert({
        schicht_id: schichtId,
        person_id: personId,
        status: 'zugesagt',
        notizen: assignmentNotizen,
      } as never)

    if (error) {
      console.error('Error creating assignment:', error)
      if (error.code === '23505') {
        return { success: false, error: 'Diese Person ist bereits für diese Schicht zugewiesen' }
      }
      return { success: false, error: 'Fehler beim Zuweisen' }
    }
  } else {
    // External helper - need to handle differently
    // For now, external helpers cannot be assigned directly to auffuehrung_zuweisungen
    // They would need to be added to personen first or use a different mechanism
    return {
      success: false,
      error: 'Externe Helfer koennen derzeit nicht direkt zugewiesen werden. Bitte legen Sie zuerst ein Mitgliederprofil an.',
    }
  }

  revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helfer-koordination`)
  revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)

  return { success: true }
}

/**
 * Create external helper and assign to shift
 */
export async function createExternalAndAssign(
  schichtId: string,
  helferData: {
    vorname: string
    nachname: string
    email: string
    telefon?: string
  }
): Promise<{ success: boolean; error?: string; helperId?: string }> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()
  const profile = await getUserProfile()

  // Get veranstaltung_id
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', schichtId)
    .single()

  if (!schicht) {
    return { success: false, error: 'Schicht nicht gefunden' }
  }

  // First, check if person already exists in personen table
  const { data: existingPerson } = await supabase
    .from('personen')
    .select('id')
    .ilike('email', helferData.email)
    .single()

  if (existingPerson) {
    // Person exists, just assign
    return assignHelferManual(schichtId, existingPerson.id, 'intern', false)
  }

  // Create new person
  const { data: newPerson, error: createError } = await supabase
    .from('personen')
    .insert({
      vorname: helferData.vorname,
      nachname: helferData.nachname,
      email: helferData.email,
      telefon: helferData.telefon || null,
      rolle: 'gast',
      aktiv: true,
      skills: [],
      telefon_nummern: helferData.telefon
        ? [{ typ: 'mobil', nummer: helferData.telefon, ist_bevorzugt: true }]
        : [],
    } as never)
    .select('id')
    .single()

  if (createError) {
    console.error('Error creating person:', createError)
    return { success: false, error: 'Fehler beim Anlegen der Person' }
  }

  // Now assign
  const assignmentNotizen = `Manuell zugewiesen von ${profile?.display_name || profile?.email}\nNeu angelegt als externer Helfer`

  const { error: assignError } = await supabase
    .from('auffuehrung_zuweisungen')
    .insert({
      schicht_id: schichtId,
      person_id: newPerson.id,
      status: 'zugesagt',
      notizen: assignmentNotizen,
    } as never)

  if (assignError) {
    console.error('Error assigning new person:', assignError)
    return { success: false, error: 'Fehler beim Zuweisen' }
  }

  revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helfer-koordination`)
  revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)

  return { success: true, helperId: newPerson.id }
}
