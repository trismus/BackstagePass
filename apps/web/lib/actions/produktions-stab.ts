'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type {
  ProduktionsStab,
  ProduktionsStabInsert,
  ProduktionsStabUpdate,
  StabFunktion,
  StabMitgliedMitDetails,
} from '../supabase/types'

// =============================================================================
// Stab-Funktionen (Lookup)
// =============================================================================

export async function getStabFunktionen(): Promise<StabFunktion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stab_funktionen')
    .select('*')
    .eq('aktiv', true)
    .order('sortierung', { ascending: true })

  if (error) {
    console.error('Error fetching stab funktionen:', error)
    return []
  }

  return (data as StabFunktion[]) || []
}

// =============================================================================
// Produktions-Stab (Team Members)
// =============================================================================

export async function getProduktionsStab(
  produktionId: string
): Promise<StabMitgliedMitDetails[]> {
  const supabase = await createClient()

  // Fetch stab entries
  const { data: stab, error } = await supabase
    .from('produktions_stab')
    .select('*')
    .eq('produktion_id', produktionId)
    .order('funktion', { ascending: true })

  if (error) {
    console.error('Error fetching produktions-stab:', error)
    return []
  }

  if (!stab || stab.length === 0) return []

  // Fetch person details for assigned people
  const personIds = stab
    .map((s) => s.person_id)
    .filter((id): id is string => id !== null)
  const uniquePersonIds = [...new Set(personIds)]

  let personenMap = new Map<
    string,
    { id: string; vorname: string; nachname: string; email: string | null }
  >()

  if (uniquePersonIds.length > 0) {
    const { data: personen } = await supabase
      .from('personen')
      .select('id, vorname, nachname, email')
      .in('id', uniquePersonIds)

    if (personen) {
      personenMap = new Map(personen.map((p) => [p.id, p]))
    }
  }

  return (stab as ProduktionsStab[]).map((s) => ({
    ...s,
    person: s.person_id ? personenMap.get(s.person_id) || null : null,
  }))
}

export async function createStabMitglied(
  data: ProduktionsStabInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('produktions_stab')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating stab mitglied:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${data.produktion_id}`)
  return { success: true, id: result?.id }
}

export async function updateStabMitglied(
  id: string,
  data: ProduktionsStabUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('produktions_stab')
    .select('produktion_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('produktions_stab')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating stab mitglied:', error)
    return { success: false, error: error.message }
  }

  if (existing?.produktion_id) {
    revalidatePath(`/produktionen/${existing.produktion_id}`)
  }
  return { success: true }
}

export async function deleteStabMitglied(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('produktions_stab')
    .select('produktion_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('produktions_stab')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting stab mitglied:', error)
    return { success: false, error: error.message }
  }

  if (existing?.produktion_id) {
    revalidatePath(`/produktionen/${existing.produktion_id}`)
  }
  return { success: true }
}
