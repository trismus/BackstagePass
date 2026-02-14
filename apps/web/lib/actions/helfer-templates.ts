'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type {
  HelferRollenTemplate,
  HelferRollenTemplateInsert,
  HelferRollenTemplateUpdate,
} from '../supabase/types'

/**
 * Get all role templates
 */
export async function getHelferRollenTemplates(): Promise<
  HelferRollenTemplate[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('helfer_rollen_templates')
    .select('id, name, beschreibung, default_anzahl, created_at, updated_at')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching helfer rollen templates:', error)
    return []
  }

  return (data || []) as HelferRollenTemplate[]
}

/**
 * Get a single template by ID
 */
export async function getHelferRollenTemplate(
  id: string
): Promise<HelferRollenTemplate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('helfer_rollen_templates')
    .select('id, name, beschreibung, default_anzahl, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching helfer rollen template:', error)
    return null
  }

  return data as HelferRollenTemplate
}

/**
 * Create a new role template (management only - enforced by RLS)
 */
export async function createHelferRollenTemplate(
  data: HelferRollenTemplateInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('helfer_rollen_templates')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating helfer rollen template:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste/templates')
  return { success: true, id: result?.id }
}

/**
 * Update an existing role template (management only - enforced by RLS)
 */
export async function updateHelferRollenTemplate(
  id: string,
  data: HelferRollenTemplateUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('helfer_rollen_templates')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating helfer rollen template:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste/templates')
  revalidatePath(`/helferliste/templates/${id}`)
  return { success: true }
}

/**
 * Delete a role template (ADMIN only - enforced by RLS)
 */
export async function deleteHelferRollenTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('helfer_rollen_templates')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting helfer rollen template:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/helferliste/templates')
  return { success: true }
}
