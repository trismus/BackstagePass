'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type {
  VerfuegbarkeitStatus,
  Person,
  BesetzungMitDetails,
} from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type AvailabilityConflict = {
  person_id: string
  vorname: string
  nachname: string
  status: VerfuegbarkeitStatus
  grund: string | null
  datum_von: string
  datum_bis: string
}

export type ShiftAssignmentResult = {
  success: boolean
  created: number
  skipped: number
  conflicts: AvailabilityConflict[]
  errors: string[]
}

export type SkillSuggestion = {
  person_id: string
  vorname: string
  nachname: string
  email: string | null
  skills: string[]
  matching_skills: string[]
  verfuegbarkeit: VerfuegbarkeitStatus
  bereits_zugewiesen: boolean
}

export type PersonAssignment = {
  id: string
  typ: 'besetzung' | 'schicht' | 'probe' | 'veranstaltung'
  titel: string
  datum: string | null
  startzeit: string | null
  endzeit: string | null
  rolle: string | null
  status: string
  stueck_titel: string | null
  veranstaltung_id: string | null
}

export type PersonDetailData = {
  person: Person
  besetzungen: BesetzungMitDetails[]
  assignments: PersonAssignment[]
  stats: {
    total_besetzungen: number
    total_schichten: number
    total_proben: number
    total_veranstaltungen: number
  }
}

export type ProductionProgress = {
  stueck_id: string
  stueck_titel: string
  rollen_total: number
  rollen_besetzt: number
  naechste_auffuehrung: string | null
  schichten_total: number
  schichten_besetzt: number
  naechste_probe: string | null
  proben_total: number
  proben_abgeschlossen: number
}

// =============================================================================
// #343: Availability Conflict Detection
// =============================================================================

/**
 * Check availability conflicts for a person on a specific date/time
 * Used during shift assignment to warn about conflicts
 */
export async function checkAvailabilityConflicts(
  personIds: string[],
  datum: string,
  zeitVon?: string,
  zeitBis?: string
): Promise<AvailabilityConflict[]> {
  await requirePermission('veranstaltungen:write')

  if (personIds.length === 0) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('verfuegbarkeiten')
    .select(`
      mitglied_id,
      status,
      grund,
      datum_von,
      datum_bis,
      zeitfenster_von,
      zeitfenster_bis,
      mitglied:personen(id, vorname, nachname)
    `)
    .in('mitglied_id', personIds)
    .lte('datum_von', datum)
    .gte('datum_bis', datum)
    .in('status', ['nicht_verfuegbar', 'eingeschraenkt'])

  if (error) {
    console.error('Error checking availability conflicts:', error)
    return []
  }

  const conflicts: AvailabilityConflict[] = []

  for (const entry of data || []) {
    // Check time overlap if times are specified
    if (zeitVon && zeitBis && entry.zeitfenster_von && entry.zeitfenster_bis) {
      if (zeitVon >= entry.zeitfenster_bis || zeitBis <= entry.zeitfenster_von) {
        continue // No time overlap
      }
    }

    const mitglied = Array.isArray(entry.mitglied) ? entry.mitglied[0] : entry.mitglied
    if (!mitglied) continue

    conflicts.push({
      person_id: entry.mitglied_id,
      vorname: mitglied.vorname,
      nachname: mitglied.nachname,
      status: entry.status as VerfuegbarkeitStatus,
      grund: entry.grund,
      datum_von: entry.datum_von,
      datum_bis: entry.datum_bis,
    })
  }

  return conflicts
}

/**
 * Check availability for a single person during shift assignment
 * Returns detailed conflict info for the assignment validation dialog
 */
