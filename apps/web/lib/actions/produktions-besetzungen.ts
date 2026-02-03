'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type {
  ProduktionsBesetzung,
  ProduktionsBesetzungInsert,
  ProduktionsBesetzungUpdate,
  ProduktionsBesetzungStatus,
  BesetzungTyp,
  StueckRolle,
  Person,
  RolleMitProduktionsBesetzungen,
} from '../supabase/types'

// =============================================================================
// Read Operations
// =============================================================================

export async function getProduktionsBesetzungen(
  produktionId: string
): Promise<ProduktionsBesetzung[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('produktions_besetzungen')
    .select('*')
    .eq('produktion_id', produktionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching produktions-besetzungen:', error)
    return []
  }

  return (data as ProduktionsBesetzung[]) || []
}

export async function getRollenMitProduktionsBesetzungen(
  produktionId: string,
  stueckId: string
): Promise<RolleMitProduktionsBesetzungen[]> {
  const supabase = await createClient()

  // Fetch roles for this Stück
  const { data: rollen, error: rollenError } = await supabase
    .from('rollen')
    .select('*')
    .eq('stueck_id', stueckId)
    .order('typ', { ascending: true })
    .order('name', { ascending: true })

  if (rollenError) {
    console.error('Error fetching rollen:', rollenError)
    return []
  }

  if (!rollen || rollen.length === 0) return []

  // Fetch besetzungen for this Produktion
  const { data: besetzungen, error: besetzungenError } = await supabase
    .from('produktions_besetzungen')
    .select('*')
    .eq('produktion_id', produktionId)

  if (besetzungenError) {
    console.error('Error fetching besetzungen:', besetzungenError)
    return []
  }

  // Fetch person details for all assigned people
  const personIds = (besetzungen || [])
    .map((b) => b.person_id)
    .filter((id): id is string => id !== null)
  const uniquePersonIds = [...new Set(personIds)]

  let personen: Pick<Person, 'id' | 'vorname' | 'nachname' | 'skills'>[] = []
  if (uniquePersonIds.length > 0) {
    const { data: personenData } = await supabase
      .from('personen')
      .select('id, vorname, nachname, skills')
      .in('id', uniquePersonIds)
    personen = (personenData as typeof personen) || []
  }

  const personenMap = new Map(personen.map((p) => [p.id, p]))

  // Group besetzungen by rolle
  return (rollen as StueckRolle[]).map((rolle) => ({
    ...rolle,
    besetzungen: (besetzungen || [])
      .filter((b) => b.rolle_id === rolle.id)
      .map((b) => ({
        ...(b as ProduktionsBesetzung),
        person: b.person_id ? personenMap.get(b.person_id) || null : null,
      })),
  }))
}

// =============================================================================
// Write Operations
// =============================================================================

