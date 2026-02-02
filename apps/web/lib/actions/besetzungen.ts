'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type {
  Besetzung,
  BesetzungInsert,
  BesetzungUpdate,
  BesetzungMitDetails,
  RolleMitBesetzungen,
  PersonMitRollen,
  BesetzungHistorie,
  UnbesetzteRolle,
  RollenTyp,
} from '../supabase/types'

// =============================================================================
// Besetzungen CRUD
// =============================================================================

/**
 * Get all Besetzungen for a Stück
 */
export async function getBesetzungenForStueck(
  stueckId: string
): Promise<BesetzungMitDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('besetzungen')
    .select(
      `
      *,
      person:personen(id, vorname, nachname, email),
      rolle:rollen!inner(id, name, typ, stueck_id, stueck:stuecke(id, titel))
    `
    )
    .eq('rolle.stueck_id', stueckId)
    .order('rolle(name)', { ascending: true })

  if (error) {
    console.error('Error fetching besetzungen:', error)
    return []
  }

  type RawBesetzung = Besetzung & {
    person: { id: string; vorname: string; nachname: string; email: string | null }
    rolle: { id: string; name: string; typ: RollenTyp; stueck_id: string; stueck: { id: string; titel: string } }
  }
  return (
    (data as unknown as RawBesetzung[])?.map((d) => ({
      ...d,
      rolle: {
        id: d.rolle.id,
        name: d.rolle.name,
        typ: d.rolle.typ,
        stueck: d.rolle.stueck,
      },
    })) || []
  )
}

/**
 * Get all Besetzungen for a Rolle
 */
export async function getBesetzungenForRolle(
  rolleId: string
): Promise<
  (Besetzung & {
    person: {
      id: string
      vorname: string
      nachname: string
      email: string | null
    }
  })[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('besetzungen')
    .select(
      `
      *,
      person:personen(id, vorname, nachname, email)
    `
    )
    .eq('rolle_id', rolleId)
    .order('typ', { ascending: true })

  if (error) {
    console.error('Error fetching besetzungen for rolle:', error)
    return []
  }

  type BesetzungWithPerson = Besetzung & {
    person: { id: string; vorname: string; nachname: string; email: string | null }
  }
  return (data as unknown as BesetzungWithPerson[]) || []
}

/**
 * Get Rollen with their Besetzungen for a Stück
 */
export async function getRollenMitBesetzungen(
  stueckId: string
): Promise<RolleMitBesetzungen[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rollen')
    .select(
      `
      *,
      besetzungen(
        *,
        person:personen(id, vorname, nachname)
      )
    `
    )
    .eq('stueck_id', stueckId)
    .order('typ', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching rollen mit besetzungen:', error)
    return []
  }

  return (data as RolleMitBesetzungen[]) || []
}

/**
 * Get all Besetzungen for a Person
 */
export async function getBesetzungenForPerson(
  personId: string
): Promise<PersonMitRollen['besetzungen']> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('besetzungen')
    .select(
      `
      *,
      rolle:rollen(
        id, name, typ,
        stueck:stuecke(id, titel)
      )
    `
    )
    .eq('person_id', personId)

  if (error) {
    console.error('Error fetching besetzungen for person:', error)
    return []
  }

  return (data as unknown as PersonMitRollen['besetzungen']) || []
}

/**
 * Get a single Besetzung by ID
 */
export async function getBesetzung(id: string): Promise<Besetzung | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('besetzungen')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching besetzung:', error)
    return null
  }

  return data as Besetzung
}

/**
 * Create a new Besetzung
 */
export async function createBesetzung(
  data: BesetzungInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Besetzungen erstellen.',
    }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('besetzungen')
    .insert(data as never)
    .select('id, rolle:rollen(stueck_id)')
    .single()

  if (error) {
    console.error('Error creating besetzung:', error)
    return { success: false, error: error.message }
  }

  type CreateResult = { id: string; rolle: { stueck_id: string } | null }
  const typedResult = result as unknown as CreateResult | null
  const stueckId = typedResult?.rolle?.stueck_id
  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true, id: typedResult?.id }
}