export async function checkPersonAvailabilityForShift(
  personId: string,
  schichtId: string
): Promise<{
  verfuegbar: boolean
  status: VerfuegbarkeitStatus
  conflicts: AvailabilityConflict[]
  existingAssignments: { rolle: string; zeitblock: string }[]
}> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get shift details with time block
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      veranstaltung_id,
      rolle,
      zeitblock:zeitbloecke(startzeit, endzeit)
    `)
    .eq('id', schichtId)
    .single()

  if (!schicht) {
    return { verfuegbar: true, status: 'verfuegbar', conflicts: [], existingAssignments: [] }
  }

  // Get veranstaltung date
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('datum, startzeit, endzeit')
    .eq('id', schicht.veranstaltung_id)
    .single()

  if (!veranstaltung) {
    return { verfuegbar: true, status: 'verfuegbar', conflicts: [], existingAssignments: [] }
  }

  type ZeitblockData = { startzeit: string; endzeit: string } | null
  const zeitblock = schicht.zeitblock as unknown as ZeitblockData

  // Check availability conflicts
  const conflicts = await checkAvailabilityConflicts(
    [personId],
    veranstaltung.datum,
    zeitblock?.startzeit || veranstaltung.startzeit || undefined,
    zeitblock?.endzeit || veranstaltung.endzeit || undefined
  )

  // Check existing assignments for the same veranstaltung
  const { data: existingAssignments } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      schicht:auffuehrung_schichten(
        rolle,
        zeitblock:zeitbloecke(name)
      )
    `)
    .eq('person_id', personId)
    .neq('status', 'abgesagt')

  type AssignmentWithSchicht = {
    schicht: { rolle: string; zeitblock: { name: string } | null } | null
  }

  const existing = (existingAssignments as unknown as AssignmentWithSchicht[] || [])
    .filter((a) => a.schicht)
    .map((a) => ({
      rolle: a.schicht!.rolle,
      zeitblock: a.schicht!.zeitblock?.name || '',
    }))

  const status: VerfuegbarkeitStatus = conflicts.length > 0
    ? conflicts.some((c) => c.status === 'nicht_verfuegbar')
      ? 'nicht_verfuegbar'
      : 'eingeschraenkt'
    : 'verfuegbar'

  return {
    verfuegbar: conflicts.length === 0,
    status,
    conflicts,
    existingAssignments: existing,
  }
}

// =============================================================================
// #344: Auto-create Performance Assignments from Casting
// =============================================================================

/**
 * Auto-create performance shift assignments based on casting (besetzungen)
 * Maps cast members to appropriate shifts for a specific performance
 */
