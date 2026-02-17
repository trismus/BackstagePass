'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type { HelferFeedbackInsert, HelferFeedbackMitDetails } from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type FeedbackSubmitData = {
  zuweisungId: string
  feedbackToken: string
  rating: number
  feedbackPositiv: string | null
  feedbackVerbesserung: string | null
  wiederHelfen: boolean | null
}

export type FeedbackSummary = {
  total: number
  averageRating: number
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>
  wiederHelfenJa: number
  wiederHelfenNein: number
  recentFeedback: HelferFeedbackMitDetails[]
}

// =============================================================================
// Public Actions (no auth required)
// =============================================================================

/**
 * Submit feedback for a helper assignment
 * This is a public action - anyone with a valid feedback token can submit
 */
export async function submitHelferFeedback(
  data: FeedbackSubmitData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    return { success: false, error: 'Ungueltige Bewertung' }
  }

  // Validate feedback token matches zuweisung
  if (!data.feedbackToken) {
    return { success: false, error: 'Feedback-Token fehlt' }
  }

  const { data: zuweisung, error: zuweisungError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id, feedback_token')
    .eq('id', data.zuweisungId)
    .eq('feedback_token', data.feedbackToken)
    .single()

  if (zuweisungError || !zuweisung) {
    return { success: false, error: 'Ungültiger Feedback-Link' }
  }

  // Check if feedback already exists
  const { data: existingFeedback } = await supabase
    .from('helfer_feedback')
    .select('id')
    .eq('zuweisung_id', data.zuweisungId)
    .single()

  if (existingFeedback) {
    return { success: false, error: 'Feedback wurde bereits abgegeben' }
  }

  // Insert feedback
  const feedbackData: HelferFeedbackInsert = {
    zuweisung_id: data.zuweisungId,
    rating: data.rating,
    feedback_positiv: data.feedbackPositiv,
    feedback_verbesserung: data.feedbackVerbesserung,
    wieder_helfen: data.wiederHelfen,
  }

  const { error: insertError } = await supabase
    .from('helfer_feedback')
    .insert(feedbackData as never)

  if (insertError) {
    console.error('Error inserting feedback:', insertError)
    return { success: false, error: 'Fehler beim Speichern des Feedbacks' }
  }

  return { success: true }
}

// =============================================================================
// Admin Actions (auth required)
// =============================================================================

/**
 * Get feedback summary for a veranstaltung
 */
export async function getFeedbackSummary(
  veranstaltungId: string
): Promise<FeedbackSummary | null> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get all schicht IDs for this veranstaltung
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select('id')
    .eq('veranstaltung_id', veranstaltungId)

  if (!schichten || schichten.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      wiederHelfenJa: 0,
      wiederHelfenNein: 0,
      recentFeedback: [],
    }
  }

  const schichtIds = schichten.map((s) => s.id)

  // Get all zuweisungen for these schichten
  const { data: zuweisungen } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id')
    .in('schicht_id', schichtIds)

  if (!zuweisungen || zuweisungen.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      wiederHelfenJa: 0,
      wiederHelfenNein: 0,
      recentFeedback: [],
    }
  }

  const zuweisungIds = zuweisungen.map((z) => z.id)

  // Get all feedback for these zuweisungen
  const { data: feedbacks } = await supabase
    .from('helfer_feedback')
    .select(`
      *,
      zuweisung:auffuehrung_zuweisungen(
        id,
        person:personen(id, vorname, nachname),
        schicht:auffuehrung_schichten(rolle, veranstaltung_id)
      )
    `)
    .in('zuweisung_id', zuweisungIds)
    .order('created_at', { ascending: false })

  if (!feedbacks || feedbacks.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      wiederHelfenJa: 0,
      wiederHelfenNein: 0,
      recentFeedback: [],
    }
  }

  // Calculate statistics
  const total = feedbacks.length
  const sumRating = feedbacks.reduce((sum, f) => sum + f.rating, 0)
  const averageRating = Math.round((sumRating / total) * 10) / 10

  const ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  for (const f of feedbacks) {
    const r = f.rating as 1 | 2 | 3 | 4 | 5
    ratingDistribution[r]++
  }

  const wiederHelfenJa = feedbacks.filter((f) => f.wieder_helfen === true).length
  const wiederHelfenNein = feedbacks.filter((f) => f.wieder_helfen === false).length

  return {
    total,
    averageRating,
    ratingDistribution,
    wiederHelfenJa,
    wiederHelfenNein,
    recentFeedback: feedbacks.slice(0, 10) as unknown as HelferFeedbackMitDetails[],
  }
}

/**
 * Get all feedback for a veranstaltung
 */
export async function getAllFeedbackForVeranstaltung(
  veranstaltungId: string
): Promise<HelferFeedbackMitDetails[]> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get all schicht IDs
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select('id')
    .eq('veranstaltung_id', veranstaltungId)

  if (!schichten || schichten.length === 0) return []

  const schichtIds = schichten.map((s) => s.id)

  // Get all zuweisungen
  const { data: zuweisungen } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id')
    .in('schicht_id', schichtIds)

  if (!zuweisungen || zuweisungen.length === 0) return []

  const zuweisungIds = zuweisungen.map((z) => z.id)

  // Get feedback
  const { data: feedbacks } = await supabase
    .from('helfer_feedback')
    .select(`
      *,
      zuweisung:auffuehrung_zuweisungen(
        id,
        person:personen(id, vorname, nachname),
        schicht:auffuehrung_schichten(rolle, veranstaltung_id)
      )
    `)
    .in('zuweisung_id', zuweisungIds)
    .order('created_at', { ascending: false })

  return (feedbacks || []) as unknown as HelferFeedbackMitDetails[]
}
