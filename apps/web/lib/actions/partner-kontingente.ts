'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type {
  PartnerKontingent,
  PartnerKontingentInsert,
  PartnerKontingentUpdate,
  PartnerKontingentZuweisung,
  PartnerKontingentZuweisungInsert,
  PartnerKontingentUebersicht,
} from '../supabase/types'

// =============================================================================
// Partner Kontingente CRUD
// =============================================================================

export async function getPartnerKontingente(
  serieId?: string
): Promise<PartnerKontingent[]> {
  const supabase = await createClient()

  let query = supabase
    .from('partner_kontingente')
    .select('id, partner_id, serie_id, soll_stunden, notizen, created_at, updated_at')
    .order('created_at', { ascending: true })

  if (serieId) {
    query = query.eq('serie_id', serieId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching partner kontingente:', error)
    return []
  }

  return (data as PartnerKontingent[]) || []
}

export async function getPartnerKontingentById(
  id: string
): Promise<PartnerKontingent | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('partner_kontingente')
    .select('id, partner_id, serie_id, soll_stunden, notizen, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching partner kontingent:', error)
    return null
  }

  return data as PartnerKontingent
}

export async function createPartnerKontingent(
  data: PartnerKontingentInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('partner_kontingente')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating partner kontingent:', error)
    if (error.code === '23505') {
      return {
        success: false,
        error: 'Fuer diesen Partner existiert bereits ein Kontingent in dieser Serie.',
      }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  return { success: true, id: result?.id }
}

export async function updatePartnerKontingent(
  id: string,
  data: PartnerKontingentUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('partner_kontingente')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating partner kontingent:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  return { success: true }
}

export async function deletePartnerKontingent(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('partner_kontingente')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting partner kontingent:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  return { success: true }
}

// =============================================================================
// Partner Kontingent Zuweisungen
// =============================================================================

export async function getKontingentZuweisungen(
  kontingentId: string
): Promise<PartnerKontingentZuweisung[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('partner_kontingent_zuweisungen')
    .select('id, kontingent_id, zuweisung_id, stunden, created_at')
    .eq('kontingent_id', kontingentId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching kontingent zuweisungen:', error)
    return []
  }

  return (data as PartnerKontingentZuweisung[]) || []
}

export async function createKontingentZuweisung(
  data: PartnerKontingentZuweisungInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('partner_kontingent_zuweisungen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating kontingent zuweisung:', error)
    if (error.code === '23505') {
      return {
        success: false,
        error: 'Diese Zuweisung ist bereits einem Kontingent zugeordnet.',
      }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  return { success: true, id: result?.id }
}

export async function deleteKontingentZuweisung(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('partner_kontingent_zuweisungen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting kontingent zuweisung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  return { success: true }
}

// =============================================================================
// Uebersicht (Soll/Ist View)
// =============================================================================

export async function getKontingentUebersicht(
  serieId?: string,
  partnerId?: string
): Promise<PartnerKontingentUebersicht[]> {
  const supabase = await createClient()

  let query = supabase
    .from('partner_kontingent_uebersicht')
    .select('id, partner_id, partner_name, serie_id, serie_name, soll_stunden, ist_stunden, differenz, erfuellungsgrad, notizen')
    .order('partner_name', { ascending: true })

  if (serieId) {
    query = query.eq('serie_id', serieId)
  }

  if (partnerId) {
    query = query.eq('partner_id', partnerId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching kontingent uebersicht:', error)
    return []
  }

  return (data as PartnerKontingentUebersicht[]) || []
}

// =============================================================================
// Helper: Assign hours from zuweisung to kontingent
// =============================================================================

export async function addZuweisungToKontingent(
  kontingentId: string,
  zuweisungId: string,
  stunden: number
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  // Check if already assigned
  const { data: existing } = await supabase
    .from('partner_kontingent_zuweisungen')
    .select('id')
    .eq('kontingent_id', kontingentId)
    .eq('zuweisung_id', zuweisungId)
    .single()

  if (existing) {
    return {
      success: false,
      error: 'Diese Zuweisung ist bereits diesem Kontingent zugeordnet.',
    }
  }

  const { error } = await supabase
    .from('partner_kontingent_zuweisungen')
    .insert({
      kontingent_id: kontingentId,
      zuweisung_id: zuweisungId,
      stunden,
    } as never)

  if (error) {
    console.error('Error adding zuweisung to kontingent:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  return { success: true }
}