export async function createAssignmentsFromCasting(
  veranstaltungId: string,
  options?: {
    checkAvailability?: boolean
    skipConflicts?: boolean
    rollenFilter?: string[] // Only process specific roles
  }
): Promise<ShiftAssignmentResult> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()
  const profile = await getUserProfile()
  const result: ShiftAssignmentResult = {
    success: true,
    created: 0,
    skipped: 0,
    conflicts: [],
    errors: [],
  }

  // Get veranstaltung with stueck info
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, typ')
    .eq('id', veranstaltungId)
    .single()

  if (!veranstaltung) {
    return { ...result, success: false, errors: ['Veranstaltung nicht gefunden'] }
  }

  // Get all shifts for this veranstaltung
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      anzahl_benoetigt,
      zeitblock:zeitbloecke(startzeit, endzeit)
    `)
    .eq('veranstaltung_id', veranstaltungId)

  if (!schichten || schichten.length === 0) {
    return { ...result, success: false, errors: ['Keine Schichten gefunden'] }
  }

  // Get all besetzungen (cast members) for active stuecke
  const { data: besetzungen } = await supabase
    .from('besetzungen')
    .select(`
      id,
      person_id,
      typ,
      rolle:rollen(id, name, typ, stueck:stuecke(id, titel, status))
    `)
    .order('typ', { ascending: true })

  if (!besetzungen || besetzungen.length === 0) {
    return { ...result, success: false, errors: ['Keine Besetzungen gefunden'] }
  }

  // Filter for active stuecke
  type BesetzungRaw = {
    id: string
    person_id: string
    typ: string
    rolle: { id: string; name: string; typ: string; stueck: { id: string; titel: string; status: string } | null } | null
  }

  const activeBesetzungen = (besetzungen as unknown as BesetzungRaw[]).filter(
    (b) => b.rolle?.stueck?.status && ['in_proben', 'aktiv'].includes(b.rolle.stueck.status)
  )

  // Get unique person IDs for availability checking
  const personIds = [...new Set(activeBesetzungen.map((b) => b.person_id))]

  // Check availability if requested
  if (options?.checkAvailability && personIds.length > 0) {
    const conflicts = await checkAvailabilityConflicts(
      personIds,
      veranstaltung.datum
    )
    result.conflicts = conflicts
  }

  const unavailablePersonIds = new Set(
    result.conflicts
      .filter((c) => c.status === 'nicht_verfuegbar')
      .map((c) => c.person_id)
  )

  // Get existing assignments to avoid duplicates
  const schichtIds = schichten.map((s: { id: string }) => s.id)
  const { data: existingAssignments } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('schicht_id, person_id')
    .in('schicht_id', schichtIds)
    .neq('status', 'abgesagt')

  const existingSet = new Set(
    (existingAssignments || []).map((a: { schicht_id: string; person_id: string }) => `${a.schicht_id}-${a.person_id}`)
  )

  // Match cast members to shifts by role name
  const assignmentsToCreate: { schicht_id: string; person_id: string }[] = []

  for (const schicht of schichten) {
    const rollenFilter = options?.rollenFilter
    if (rollenFilter && !rollenFilter.includes(schicht.rolle)) continue

    // Find cast members whose role name matches the shift role
    const matchingCast = activeBesetzungen.filter(
      (b) => b.rolle?.name?.toLowerCase() === schicht.rolle.toLowerCase()
        || b.rolle?.typ?.toLowerCase() === schicht.rolle.toLowerCase()
    )

    for (const cast of matchingCast) {
      const key = `${schicht.id}-${cast.person_id}`

      if (existingSet.has(key)) {
        result.skipped++
        continue
      }

      if (unavailablePersonIds.has(cast.person_id) && !options?.skipConflicts) {
        result.skipped++
        continue
      }

      assignmentsToCreate.push({
        schicht_id: schicht.id,
        person_id: cast.person_id,
      })
    }
  }

  // Create assignments in batch
  if (assignmentsToCreate.length > 0) {
    const notizen = `Automatisch aus Besetzung erstellt von ${profile?.display_name || profile?.email}`

    const inserts = assignmentsToCreate.map((a) => ({
      schicht_id: a.schicht_id,
      person_id: a.person_id,
      status: 'zugesagt' as const,
      notizen,
    }))

    const { error } = await supabase
      .from('auffuehrung_zuweisungen')
      .insert(inserts as never[])

    if (error) {
      console.error('Error creating assignments from casting:', error)
      result.errors.push(error.message)
      result.success = false
    } else {
      result.created = assignmentsToCreate.length
    }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}/schichten`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}/helferliste`)

  return result
}

// =============================================================================
// #345: Auto-populate Rehearsal Participants from Casting
// =============================================================================

/**
 * Auto-populate rehearsal participants based on casting
 * Uses the DB function auto_invite_probe_teilnehmer or manual logic
 */
export async function populateProbeFromCasting(
  probeId: string
): Promise<{ success: boolean; invited: number; error?: string }> {
  await requirePermission('stuecke:write')

  const supabase = await createClient()

  // Call the database function
  const { data, error } = await supabase.rpc('auto_invite_probe_teilnehmer', {
    probe_uuid: probeId,
  })

  if (error) {
    console.error('Error auto-inviting probe teilnehmer:', error)
    return { success: false, invited: 0, error: error.message }
  }

  const invited = typeof data === 'number' ? data : 0

  revalidatePath('/proben')
  revalidatePath('/stuecke')

  return { success: true, invited }
}

/**
 * Bulk auto-populate participants for multiple proben
 */
export async function populateMultipleProbenFromCasting(
  probeIds: string[]
): Promise<{ success: boolean; results: { probeId: string; invited: number }[]; errors: string[] }> {
  await requirePermission('stuecke:write')

  const results: { probeId: string; invited: number }[] = []
  const errors: string[] = []

  for (const probeId of probeIds) {
    const result = await populateProbeFromCasting(probeId)
    if (result.success) {
      results.push({ probeId, invited: result.invited })
    } else {
      errors.push(`Probe ${probeId}: ${result.error}`)
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
  }
}

// =============================================================================
// #346: Central Personal Assignment Overview
// =============================================================================

/**
 * Get all assignments (roles, shifts, proben, events) for a specific person
 */
export async function getPersonAssignments(
  personId: string
): Promise<PersonAssignment[]> {
  const supabase = await createClient()
  const assignments: PersonAssignment[] = []

  // 1. Besetzungen (role castings)
  const { data: besetzungen } = await supabase
    .from('besetzungen')
    .select(`
      id, typ, created_at,
      rolle:rollen(name, typ, stueck:stuecke(id, titel, premiere_datum))
    `)
    .eq('person_id', personId)

  type BesetzungData = {
    id: string
    typ: string
    created_at: string
    rolle: { name: string; typ: string; stueck: { id: string; titel: string; premiere_datum: string | null } | null } | null
  }

  for (const b of (besetzungen as unknown as BesetzungData[]) || []) {
    if (!b.rolle) continue
    assignments.push({
      id: b.id,
      typ: 'besetzung',
      titel: `${b.rolle.stueck?.titel || 'Unbekannt'} - ${b.rolle.name}`,
      datum: b.rolle.stueck?.premiere_datum || null,
      startzeit: null,
      endzeit: null,
      rolle: b.rolle.name,
      status: b.typ,
      stueck_titel: b.rolle.stueck?.titel || null,
      veranstaltung_id: null,
    })
  }

  // 2. Aufführung Zuweisungen (performance shifts)
  const { data: zuweisungen } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id, status,
      schicht:auffuehrung_schichten(
        rolle,
        veranstaltung:veranstaltungen(id, titel, datum, startzeit, endzeit)
      )
    `)
    .eq('person_id', personId)

  type ZuweisungData = {
    id: string
    status: string
    schicht: {
      rolle: string
      veranstaltung: { id: string; titel: string; datum: string; startzeit: string | null; endzeit: string | null } | null
    } | null
  }

  for (const z of (zuweisungen as unknown as ZuweisungData[]) || []) {
    if (!z.schicht?.veranstaltung) continue
    assignments.push({
      id: z.id,
      typ: 'schicht',
      titel: `${z.schicht.veranstaltung.titel} - ${z.schicht.rolle}`,
      datum: z.schicht.veranstaltung.datum,
      startzeit: z.schicht.veranstaltung.startzeit,
      endzeit: z.schicht.veranstaltung.endzeit,
      rolle: z.schicht.rolle,
      status: z.status,
      stueck_titel: null,
      veranstaltung_id: z.schicht.veranstaltung.id,
    })
  }

  // 3. Proben Teilnahmen (rehearsal participation)
  const { data: proben } = await supabase
    .from('proben_teilnehmer')
    .select(`
      id, status,
      probe:proben(id, titel, datum, startzeit, endzeit, stueck:stuecke(titel))
    `)
    .eq('person_id', personId)

  type ProbeData = {
    id: string
    status: string
    probe: {
      id: string
      titel: string
      datum: string
      startzeit: string | null
      endzeit: string | null
      stueck: { titel: string } | null
    } | null
  }

  for (const pt of (proben as unknown as ProbeData[]) || []) {
    if (!pt.probe) continue
    assignments.push({
      id: pt.id,
      typ: 'probe',
      titel: pt.probe.titel,
      datum: pt.probe.datum,
      startzeit: pt.probe.startzeit,
      endzeit: pt.probe.endzeit,
      rolle: null,
      status: pt.status,
      stueck_titel: pt.probe.stueck?.titel || null,
      veranstaltung_id: null,
    })
  }

  // 4. Veranstaltung Anmeldungen
  const { data: anmeldungen } = await supabase
    .from('anmeldungen')
    .select(`
      id, status,
      veranstaltung:veranstaltungen(id, titel, datum, startzeit, endzeit, typ)
    `)
    .eq('person_id', personId)

  type AnmeldungData = {
    id: string
    status: string
    veranstaltung: {
      id: string; titel: string; datum: string
      startzeit: string | null; endzeit: string | null; typ: string
    } | null
  }

  for (const a of (anmeldungen as unknown as AnmeldungData[]) || []) {
    if (!a.veranstaltung) continue
    assignments.push({
      id: a.id,
      typ: 'veranstaltung',
      titel: a.veranstaltung.titel,
      datum: a.veranstaltung.datum,
      startzeit: a.veranstaltung.startzeit,
      endzeit: a.veranstaltung.endzeit,
      rolle: null,
      status: a.status,
      stueck_titel: null,
      veranstaltung_id: a.veranstaltung.id,
    })
  }

  // Sort by date
  assignments.sort((a, b) => {
    if (!a.datum && !b.datum) return 0
    if (!a.datum) return 1
    if (!b.datum) return -1
    return b.datum.localeCompare(a.datum)
  })

  return assignments
}

