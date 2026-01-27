'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type {
  Stueck,
  StueckInsert,
  StueckUpdate,
  Szene,
  SzeneInsert,
  SzeneUpdate,
  StueckRolle,
  StueckRolleInsert,
  StueckRolleUpdate,
  SzeneRolle,
  SzeneRolleInsert,
} from '../supabase/types'

// =============================================================================
// Stücke
// =============================================================================

/**
 * Get all Stücke
 */
export async function getStuecke(): Promise<Stueck[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stuecke')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching stuecke:', error)
    return []
  }

  return (data as Stueck[]) || []
}

/**
 * Get active Stücke (not archived)
 */
export async function getActiveStuecke(): Promise<Stueck[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stuecke')
    .select('*')
    .neq('status', 'archiviert')
    .order('premiere_datum', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching active stuecke:', error)
    return []
  }

  return (data as Stueck[]) || []
}

/**
 * Get a single Stück by ID
 */
export async function getStueck(id: string): Promise<Stueck | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stuecke')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching stueck:', error)
    return null
  }

  return data as Stueck
}

/**
 * Create a new Stück
 */
export async function createStueck(
  data: StueckInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('stuecke')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating stueck:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/stuecke')
  return { success: true, id: result?.id }
}

/**
 * Update an existing Stück
 */
export async function updateStueck(
  id: string,
  data: StueckUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('stuecke')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating stueck:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/stuecke')
  revalidatePath(`/stuecke/${id}`)
  return { success: true }
}

/**
 * Delete a Stück
 */
export async function deleteStueck(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('stuecke').delete().eq('id', id)

  if (error) {
    console.error('Error deleting stueck:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/stuecke')
  return { success: true }
}

// =============================================================================
// Szenen
// =============================================================================

/**
 * Get all Szenen for a Stück
 */
export async function getSzenen(stueckId: string): Promise<Szene[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('szenen')
    .select('*')
    .eq('stueck_id', stueckId)
    .order('nummer', { ascending: true })

  if (error) {
    console.error('Error fetching szenen:', error)
    return []
  }

  return (data as Szene[]) || []
}

/**
 * Get a single Szene by ID
 */
export async function getSzene(id: string): Promise<Szene | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('szenen')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching szene:', error)
    return null
  }

  return data as Szene
}

/**
 * Create a new Szene
 */
export async function createSzene(
  data: SzeneInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('szenen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating szene:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stuecke/${data.stueck_id}`)
  return { success: true, id: result?.id }
}

/**
 * Update an existing Szene
 */
export async function updateSzene(
  id: string,
  data: SzeneUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get stueck_id for revalidation
  const szene = await getSzene(id)
  const stueckId = szene?.stueck_id

  const { error } = await supabase
    .from('szenen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating szene:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

/**
 * Delete a Szene
 */
export async function deleteSzene(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get stueck_id for revalidation
  const szene = await getSzene(id)
  const stueckId = szene?.stueck_id

  const { error } = await supabase.from('szenen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting szene:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

/**
 * Get the next scene number for a Stück
 */
export async function getNextSzeneNummer(stueckId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('szenen')
    .select('nummer')
    .eq('stueck_id', stueckId)
    .order('nummer', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return 1
  }

  return (data[0].nummer as number) + 1
}

// =============================================================================
// Rollen (Theaterrollen)
// =============================================================================

/**
 * Get all Rollen for a Stück
 */
export async function getRollen(stueckId: string): Promise<StueckRolle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rollen')
    .select('*')
    .eq('stueck_id', stueckId)
    .order('typ', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching rollen:', error)
    return []
  }

  return (data as StueckRolle[]) || []
}

/**
 * Get a single Rolle by ID
 */
export async function getRolle(id: string): Promise<StueckRolle | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rollen')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching rolle:', error)
    return null
  }

  return data as StueckRolle
}

/**
 * Create a new Rolle
 */
export async function createRolle(
  data: StueckRolleInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('rollen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating rolle:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stuecke/${data.stueck_id}`)
  return { success: true, id: result?.id }
}

/**
 * Update an existing Rolle
 */
export async function updateRolle(
  id: string,
  data: StueckRolleUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get stueck_id for revalidation
  const rolle = await getRolle(id)
  const stueckId = rolle?.stueck_id

  const { error } = await supabase
    .from('rollen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating rolle:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

/**
 * Delete a Rolle
 */
export async function deleteRolle(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get stueck_id for revalidation
  const rolle = await getRolle(id)
  const stueckId = rolle?.stueck_id

  const { error } = await supabase.from('rollen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting rolle:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

// =============================================================================
// Szenen-Rollen Verknüpfung
// =============================================================================

/**
 * Get all Szenen-Rollen assignments for a Stück
 */
export async function getSzenenRollen(stueckId: string): Promise<SzeneRolle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('szenen_rollen')
    .select(
      `
      *,
      szene:szenen!inner(stueck_id)
    `
    )
    .eq('szene.stueck_id', stueckId)

  if (error) {
    console.error('Error fetching szenen_rollen:', error)
    return []
  }

  return (data as SzeneRolle[]) || []
}

/**
 * Get Rollen for a specific Szene
 */
export async function getRollenForSzene(
  szeneId: string
): Promise<StueckRolle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('szenen_rollen')
    .select(
      `
      rolle:rollen(*)
    `
    )
    .eq('szene_id', szeneId)

  if (error) {
    console.error('Error fetching rollen for szene:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data?.map((d: any) => d.rolle).filter(Boolean) as StueckRolle[]) || []
}

/**
 * Add a Rolle to a Szene
 */
export async function addRolleToSzene(
  data: SzeneRolleInsert
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('szenen_rollen').insert(data as never)

  if (error) {
    console.error('Error adding rolle to szene:', error)
    return { success: false, error: error.message }
  }

  // Get stueck_id for revalidation
  const szene = await getSzene(data.szene_id)
  if (szene?.stueck_id) {
    revalidatePath(`/stuecke/${szene.stueck_id}`)
  }
  return { success: true }
}

/**
 * Remove a Rolle from a Szene
 */
export async function removeRolleFromSzene(
  szeneId: string,
  rolleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get stueck_id for revalidation
  const szene = await getSzene(szeneId)
  const stueckId = szene?.stueck_id

  const { error } = await supabase
    .from('szenen_rollen')
    .delete()
    .eq('szene_id', szeneId)
    .eq('rolle_id', rolleId)

  if (error) {
    console.error('Error removing rolle from szene:', error)
    return { success: false, error: error.message }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}

/**
 * Update all Rollen for a Szene (replace all assignments)
 */
export async function updateSzeneRollen(
  szeneId: string,
  rollenIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get stueck_id for revalidation
  const szene = await getSzene(szeneId)
  const stueckId = szene?.stueck_id

  // Delete all existing assignments
  const { error: deleteError } = await supabase
    .from('szenen_rollen')
    .delete()
    .eq('szene_id', szeneId)

  if (deleteError) {
    console.error('Error deleting szenen_rollen:', deleteError)
    return { success: false, error: deleteError.message }
  }

  // Insert new assignments
  if (rollenIds.length > 0) {
    const inserts = rollenIds.map((rolleId) => ({
      szene_id: szeneId,
      rolle_id: rolleId,
    }))

    const { error: insertError } = await supabase
      .from('szenen_rollen')
      .insert(inserts as never)

    if (insertError) {
      console.error('Error inserting szenen_rollen:', insertError)
      return { success: false, error: insertError.message }
    }
  }

  if (stueckId) {
    revalidatePath(`/stuecke/${stueckId}`)
  }
  return { success: true }
}
