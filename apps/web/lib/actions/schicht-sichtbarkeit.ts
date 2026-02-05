'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type { SchichtSichtbarkeit } from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type SichtbarkeitResult = {
  success: boolean
  error?: string
  updated?: number
}

// =============================================================================
// Single Schicht Updates
// =============================================================================

/**
 * Update visibility of a single shift
 */
export async function updateSchichtSichtbarkeit(
  schichtId: string,
  sichtbarkeit: SchichtSichtbarkeit
): Promise<SichtbarkeitResult> {
  await requirePermission('helferliste:write')

  const supabase = await createClient()

  // Get veranstaltung_id for path revalidation
  const { data: schicht, error: fetchError } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', schichtId)
    .single()

  if (fetchError || !schicht) {
    console.error('Error fetching schicht:', fetchError)
    return { success: false, error: 'Schicht nicht gefunden' }
  }

  const { error: updateError } = await supabase
    .from('auffuehrung_schichten')
    .update({ sichtbarkeit } as never)
    .eq('id', schichtId)

  if (updateError) {
    console.error('Error updating sichtbarkeit:', updateError)
    return { success: false, error: 'Fehler beim Aktualisieren der Sichtbarkeit' }
  }

  revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}`)
  revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/helferliste`)
  revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/schichten`)

  return { success: true, updated: 1 }
}

// =============================================================================
// Bulk Updates
// =============================================================================

/**
 * Update visibility for multiple shifts at once
 */
export async function bulkUpdateSichtbarkeit(
  schichtIds: string[],
  sichtbarkeit: SchichtSichtbarkeit
): Promise<SichtbarkeitResult> {
  await requirePermission('helferliste:write')

  if (schichtIds.length === 0) {
    return { success: false, error: 'Keine Schichten ausgewählt' }
  }

  const supabase = await createClient()

  // Get all affected veranstaltung_ids for revalidation
  const { data: schichten, error: fetchError } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .in('id', schichtIds)

  if (fetchError) {
    console.error('Error fetching schichten:', fetchError)
    return { success: false, error: 'Fehler beim Laden der Schichten' }
  }

  const { error: updateError } = await supabase
    .from('auffuehrung_schichten')
    .update({ sichtbarkeit } as never)
    .in('id', schichtIds)

  if (updateError) {
    console.error('Error bulk updating sichtbarkeit:', updateError)
    return { success: false, error: 'Fehler beim Aktualisieren der Sichtbarkeit' }
  }

  // Revalidate all affected veranstaltungen
  const veranstaltungIds = [...new Set(schichten?.map(s => s.veranstaltung_id) || [])]
  for (const vId of veranstaltungIds) {
    revalidatePath(`/auffuehrungen/${vId}`)
    revalidatePath(`/auffuehrungen/${vId}/helferliste`)
    revalidatePath(`/auffuehrungen/${vId}/schichten`)
  }

  return { success: true, updated: schichtIds.length }
}

/**
 * Set all shifts of a veranstaltung to a specific visibility
 */
export async function setAllSchichtenSichtbarkeit(
  veranstaltungId: string,
  sichtbarkeit: SchichtSichtbarkeit
): Promise<SichtbarkeitResult> {
  await requirePermission('helferliste:write')

  const supabase = await createClient()

  // First count existing schichten
  const { count: totalCount } = await supabase
    .from('auffuehrung_schichten')
    .select('id', { count: 'exact', head: true })
    .eq('veranstaltung_id', veranstaltungId)

  const { error: updateError } = await supabase
    .from('auffuehrung_schichten')
    .update({ sichtbarkeit } as never)
    .eq('veranstaltung_id', veranstaltungId)

  if (updateError) {
    console.error('Error setting all schichten sichtbarkeit:', updateError)
    return { success: false, error: 'Fehler beim Aktualisieren der Sichtbarkeit' }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}/helferliste`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}/schichten`)

  return { success: true, updated: totalCount ?? 0 }
}

// =============================================================================
// Query Helpers
// =============================================================================

/**
 * Get visibility statistics for a veranstaltung
 */
export async function getSchichtSichtbarkeitStats(
  veranstaltungId: string
): Promise<{ intern: number; public: number; total: number }> {
  const supabase = await createClient()

  const { data: schichten, error } = await supabase
    .from('auffuehrung_schichten')
    .select('id, sichtbarkeit')
    .eq('veranstaltung_id', veranstaltungId)

  if (error || !schichten) {
    console.error('Error fetching schichten stats:', error)
    return { intern: 0, public: 0, total: 0 }
  }

  const intern = schichten.filter(s => s.sichtbarkeit === 'intern').length
  const publicCount = schichten.filter(s => s.sichtbarkeit === 'public').length

  return {
    intern,
    public: publicCount,
    total: schichten.length,
  }
}

/**
 * Check if changing visibility would affect external registrations
 */
export async function checkExternalRegistrationsForSchicht(
  schichtId: string
): Promise<{ hasExternalRegistrations: boolean; count: number }> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id', { count: 'exact', head: true })
    .eq('schicht_id', schichtId)
    .not('external_helper_id', 'is', null)

  if (error) {
    console.error('Error checking external registrations:', error)
    return { hasExternalRegistrations: false, count: 0 }
  }

  return {
    hasExternalRegistrations: (count ?? 0) > 0,
    count: count ?? 0,
  }
}