// =============================================================================
// #347: Skill-based Shift Suggestions
// =============================================================================

/**
 * Suggest members for a shift based on skills, availability, and existing assignments
 */
export async function suggestMembersForShift(
  schichtId: string,
  requiredSkills?: string[]
): Promise<SkillSuggestion[]> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get shift and veranstaltung details
  const { data: schicht } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      veranstaltung_id,
      zeitblock:zeitbloecke(startzeit, endzeit)
    `)
    .eq('id', schichtId)
    .single()

  if (!schicht) return []

  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('datum, startzeit, endzeit')
    .eq('id', schicht.veranstaltung_id)
    .single()

  if (!veranstaltung) return []

  // Get all active members with skills
  const { data: members } = await supabase
    .from('personen')
    .select('id, vorname, nachname, email, skills')
    .eq('aktiv', true)
    .order('nachname', { ascending: true })

  if (!members || members.length === 0) return []

  // Get existing assignments for this shift
  const { data: existing } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('person_id')
    .eq('schicht_id', schichtId)
    .neq('status', 'abgesagt')

  const assignedIds = new Set((existing || []).map((e: { person_id: string }) => e.person_id))

  // Derive skills to search for from the shift role if not provided
  const skillsToMatch = requiredSkills || [schicht.rolle.toLowerCase()]

  // Check availability for all members
  const memberIds = members.map((m: { id: string }) => m.id)

  const { data: unavailable } = await supabase
    .from('verfuegbarkeiten')
    .select('mitglied_id, status')
    .in('mitglied_id', memberIds)
    .lte('datum_von', veranstaltung.datum)
    .gte('datum_bis', veranstaltung.datum)
    .in('status', ['nicht_verfuegbar', 'eingeschraenkt'])

  const unavailabilityMap = new Map<string, VerfuegbarkeitStatus>()
  for (const u of unavailable || []) {
    const current = unavailabilityMap.get(u.mitglied_id)
    if (!current || u.status === 'nicht_verfuegbar') {
      unavailabilityMap.set(u.mitglied_id, u.status as VerfuegbarkeitStatus)
    }
  }

  // Build suggestions
  type MemberRow = { id: string; vorname: string; nachname: string; email: string | null; skills: string[] }
  const suggestions: SkillSuggestion[] = members.map((m: MemberRow) => {
    const memberSkills = (m.skills || []).map((s: string) => s.toLowerCase())
    const matchingSkills = skillsToMatch.filter(
      (skill) => memberSkills.some((ms: string) => ms.includes(skill) || skill.includes(ms))
    )

    return {
      person_id: m.id,
      vorname: m.vorname,
      nachname: m.nachname,
      email: m.email,
      skills: m.skills || [],
      matching_skills: matchingSkills,
      verfuegbarkeit: unavailabilityMap.get(m.id) || 'verfuegbar',
      bereits_zugewiesen: assignedIds.has(m.id),
    }
  })

  // Sort: matching skills first, then available, then not yet assigned
  suggestions.sort((a, b) => {
    // Already assigned last
    if (a.bereits_zugewiesen !== b.bereits_zugewiesen) {
      return a.bereits_zugewiesen ? 1 : -1
    }
    // Unavailable last
    if (a.verfuegbarkeit !== b.verfuegbarkeit) {
      if (a.verfuegbarkeit === 'nicht_verfuegbar') return 1
      if (b.verfuegbarkeit === 'nicht_verfuegbar') return -1
      if (a.verfuegbarkeit === 'eingeschraenkt') return 1
      if (b.verfuegbarkeit === 'eingeschraenkt') return -1
    }
    // More matching skills first
    if (a.matching_skills.length !== b.matching_skills.length) {
      return b.matching_skills.length - a.matching_skills.length
    }
    return a.nachname.localeCompare(b.nachname)
  })

  return suggestions
}

// =============================================================================
// #348: Production Dashboard Data
// =============================================================================

/**
 * Get production progress overview for all active productions
 */
export async function getProductionProgress(): Promise<ProductionProgress[]> {
  await requirePermission('stuecke:read')

  const supabase = await createClient()

  // Get active stuecke
  const { data: stuecke } = await supabase
    .from('stuecke')
    .select('id, titel, status')
    .in('status', ['in_planung', 'in_proben', 'aktiv'])
    .order('titel', { ascending: true })

  if (!stuecke || stuecke.length === 0) return []

  const progress: ProductionProgress[] = []

  for (const stueck of stuecke) {
    // Get roles count
    const { count: rollenTotal } = await supabase
      .from('rollen')
      .select('*', { count: 'exact', head: true })
      .eq('stueck_id', stueck.id)

    // Get besetzt roles count (roles with at least one hauptbesetzung)
    const { data: besetzte } = await supabase
      .from('besetzungen')
      .select('rolle_id')
      .eq('typ', 'hauptbesetzung')

    const besetzteRollen = besetzte
      ? new Set(besetzte.map((b: { rolle_id: string }) => b.rolle_id))
      : new Set<string>()

    // Get rollen for this stueck to filter
    const { data: rollenIds } = await supabase
      .from('rollen')
      .select('id')
      .eq('stueck_id', stueck.id)

    const stueckRollenIds = new Set((rollenIds || []).map((r: { id: string }) => r.id))
    const besetzteInStueck = [...besetzteRollen].filter((id) => stueckRollenIds.has(id as string))

    // Get next performance
    const today = new Date().toISOString().split('T')[0]
    const { data: naechsteAuffuehrung } = await supabase
      .from('veranstaltungen')
      .select('datum')
      .eq('typ', 'auffuehrung')
      .gte('datum', today)
      .order('datum', { ascending: true })
      .limit(1)

    // Get shift stats for upcoming performances
    let schichtenTotal = 0
    let schichtenBesetzt = 0

    if (naechsteAuffuehrung && naechsteAuffuehrung.length > 0) {
      const { data: auffuehrungen } = await supabase
        .from('veranstaltungen')
        .select('id')
        .eq('typ', 'auffuehrung')
        .gte('datum', today)

      const auffIds = (auffuehrungen || []).map((a: { id: string }) => a.id)
      if (auffIds.length > 0) {
        const { data: schichten } = await supabase
          .from('auffuehrung_schichten')
          .select('id, anzahl_benoetigt')
          .in('veranstaltung_id', auffIds)

        for (const s of schichten || []) {
          schichtenTotal += s.anzahl_benoetigt

          const { count } = await supabase
            .from('auffuehrung_zuweisungen')
            .select('*', { count: 'exact', head: true })
            .eq('schicht_id', s.id)
            .neq('status', 'abgesagt')

          schichtenBesetzt += count || 0
        }
      }
    }

    // Get probe stats
    const { count: probenTotal } = await supabase
      .from('proben')
      .select('*', { count: 'exact', head: true })
      .eq('stueck_id', stueck.id)

    const { count: probenAbgeschlossen } = await supabase
      .from('proben')
      .select('*', { count: 'exact', head: true })
      .eq('stueck_id', stueck.id)
      .eq('status', 'abgeschlossen')

    // Next probe
    const { data: naechsteProbe } = await supabase
      .from('proben')
      .select('datum')
      .eq('stueck_id', stueck.id)
      .gte('datum', today)
      .neq('status', 'abgesagt')
      .order('datum', { ascending: true })
      .limit(1)

    progress.push({
      stueck_id: stueck.id,
      stueck_titel: stueck.titel,
      rollen_total: rollenTotal || 0,
      rollen_besetzt: besetzteInStueck.length,
      naechste_auffuehrung: naechsteAuffuehrung?.[0]?.datum || null,
      schichten_total: schichtenTotal,
      schichten_besetzt: schichtenBesetzt,
      naechste_probe: naechsteProbe?.[0]?.datum || null,
      proben_total: probenTotal || 0,
      proben_abgeschlossen: probenAbgeschlossen || 0,
    })
  }

  return progress
}

// =============================================================================
// #349: Person Detail Data
// =============================================================================

/**
 * Get comprehensive detail data for a person
 */
export async function getPersonDetailData(
  personId: string
): Promise<PersonDetailData | null> {
  await requirePermission('mitglieder:read')

  const supabase = await createClient()

  // Get person
  const { data: person, error } = await supabase
    .from('personen')
    .select('*')
    .eq('id', personId)
    .single()

  if (error || !person) return null

  // Get besetzungen
  const { data: besetzungen } = await supabase
    .from('besetzungen')
    .select(`
      *,
      person:personen(id, vorname, nachname, email),
      rolle:rollen(id, name, typ, stueck:stuecke(id, titel))
    `)
    .eq('person_id', personId)

  type RawBesetzung = {
    id: string
    rolle_id: string
    person_id: string
    typ: string
    gueltig_von: string | null
    gueltig_bis: string | null
    notizen: string | null
    created_at: string
    updated_at: string
    person: { id: string; vorname: string; nachname: string; email: string | null }
    rolle: { id: string; name: string; typ: string; stueck: { id: string; titel: string } }
  }

  // Get assignments
  const assignments = await getPersonAssignments(personId)

  // Compute stats
  const stats = {
    total_besetzungen: (besetzungen || []).length,
    total_schichten: assignments.filter((a) => a.typ === 'schicht').length,
    total_proben: assignments.filter((a) => a.typ === 'probe').length,
    total_veranstaltungen: assignments.filter((a) => a.typ === 'veranstaltung').length,
  }

  return {
    person: person as Person,
    besetzungen: (besetzungen as unknown as RawBesetzung[])?.map((b) => ({
      ...b,
      rolle: { id: b.rolle.id, name: b.rolle.name, typ: b.rolle.typ, stueck: b.rolle.stueck },
    })) as unknown as BesetzungMitDetails[] || [],
    assignments,
    stats,
  }
}

// =============================================================================
// #350: Availability in Production Planning
// =============================================================================

/**
 * Get availability overview for all cast members of a production
 * Used in production planning to see who's available for upcoming events
 */
export async function getProductionAvailability(
  stueckId: string,
  datumVon: string,
  datumBis: string
): Promise<{
  members: {
    person_id: string
    vorname: string
    nachname: string
    rolle: string
    dates: { datum: string; status: VerfuegbarkeitStatus }[]
  }[]
}> {
  await requirePermission('stuecke:read')

  const supabase = await createClient()

  // Get all cast members for this stueck
  const { data: besetzungen } = await supabase
    .from('besetzungen')
    .select(`
      person_id,
      rolle:rollen(name),
      person:personen(id, vorname, nachname)
    `)
    .eq('rolle.stueck_id', stueckId)

  type BesetzungRaw = {
    person_id: string
    rolle: { name: string } | null
    person: { id: string; vorname: string; nachname: string } | null
  }

  const cast = (besetzungen as unknown as BesetzungRaw[]) || []
  if (cast.length === 0) return { members: [] }

  const personIds = [...new Set(cast.map((c) => c.person_id))]

  // Get all unavailability entries in the date range
  const { data: unavailable } = await supabase
    .from('verfuegbarkeiten')
    .select('mitglied_id, datum_von, datum_bis, status')
    .in('mitglied_id', personIds)
    .lte('datum_von', datumBis)
    .gte('datum_bis', datumVon)
    .in('status', ['nicht_verfuegbar', 'eingeschraenkt'])

  // Build date range
  const dates: string[] = []
  const start = new Date(datumVon)
  const end = new Date(datumBis)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }

  // Build member availability map
  type UnavailEntry = { mitglied_id: string; datum_von: string; datum_bis: string; status: string }
  const members = [...new Map(cast.map((c) => [c.person_id, c])).values()]
    .filter((c) => c.person)
    .map((c) => {
      const memberUnavailability = (unavailable as UnavailEntry[] || []).filter(
        (u: UnavailEntry) => u.mitglied_id === c.person_id
      )

      const dateStatuses = dates.map((datum) => {
        const matching = memberUnavailability.filter(
          (u: UnavailEntry) => u.datum_von <= datum && u.datum_bis >= datum
        )

        let status: VerfuegbarkeitStatus = 'verfuegbar'
        if (matching.some((m: UnavailEntry) => m.status === 'nicht_verfuegbar')) {
          status = 'nicht_verfuegbar'
        } else if (matching.some((m: UnavailEntry) => m.status === 'eingeschraenkt')) {
          status = 'eingeschraenkt'
        }

        return { datum, status }
      })

      return {
        person_id: c.person_id,
        vorname: c.person!.vorname,
        nachname: c.person!.nachname,
        rolle: c.rolle?.name || '',
        dates: dateStatuses,
      }
    })

  return { members }
}