/**
 * Update an existing Besetzung
 */
export async function updateBesetzung(
  id: string,
  data: BesetzungUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Besetzungen bearbeiten.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const besetzung = await getBesetzung(id)

  const { error } = await supabase
    .from('besetzungen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating besetzung:', error)
    return { success: false, error: error.message }
  }

  if (besetzung?.rolle_id) {
    const { data: rolle } = await supabase
      .from('rollen')
      .select('stueck_id')
      .eq('id', besetzung.rolle_id)
      .single()
    if (rolle?.stueck_id) {
      revalidatePath(`/stuecke/${rolle.stueck_id}`)
    }
  }
  return { success: true }
}

/**
 * Delete a Besetzung
 */
export async function deleteBesetzung(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'stuecke:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Besetzungen löschen.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation before delete
  const { data: besetzung } = await supabase
    .from('besetzungen')
    .select('rolle:rollen(stueck_id)')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('besetzungen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting besetzung:', error)
    return { success: false, error: error.message }
  }

  type BesetzungWithRolle = { rolle: { stueck_id: string } | null }
  const typedBesetzung = besetzung as unknown as BesetzungWithRolle | null
  const stueckId = typedBesetzung?.rolle?.stueck_id
  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

// =============================================================================
// Spezielle Abfragen
// =============================================================================

/**
 * Get unbesetzte Rollen (Rollen ohne Hauptbesetzung)
 */
export async function getUnbesetzteRollen(): Promise<UnbesetzteRolle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('unbesetzte_rollen').select('*')

  if (error) {
    console.error('Error fetching unbesetzte rollen:', error)
    return []
  }

  return (data as UnbesetzteRolle[]) || []
}

/**
 * Get Besetzungs-Historie for a Rolle
 */
export async function getBesetzungHistorie(
  rolleId: string
): Promise<
  (BesetzungHistorie & { person: { vorname: string; nachname: string } })[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('besetzungen_historie')
    .select(
      `
      *,
      person:personen(vorname, nachname)
    `
    )
    .eq('rolle_id', rolleId)
    .order('geaendert_am', { ascending: false })

  if (error) {
    console.error('Error fetching besetzung historie:', error)
    return []
  }

  type HistorieWithPerson = BesetzungHistorie & { person: { vorname: string; nachname: string } }
  return (data as unknown as HistorieWithPerson[]) || []
}

/**
 * Check if a Person is already cast in a Rolle
 */
export async function isPersonCast(
  rolleId: string,
  personId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('besetzungen')
    .select('*', { count: 'exact', head: true })
    .eq('rolle_id', rolleId)
    .eq('person_id', personId)

  if (error) {
    console.error('Error checking besetzung:', error)
    return false
  }

  return (count || 0) > 0
}

/**
 * Get Besetzungen for the current user (for "Mein Bereich") - Issue #193
 */
export async function getMeineBesetzungen(): Promise<BesetzungMitDetails[]> {
  const profile = await getUserProfile()

  if (!profile) {
    return []
  }

  const supabase = await createClient()

  // Find person by email
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return []
  }

  const { data, error } = await supabase
    .from('besetzungen')
    .select(
      `
      *,
      person:personen(id, vorname, nachname, email),
      rolle:rollen!inner(id, name, typ, stueck_id, stueck:stuecke(id, titel))
    `
    )
    .eq('person_id', person.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching meine besetzungen:', error)
    return []
  }

  type RawBesetzung = Besetzung & {
    person: { id: string; vorname: string; nachname: string; email: string | null }
    rolle: { id: string; name: string; typ: RollenTyp; stueck_id: string; stueck: { id: string; titel: string } }
  }

  return (data as unknown as RawBesetzung[]) || []
}