export async function createProduktionsBesetzung(
  data: ProduktionsBesetzungInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('produktions_besetzungen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating produktions-besetzung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${data.produktion_id}`)
  return { success: true, id: result?.id }
}

export async function updateProduktionsBesetzung(
  id: string,
  data: ProduktionsBesetzungUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  // Fetch to get produktion_id for revalidation
  const { data: existing } = await supabase
    .from('produktions_besetzungen')
    .select('produktion_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('produktions_besetzungen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating produktions-besetzung:', error)
    return { success: false, error: error.message }
  }

  if (existing?.produktion_id) {
    revalidatePath(`/produktionen/${existing.produktion_id}`)
  }
  return { success: true }
}

export async function deleteProduktionsBesetzung(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  // Fetch to get produktion_id for revalidation
  const { data: existing } = await supabase
    .from('produktions_besetzungen')
    .select('produktion_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('produktions_besetzungen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting produktions-besetzung:', error)
    return { success: false, error: error.message }
  }

  if (existing?.produktion_id) {
    revalidatePath(`/produktionen/${existing.produktion_id}`)
  }
  return { success: true }
}

// =============================================================================
// Init: Import roles from Stück as open entries
// =============================================================================

export async function initBesetzungenFromStueck(
  produktionId: string,
  stueckId: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  // Check if besetzungen already exist for this produktion
  const { count } = await supabase
    .from('produktions_besetzungen')
    .select('*', { count: 'exact', head: true })
    .eq('produktion_id', produktionId)

  if (count && count > 0) {
    return {
      success: false,
      error: 'Besetzungen für diese Produktion existieren bereits.',
    }
  }

  // Get all roles from the Stück
  const { data: rollen, error: rollenError } = await supabase
    .from('rollen')
    .select('id')
    .eq('stueck_id', stueckId)

  if (rollenError) {
    console.error('Error fetching rollen:', rollenError)
    return { success: false, error: rollenError.message }
  }

  if (!rollen || rollen.length === 0) {
    return { success: false, error: 'Keine Rollen im Stück vorhanden.' }
  }

  // Optionally pull existing Stück-level besetzungen as vorgemerkt
  const { data: stueckBesetzungen } = await supabase
    .from('besetzungen')
    .select('rolle_id, person_id, typ')
    .in(
      'rolle_id',
      rollen.map((r) => r.id)
    )

  const inserts: ProduktionsBesetzungInsert[] = []

  for (const rolle of rollen) {
    const existing = (stueckBesetzungen || []).filter(
      (b) => b.rolle_id === rolle.id
    )

    if (existing.length > 0) {
      // Import existing Stück besetzungen as vorgemerkt
      for (const b of existing) {
        inserts.push({
          produktion_id: produktionId,
          rolle_id: rolle.id,
          person_id: b.person_id,
          typ: b.typ as BesetzungTyp,
          status: 'vorgemerkt' as ProduktionsBesetzungStatus,
          notizen: null,
        })
      }
    } else {
      // Create open entry for uncast roles
      inserts.push({
        produktion_id: produktionId,
        rolle_id: rolle.id,
        person_id: null,
        typ: 'hauptbesetzung' as BesetzungTyp,
        status: 'offen' as ProduktionsBesetzungStatus,
        notizen: null,
      })
    }
  }

  const { error } = await supabase
    .from('produktions_besetzungen')
    .insert(inserts as never)

  if (error) {
    console.error('Error initializing besetzungen:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${produktionId}`)
  return { success: true, count: inserts.length }
}

// =============================================================================
// Casting Suggestions (Skills-based)
// =============================================================================

export type BesetzungsVorschlag = {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'skills'>
  matchingSkills: string[]
  hatKonflikt: boolean
  konfliktRolle: string | null
}

export async function getBesetzungsVorschlaege(
  produktionId: string,
  rolleId: string
): Promise<BesetzungsVorschlag[]> {
  const supabase = await createClient()

  // Get the role details
  const { data: rolle } = await supabase
    .from('rollen')
    .select('id, name, typ, beschreibung')
    .eq('id', rolleId)
    .single()

  if (!rolle) return []

  // Get active personen with skills
  const { data: personen } = await supabase
    .from('personen')
    .select('id, vorname, nachname, skills')
    .eq('aktiv', true)
    .order('nachname', { ascending: true })

  if (!personen || personen.length === 0) return []

  // Get existing besetzungen for this produktion to detect conflicts
  const { data: existingBesetzungen } = await supabase
    .from('produktions_besetzungen')
    .select('person_id, rolle_id')
    .eq('produktion_id', produktionId)
    .not('status', 'eq', 'abgesagt')

  // Get role names for conflict display
  const besetzteRollenIds = [
    ...new Set(
      (existingBesetzungen || [])
        .filter((b) => b.person_id)
        .map((b) => b.rolle_id)
    ),
  ]
  let rollenMap = new Map<string, string>()
  if (besetzteRollenIds.length > 0) {
    const { data: rollenData } = await supabase
      .from('rollen')
      .select('id, name')
      .in('id', besetzteRollenIds)
    if (rollenData) {
      rollenMap = new Map(rollenData.map((r) => [r.id, r.name]))
    }
  }

  // Build relevance keywords from role name, type, and description
  const keywords = [
    rolle.name.toLowerCase(),
    rolle.typ,
    ...(rolle.beschreibung || '').toLowerCase().split(/\s+/),
  ].filter(Boolean)

  // Score and rank personen
  const vorschlaege: BesetzungsVorschlag[] = (
    personen as Pick<Person, 'id' | 'vorname' | 'nachname' | 'skills'>[]
  ).map((person) => {
    const personSkills = (person.skills || []).map((s) => s.toLowerCase())
    const matchingSkills = (person.skills || []).filter((skill) =>
      keywords.some(
        (kw) =>
          skill.toLowerCase().includes(kw) || kw.includes(skill.toLowerCase())
      )
    )

    // Check if already cast in another role for this produktion
    const konflikt = (existingBesetzungen || []).find(
      (b) => b.person_id === person.id && b.rolle_id !== rolleId
    )
    const hatKonflikt = !!konflikt
    const konfliktRolle = konflikt
      ? rollenMap.get(konflikt.rolle_id) || null
      : null

    return {
      person,
      matchingSkills,
      hatKonflikt,
      konfliktRolle,
    }
  })

  // Sort: matching skills first, then no conflict, then alphabetically
  return vorschlaege.sort((a, b) => {
    if (a.matchingSkills.length !== b.matchingSkills.length) {
      return b.matchingSkills.length - a.matchingSkills.length
    }
    if (a.hatKonflikt !== b.hatKonflikt) {
      return a.hatKonflikt ? 1 : -1
    }
    return a.person.nachname.localeCompare(b.person.nachname)
  })
}
