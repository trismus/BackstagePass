'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/supabase/auth-helpers'
import type {
  Vereinsrolle,
  VereinsrolleInsert,
  VereinsrolleUpdate,
  MitgliedRolleInsert,
  MitgliedRolleMitDetails,
} from '@/lib/supabase/types'

// =============================================================================
// Vereinsrollen CRUD
// =============================================================================

export async function getVereinsrollen(): Promise<Vereinsrolle[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vereinsrollen')
    .select('*')
    .eq('aktiv', true)
    .order('sortierung', { ascending: true })

  if (error) {
    console.error('Error fetching vereinsrollen:', error)
    return []
  }

  return data || []
}

export async function getVereinsrolleById(
  id: string
): Promise<Vereinsrolle | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vereinsrollen')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vereinsrolle:', error)
    return null
  }

  return data
}

export async function createVereinsrolle(
  data: VereinsrolleInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  const { data: newRolle, error } = await supabase
    .from('vereinsrollen')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating vereinsrolle:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  return { success: true, id: newRolle.id }
}

export async function updateVereinsrolle(
  id: string,
  data: VereinsrolleUpdate
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  const { error } = await supabase
    .from('vereinsrollen')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating vereinsrolle:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  return { success: true }
}

export async function deleteVereinsrolle(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  // Soft delete by setting aktiv to false
  const { error } = await supabase
    .from('vereinsrollen')
    .update({ aktiv: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting vereinsrolle:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  return { success: true }
}

// =============================================================================
// Mitglied-Rollen Zuordnungen
// =============================================================================

export async function getMitgliedRollen(
  mitgliedId: string
): Promise<MitgliedRolleMitDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mitglied_rollen')
    .select(
      `
      *,
      vereinsrolle:vereinsrollen(id, name, farbe)
    `
    )
    .eq('mitglied_id', mitgliedId)
    .order('ist_primaer', { ascending: false })
    .order('gueltig_von', { ascending: false })

  if (error) {
    console.error('Error fetching mitglied rollen:', error)
    return []
  }

  // Transform nested array to single object
  return (data || []).map((item) => ({
    ...item,
    vereinsrolle: Array.isArray(item.vereinsrolle)
      ? item.vereinsrolle[0]
      : item.vereinsrolle,
  })) as MitgliedRolleMitDetails[]
}

export async function getAktiveMitgliedRollen(
  mitgliedId: string
): Promise<MitgliedRolleMitDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mitglied_rollen')
    .select(
      `
      *,
      vereinsrolle:vereinsrollen(id, name, farbe)
    `
    )
    .eq('mitglied_id', mitgliedId)
    .is('gueltig_bis', null)
    .order('ist_primaer', { ascending: false })

  if (error) {
    console.error('Error fetching active mitglied rollen:', error)
    return []
  }

  return (data || []).map((item) => ({
    ...item,
    vereinsrolle: Array.isArray(item.vereinsrolle)
      ? item.vereinsrolle[0]
      : item.vereinsrolle,
  })) as MitgliedRolleMitDetails[]
}

export async function addMitgliedRolle(
  data: MitgliedRolleInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  // If this is set as primary, unset other primary roles for this member
  if (data.ist_primaer) {
    await supabase
      .from('mitglied_rollen')
      .update({ ist_primaer: false })
      .eq('mitglied_id', data.mitglied_id)
      .is('gueltig_bis', null)
  }

  const { data: newRole, error } = await supabase
    .from('mitglied_rollen')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error adding mitglied rolle:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  return { success: true, id: newRole.id }
}

export async function updateMitgliedRolle(
  id: string,
  data: Partial<MitgliedRolleInsert>
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  // If setting as primary, get the mitglied_id first
  if (data.ist_primaer) {
    const { data: existing } = await supabase
      .from('mitglied_rollen')
      .select('mitglied_id')
      .eq('id', id)
      .single()

    if (existing) {
      // Unset other primary roles
      await supabase
        .from('mitglied_rollen')
        .update({ ist_primaer: false })
        .eq('mitglied_id', existing.mitglied_id)
        .is('gueltig_bis', null)
        .neq('id', id)
    }
  }

  const { error } = await supabase
    .from('mitglied_rollen')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating mitglied rolle:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  return { success: true }
}

export async function removeMitgliedRolle(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  // Soft remove by setting gueltig_bis to today
  const { error } = await supabase
    .from('mitglied_rollen')
    .update({ gueltig_bis: new Date().toISOString().split('T')[0] })
    .eq('id', id)

  if (error) {
    console.error('Error removing mitglied rolle:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  return { success: true }
}

export async function getMitgliederByRolle(
  rolleId: string
): Promise<{ mitglied_id: string; vorname: string; nachname: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mitglied_rollen')
    .select(
      `
      mitglied_id,
      person:personen(vorname, nachname)
    `
    )
    .eq('rolle_id', rolleId)
    .is('gueltig_bis', null)

  if (error) {
    console.error('Error fetching mitglieder by rolle:', error)
    return []
  }

  return (data || []).map((item) => {
    const person = Array.isArray(item.person) ? item.person[0] : item.person
    return {
      mitglied_id: item.mitglied_id,
      vorname: person?.vorname || '',
      nachname: person?.nachname || '',
    }
  })
}

// =============================================================================
// Rollen-Historie
// =============================================================================

export async function getMitgliedRollenHistorie(
  mitgliedId: string
): Promise<MitgliedRolleMitDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mitglied_rollen')
    .select(
      `
      *,
      vereinsrolle:vereinsrollen(id, name, farbe)
    `
    )
    .eq('mitglied_id', mitgliedId)
    .not('gueltig_bis', 'is', null)
    .order('gueltig_bis', { ascending: false })

  if (error) {
    console.error('Error fetching mitglied rollen historie:', error)
    return []
  }

  return (data || []).map((item) => ({
    ...item,
    vereinsrolle: Array.isArray(item.vereinsrolle)
      ? item.vereinsrolle[0]
      : item.vereinsrolle,
  })) as MitgliedRolleMitDetails[]
}
