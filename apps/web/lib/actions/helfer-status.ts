'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type { HelferStatus, Veranstaltung } from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type HelferStatusResult = {
  success: boolean
  error?: string
  token?: string
}

export type VeranstaltungMitHelferStatus = Pick<
  Veranstaltung,
  'id' | 'titel' | 'helfer_status' | 'public_helfer_token'
>

// =============================================================================
// Status Transitions
// =============================================================================

/**
 * Publish helper list (Entwurf -> Veroeffentlicht)
 *
 * - Generates public token if not already present
 * - Changes status to 'veroeffentlicht'
 * - Enables public registration
 */
export async function publishHelferliste(
  veranstaltungId: string
): Promise<HelferStatusResult> {
  await requirePermission('helferliste:write')

  const supabase = await createClient()

  // Get current state
  const { data: veranstaltung, error: fetchError } = await supabase
    .from('veranstaltungen')
    .select('id, helfer_status, public_helfer_token')
    .eq('id', veranstaltungId)
    .single()

  if (fetchError || !veranstaltung) {
    console.error('Error fetching veranstaltung:', fetchError)
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  // Validate transition
  if (veranstaltung.helfer_status === 'abgeschlossen') {
    return { success: false, error: 'Abgeschlossene Helferlisten können nicht erneut veröffentlicht werden' }
  }

  if (veranstaltung.helfer_status === 'veroeffentlicht') {
    return { success: false, error: 'Helferliste ist bereits veröffentlicht' }
  }

  // Generate token if not present
  let token = veranstaltung.public_helfer_token
  if (!token) {
    const { data: newToken, error: tokenError } = await supabase
      .rpc('generate_public_helfer_token', { p_veranstaltung_id: veranstaltungId })

    if (tokenError) {
      console.error('Error generating token:', tokenError)
      return { success: false, error: 'Fehler beim Generieren des öffentlichen Links' }
    }
    token = newToken
  }

  // Update status
  const { error: updateError } = await supabase
    .from('veranstaltungen')
    .update({
      helfer_status: 'veroeffentlicht' as HelferStatus,
      public_helfer_token: token,
    } as never)
    .eq('id', veranstaltungId)

  if (updateError) {
    console.error('Error updating helfer_status:', updateError)
    return { success: false, error: 'Fehler beim Veröffentlichen' }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}/helferliste`)

  return { success: true, token: token ?? undefined }
}

/**
 * Close helper list (Veroeffentlicht -> Abgeschlossen)
 *
 * - Prevents new registrations (internal and external)
 * - Existing registrations remain visible
 * - Cannot be undone (except by admin)
 */
export async function closeHelferliste(
  veranstaltungId: string
): Promise<HelferStatusResult> {
  await requirePermission('helferliste:write')

  const supabase = await createClient()

  // Get current state
  const { data: veranstaltung, error: fetchError } = await supabase
    .from('veranstaltungen')
    .select('id, helfer_status')
    .eq('id', veranstaltungId)
    .single()

  if (fetchError || !veranstaltung) {
    console.error('Error fetching veranstaltung:', fetchError)
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  // Validate transition
  if (veranstaltung.helfer_status === 'abgeschlossen') {
    return { success: false, error: 'Helferliste ist bereits abgeschlossen' }
  }

  if (veranstaltung.helfer_status === 'entwurf' || !veranstaltung.helfer_status) {
    return { success: false, error: 'Nur veröffentlichte Helferlisten können abgeschlossen werden' }
  }

  // Update status
  const { error: updateError } = await supabase
    .from('veranstaltungen')
    .update({ helfer_status: 'abgeschlossen' as HelferStatus } as never)
    .eq('id', veranstaltungId)

  if (updateError) {
    console.error('Error updating helfer_status:', updateError)
    return { success: false, error: 'Fehler beim Abschliessen' }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}/helferliste`)

  return { success: true }
}

/**
 * Reset helper list status (Admin only)
 *
 * - Allows admin to reopen a closed list
 * - Use with caution - should be rare
 */
export async function resetHelferStatus(
  veranstaltungId: string,
  newStatus: HelferStatus
): Promise<HelferStatusResult> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('veranstaltungen')
    .update({ helfer_status: newStatus } as never)
    .eq('id', veranstaltungId)

  if (updateError) {
    console.error('Error resetting helfer_status:', updateError)
    return { success: false, error: 'Fehler beim Zurücksetzen' }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}/helferliste`)

  return { success: true }
}

// =============================================================================
// Token Management
// =============================================================================

/**
 * Generate a new public token (invalidates old one)
 */
export async function regeneratePublicToken(
  veranstaltungId: string
): Promise<HelferStatusResult> {
  await requirePermission('helferliste:write')

  const supabase = await createClient()

  const { data: newToken, error: tokenError } = await supabase
    .rpc('generate_public_helfer_token', { p_veranstaltung_id: veranstaltungId })

  if (tokenError) {
    console.error('Error generating token:', tokenError)
    return { success: false, error: 'Fehler beim Generieren des neuen Links' }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}/helferliste`)

  return { success: true, token: newToken }
}

/**
 * Get public link URL for a veranstaltung
 */
export async function getPublicHelferLink(
  veranstaltungId: string
): Promise<{ url: string | null; status: HelferStatus | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('veranstaltungen')
    .select('public_helfer_token, helfer_status')
    .eq('id', veranstaltungId)
    .single()

  if (error || !data?.public_helfer_token) {
    return { url: null, status: data?.helfer_status ?? null }
  }

  // Build URL based on environment
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = `${baseUrl}/helfer/anmeldung/${data.public_helfer_token}`

  return { url, status: data.helfer_status }
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Check if registration is allowed for a veranstaltung
 * Used by both internal and external registration flows
 */
export async function canRegisterForHelferliste(
  veranstaltungId: string,
  isExternal: boolean = false
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createClient()

  const { data: veranstaltung, error } = await supabase
    .from('veranstaltungen')
    .select('helfer_status, datum, helfer_buchung_deadline')
    .eq('id', veranstaltungId)
    .single()

  if (error || !veranstaltung) {
    return { allowed: false, reason: 'Veranstaltung nicht gefunden' }
  }

  // Check status
  if (veranstaltung.helfer_status === 'abgeschlossen') {
    return { allowed: false, reason: 'Die Anmeldung für diese Veranstaltung ist abgeschlossen' }
  }

  // External helpers need published status
  if (isExternal && veranstaltung.helfer_status !== 'veroeffentlicht') {
    return { allowed: false, reason: 'Diese Helferliste ist nicht öffentlich verfügbar' }
  }

  // Check if event date has passed
  const eventDate = new Date(veranstaltung.datum)
  if (eventDate < new Date()) {
    return { allowed: false, reason: 'Diese Veranstaltung hat bereits stattgefunden' }
  }

  // Check deadline
  if (veranstaltung.helfer_buchung_deadline) {
    const deadline = new Date(veranstaltung.helfer_buchung_deadline)
    if (deadline < new Date()) {
      return { allowed: false, reason: 'Die Anmeldefrist ist abgelaufen' }
    }
  }

  return { allowed: true }
}
