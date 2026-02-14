'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type {
  Ressource,
  RessourceInsert,
  RessourceUpdate,
} from '../supabase/types'
import {
  ressourceSchema,
  ressourceUpdateSchema,
  validateInput,
} from '../validations/modul2'

/**
 * Get all resources
 */
export async function getRessourcen(): Promise<Ressource[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ressourcen')
    .select('id, name, kategorie, menge, beschreibung, aktiv, created_at, updated_at')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching ressourcen:', error)
    return []
  }

  return (data as Ressource[]) || []
}

/**
 * Get all active resources only
 */
export async function getAktiveRessourcen(): Promise<Ressource[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ressourcen')
    .select('id, name, kategorie, menge, beschreibung, aktiv, created_at, updated_at')
    .eq('aktiv', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching aktive ressourcen:', error)
    return []
  }

  return (data as Ressource[]) || []
}

/**
 * Get resources by category
 */
export async function getRessourcenByKategorie(
  kategorie: string
): Promise<Ressource[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ressourcen')
    .select('id, name, kategorie, menge, beschreibung, aktiv, created_at, updated_at')
    .eq('kategorie', kategorie)
    .eq('aktiv', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching ressourcen by kategorie:', error)
    return []
  }

  return (data as Ressource[]) || []
}

/**
 * Get a single resource by ID
 */
export async function getRessource(id: string): Promise<Ressource | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ressourcen')
    .select('id, name, kategorie, menge, beschreibung, aktiv, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching ressource:', error)
    return null
  }

  return data as Ressource
}

/**
 * Create a new resource
 * Requires ADMIN role (enforced by RLS)
 */
export async function createRessource(
  data: RessourceInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  // Validate input
  const validation = validateInput(ressourceSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('ressourcen')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating ressource:', error)
    return { success: false, error: 'Fehler beim Erstellen der Ressource' }
  }

  revalidatePath('/ressourcen')
  return { success: true, id: result?.id }
}

/**
 * Update an existing resource
 * Requires ADMIN role (enforced by RLS)
 */
export async function updateRessource(
  id: string,
  data: RessourceUpdate
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = validateInput(ressourceUpdateSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('ressourcen')
    .update(validation.data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating ressource:', error)
    return { success: false, error: 'Fehler beim Aktualisieren der Ressource' }
  }

  revalidatePath('/ressourcen')
  return { success: true }
}

/**
 * Delete a resource
 * Requires ADMIN role (enforced by RLS)
 */
export async function deleteRessource(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('ressourcen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting ressource:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/ressourcen')
  return { success: true }
}
