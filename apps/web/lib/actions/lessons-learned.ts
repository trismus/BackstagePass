'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type {
  LessonsLearnedInsert,
  LessonsLearnedUpdate,
  LessonsLearnedMitDetails,
  LessonsLearnedStatus,
} from '../supabase/types'

// =============================================================================
// CRUD Operations
// =============================================================================

export async function getLessonsLearned(
  veranstaltungId: string
): Promise<LessonsLearnedMitDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons_learned')
    .select(`
      *,
      verantwortlich:personen(id, vorname, nachname),
      ersteller:profiles(id, email)
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .order('kategorie', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching lessons learned:', error)
    return []
  }

  return (data as unknown as LessonsLearnedMitDetails[]) || []
}

export async function getLessonById(
  id: string
): Promise<LessonsLearnedMitDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons_learned')
    .select(`
      *,
      verantwortlich:personen(id, vorname, nachname),
      ersteller:profiles(id, email)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching lesson:', error)
    return null
  }

  return data as unknown as LessonsLearnedMitDetails
}

export async function createLesson(
  data: Omit<LessonsLearnedInsert, 'erstellt_von'>
): Promise<{ success: boolean; error?: string; id?: string }> {
  await requirePermission('veranstaltungen:write')

  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  const insertData: LessonsLearnedInsert = {
    ...data,
    erstellt_von: profile.id,
  }

  const { data: result, error } = await supabase
    .from('lessons_learned')
    .insert(insertData as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating lesson:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/auffuehrungen/${data.veranstaltung_id}`)
  return { success: true, id: result?.id }
}

export async function updateLesson(
  id: string,
  data: LessonsLearnedUpdate
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get veranstaltung_id for revalidation
  const { data: existing } = await supabase
    .from('lessons_learned')
    .select('veranstaltung_id')
    .eq('id', id)
    .single()

  // If marking as erledigt, set timestamp
  const updateData: LessonsLearnedUpdate & { erledigt_am?: string | null } = { ...data }
  if (data.status === 'erledigt') {
    updateData.erledigt_am = new Date().toISOString()
  } else if (data.status) {
    // Any other status clears erledigt_am
    updateData.erledigt_am = null
  }

  const { error } = await supabase
    .from('lessons_learned')
    .update(updateData as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating lesson:', error)
    return { success: false, error: error.message }
  }

  if (existing?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${existing.veranstaltung_id}`)
  }
  return { success: true }
}

export async function deleteLesson(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get veranstaltung_id for revalidation
  const { data: existing } = await supabase
    .from('lessons_learned')
    .select('veranstaltung_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('lessons_learned')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting lesson:', error)
    return { success: false, error: error.message }
  }

  if (existing?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${existing.veranstaltung_id}`)
  }
  return { success: true }
}

// =============================================================================
// Status Transitions
// =============================================================================

export async function updateLessonStatus(
  id: string,
  status: LessonsLearnedStatus
): Promise<{ success: boolean; error?: string }> {
  return updateLesson(id, { status })
}

// =============================================================================
// Aggregated Views
// =============================================================================

export async function getLessonsLearnedSummary(
  veranstaltungId: string
): Promise<{
  positiv: number
  verbesserung: number
  problem: number
  idee: number
  offen: number
  erledigt: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons_learned')
    .select('kategorie, status')
    .eq('veranstaltung_id', veranstaltungId)

  if (error || !data) {
    return { positiv: 0, verbesserung: 0, problem: 0, idee: 0, offen: 0, erledigt: 0 }
  }

  return {
    positiv: data.filter((l) => l.kategorie === 'positiv').length,
    verbesserung: data.filter((l) => l.kategorie === 'verbesserung').length,
    problem: data.filter((l) => l.kategorie === 'problem').length,
    idee: data.filter((l) => l.kategorie === 'idee').length,
    offen: data.filter((l) => l.status === 'offen' || l.status === 'in_bearbeitung').length,
    erledigt: data.filter((l) => l.status === 'erledigt').length,
  }
}

// =============================================================================
// Cross-Event Analysis
// =============================================================================

export async function getRecurringProblems(
  limit: number = 10
): Promise<{ titel: string; count: number; veranstaltungen: string[] }[]> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get all problems
  const { data, error } = await supabase
    .from('lessons_learned')
    .select(`
      titel,
      veranstaltung:veranstaltungen(titel)
    `)
    .eq('kategorie', 'problem')
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  // Group by similar titles (simple matching)
  const grouped = new Map<string, { count: number; veranstaltungen: Set<string> }>()

  for (const item of data) {
    const key = item.titel.toLowerCase().trim()
    const veranstaltungTitel = (item.veranstaltung as unknown as { titel: string })?.titel || 'Unbekannt'

    if (!grouped.has(key)) {
      grouped.set(key, { count: 0, veranstaltungen: new Set() })
    }
    const entry = grouped.get(key)!
    entry.count++
    entry.veranstaltungen.add(veranstaltungTitel)
  }

  // Convert to array and sort
  return Array.from(grouped.entries())
    .map(([titel, data]) => ({
      titel,
      count: data.count,
      veranstaltungen: Array.from(data.veranstaltungen),
    }))
    .filter((item) => item.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
