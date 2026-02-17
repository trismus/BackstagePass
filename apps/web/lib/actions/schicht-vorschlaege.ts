'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { checkPersonConflicts } from './conflict-check'
import type { SchichtKandidat } from '../supabase/types'

/**
 * Suggest persons for a shift based on skill matching and conflict detection.
 * Issue #347: Skills-basierte Schicht-Vorschlaege
 *
 * Returns candidates sorted by skill match count (DESC), then nachname (ASC).
 * Top 20 candidates get conflict info checked.
 */
export async function suggestPersonenForSchicht(
  schichtId: string
): Promise<SchichtKandidat[]> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // 1. Fetch schicht with zeitblock and veranstaltung date
  const { data: schicht, error: schichtError } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      benoetigte_skills,
      zeitblock_id,
      veranstaltung_id
    `)
    .eq('id', schichtId)
    .single()

  if (schichtError || !schicht) {
    console.error('Error fetching schicht:', schichtError)
    return []
  }

  // Get veranstaltung datum for conflict checking
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('datum')
    .eq('id', schicht.veranstaltung_id)
    .single()

  // Get zeitblock times for conflict checking
  let startZeit: string | null = null
  let endZeit: string | null = null

  if (schicht.zeitblock_id && veranstaltung?.datum) {
    const { data: zeitblock } = await supabase
      .from('zeitbloecke')
      .select('startzeit, endzeit')
      .eq('id', schicht.zeitblock_id)
      .single()

    if (zeitblock) {
      startZeit = `${veranstaltung.datum} ${zeitblock.startzeit} Europe/Zurich`
      endZeit = `${veranstaltung.datum} ${zeitblock.endzeit} Europe/Zurich`
    }
  }

  const benoetigteSkills: string[] = schicht.benoetigte_skills ?? []

  // 2. Fetch active persons with skills
  const { data: personen, error: personenError } = await supabase
    .from('personen')
    .select('id, vorname, nachname, email, skills')
    .eq('aktiv', true)
    .order('nachname', { ascending: true })

  if (personenError || !personen) {
    console.error('Error fetching personen:', personenError)
    return []
  }

  // 3. Filter out already-assigned persons for this schicht
  const { data: zuweisungen } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('person_id')
    .eq('schicht_id', schichtId)

  const assignedPersonIds = new Set(
    (zuweisungen ?? []).map((z) => z.person_id).filter(Boolean)
  )

  const candidates = personen.filter((p) => !assignedPersonIds.has(p.id))

  // 4. Compute skill matches and sort
  const scored: SchichtKandidat[] = candidates.map((p) => {
    const personSkills: string[] = p.skills ?? []
    const matching = benoetigteSkills.filter((s) =>
      personSkills.some((ps) => ps.toLowerCase() === s.toLowerCase())
    )

    return {
      person_id: p.id,
      vorname: p.vorname,
      nachname: p.nachname,
      email: p.email,
      skills: personSkills,
      matching_skills: matching,
      match_count: matching.length,
      total_required: benoetigteSkills.length,
      has_conflicts: false,
      conflicts: [],
    }
  })

  // Sort: match_count DESC, then nachname ASC
  scored.sort((a, b) => {
    if (b.match_count !== a.match_count) return b.match_count - a.match_count
    return a.nachname.localeCompare(b.nachname)
  })

  // 5. Check conflicts for top 20 candidates (if time info available)
  const top20 = scored.slice(0, 20)

  if (startZeit && endZeit) {
    const conflictResults = await Promise.all(
      top20.map((c) =>
        checkPersonConflicts(c.person_id, startZeit!, endZeit!)
          .catch(() => ({ has_conflicts: false, conflicts: [] }))
      )
    )

    for (let i = 0; i < top20.length; i++) {
      top20[i] = {
        ...top20[i],
        has_conflicts: conflictResults[i].has_conflicts,
        conflicts: conflictResults[i].conflicts,
      }
    }
  }

  return top20
}
