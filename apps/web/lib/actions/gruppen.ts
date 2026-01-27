'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/supabase/auth-helpers'
import type {
  Gruppe,
  GruppeInsert,
  GruppeUpdate,
  GruppeMitglied,
  GruppeMitgliedInsert,
  GruppeMitDetails,
  GruppeMitMitglieder,
} from '@/lib/supabase/types'

// =============================================================================
// Gruppen CRUD
// =============================================================================

export async function getGruppen(): Promise<GruppeMitDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gruppen')
    .select(
      `
      *,
      stueck:stuecke(id, titel),
      gruppen_mitglieder(id)
    `
    )
    .order('name')

  if (error) {
    console.error('Error fetching gruppen:', error)
    return []
  }

  return (data || []).map((gruppe) => ({
    ...gruppe,
    stueck: gruppe.stueck || null,
    mitglieder_count: gruppe.gruppen_mitglieder?.length || 0,
  }))
}

export async function getGruppeById(id: string): Promise<GruppeMitMitglieder | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gruppen')
    .select(
      `
      *,
      stueck:stuecke(id, titel),
      mitglieder:gruppen_mitglieder(
        id,
        person_id,
        rolle_in_gruppe,
        von,
        bis,
        created_at,
        gruppe_id,
        person:personen(id, vorname, nachname, email)
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching gruppe:', error)
    return null
  }

  return data as GruppeMitMitglieder
}

export async function createGruppe(
  data: GruppeInsert
): Promise<{ success: boolean; error?: string; gruppe?: Gruppe }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  const { data: gruppe, error } = await supabase
    .from('gruppen')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating gruppe:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/gruppen')
  return { success: true, gruppe }
}

export async function updateGruppe(
  id: string,
  data: GruppeUpdate
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  const { error } = await supabase.from('gruppen').update(data).eq('id', id)

  if (error) {
    console.error('Error updating gruppe:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/gruppen')
  revalidatePath(`/admin/gruppen/${id}`)
  return { success: true }
}

export async function deleteGruppe(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('admin:access')
  const supabase = await createClient()

  const { error } = await supabase.from('gruppen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting gruppe:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/gruppen')
  return { success: true }
}

// =============================================================================
// Gruppen-Mitglieder CRUD
// =============================================================================

export async function addGruppeMitglied(
  data: GruppeMitgliedInsert
): Promise<{ success: boolean; error?: string; mitglied?: GruppeMitglied }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  const { data: mitglied, error } = await supabase
    .from('gruppen_mitglieder')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error adding gruppe mitglied:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/gruppen')
  revalidatePath(`/admin/gruppen/${data.gruppe_id}`)
  return { success: true, mitglied }
}

export async function updateGruppeMitglied(
  id: string,
  data: Partial<GruppeMitgliedInsert>
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  const { error } = await supabase
    .from('gruppen_mitglieder')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating gruppe mitglied:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/gruppen')
  return { success: true }
}

export async function removeGruppeMitglied(
  id: string,
  gruppeId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  const { error } = await supabase
    .from('gruppen_mitglieder')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing gruppe mitglied:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/gruppen')
  revalidatePath(`/admin/gruppen/${gruppeId}`)
  return { success: true }
}

// =============================================================================
// Helper Functions
// =============================================================================

export async function getGruppenByTyp(typ: Gruppe['typ']): Promise<GruppeMitDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gruppen')
    .select(
      `
      *,
      stueck:stuecke(id, titel),
      gruppen_mitglieder(id)
    `
    )
    .eq('typ', typ)
    .eq('aktiv', true)
    .order('name')

  if (error) {
    console.error('Error fetching gruppen by typ:', error)
    return []
  }

  return (data || []).map((gruppe) => ({
    ...gruppe,
    stueck: gruppe.stueck || null,
    mitglieder_count: gruppe.gruppen_mitglieder?.length || 0,
  }))
}

export async function getGruppenForPerson(
  personId: string
): Promise<(GruppeMitglied & { gruppe: Gruppe })[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gruppen_mitglieder')
    .select(
      `
      *,
      gruppe:gruppen(*)
    `
    )
    .eq('person_id', personId)
    .is('bis', null) // Nur aktive Mitgliedschaften

  if (error) {
    console.error('Error fetching gruppen for person:', error)
    return []
  }

  return data as (GruppeMitglied & { gruppe: Gruppe })[]
}
