'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type { ProduktionsChecklistItem, ProduktionStatus } from '../supabase/types'

// =============================================================================
// Default checklist items per phase
// =============================================================================

type DefaultItem = { label: string; pflicht: boolean; sort_order: number }

const DEFAULT_CHECKLIST: Record<string, DefaultItem[]> = {
  planung: [
    { label: 'Stück ausgewählt', pflicht: true, sort_order: 1 },
    { label: 'Budget genehmigt', pflicht: true, sort_order: 2 },
    { label: 'Aufführungsdaten festgelegt', pflicht: false, sort_order: 3 },
    { label: 'Probenraum reserviert', pflicht: false, sort_order: 4 },
    { label: 'Produktionsleitung bestimmt', pflicht: true, sort_order: 5 },
  ],
  casting: [
    { label: 'Casting-Termin geplant', pflicht: true, sort_order: 1 },
    { label: 'Alle Rollen ausgeschrieben', pflicht: true, sort_order: 2 },
    { label: 'Casting durchgeführt', pflicht: true, sort_order: 3 },
    { label: 'Besetzung bekanntgegeben', pflicht: true, sort_order: 4 },
  ],
  proben: [
    { label: 'Probenplan erstellt', pflicht: true, sort_order: 1 },
    { label: 'Requisitenliste erstellt', pflicht: false, sort_order: 2 },
    { label: 'Kostüme organisiert', pflicht: false, sort_order: 3 },
    { label: 'Bühnenbild geplant', pflicht: false, sort_order: 4 },
    { label: 'Technik-Check durchgeführt', pflicht: false, sort_order: 5 },
  ],
  premiere: [
    { label: 'Generalprobe durchgeführt', pflicht: true, sort_order: 1 },
    { label: 'Werbung veröffentlicht', pflicht: false, sort_order: 2 },
    { label: 'Programmheft fertig', pflicht: false, sort_order: 3 },
    { label: 'Ticketverkauf gestartet', pflicht: false, sort_order: 4 },
  ],
  laufend: [
    { label: 'Feedback nach Premiere ausgewertet', pflicht: false, sort_order: 1 },
    { label: 'Alle Aufführungen terminiert', pflicht: true, sort_order: 2 },
  ],
  abgeschlossen: [
    { label: 'Material zurückgegeben', pflicht: false, sort_order: 1 },
    { label: 'Abschlussmeeting durchgeführt', pflicht: false, sort_order: 2 },
    { label: 'Budget abgerechnet', pflicht: true, sort_order: 3 },
  ],
}

// Phases that have checklists (excludes draft and abgesagt)
const CHECKLIST_PHASES: ProduktionStatus[] = [
  'planung',
  'casting',
  'proben',
  'premiere',
  'laufend',
  'abgeschlossen',
]

// =============================================================================
// Read
// =============================================================================

export async function getChecklistItems(
  produktionId: string
): Promise<ProduktionsChecklistItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('produktions_checklisten')
    .select('*')
    .eq('produktion_id', produktionId)
    .order('phase', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching checklist items:', error)
    return []
  }

  return (data as ProduktionsChecklistItem[]) || []
}

// =============================================================================
// Initialize
// =============================================================================

export async function initChecklistForProduktion(
  produktionId: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  // Check if items already exist
  const { count } = await supabase
    .from('produktions_checklisten')
    .select('id', { count: 'exact', head: true })
    .eq('produktion_id', produktionId)

  if (count && count > 0) {
    return { success: false, error: 'Checkliste bereits vorhanden.' }
  }

  // Build insert rows
  const rows = CHECKLIST_PHASES.flatMap((phase) => {
    const items = DEFAULT_CHECKLIST[phase]
    if (!items) return []
    return items.map((item) => ({
      produktion_id: produktionId,
      phase,
      label: item.label,
      pflicht: item.pflicht,
      erledigt: false,
      sort_order: item.sort_order,
    }))
  })

  const { error } = await supabase
    .from('produktions_checklisten')
    .insert(rows as never[])

  if (error) {
    console.error('Error initializing checklist:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${produktionId}`)
  return { success: true, count: rows.length }
}

// =============================================================================
// Toggle
// =============================================================================

export async function toggleChecklistItem(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  // Get current state
  const { data: item } = await supabase
    .from('produktions_checklisten')
    .select('erledigt, produktion_id')
    .eq('id', id)
    .single()

  if (!item) {
    return { success: false, error: 'Eintrag nicht gefunden.' }
  }

  const newErledigt = !item.erledigt
  const { error } = await supabase
    .from('produktions_checklisten')
    .update({
      erledigt: newErledigt,
      erledigt_von: newErledigt ? profile.id : null,
      erledigt_am: newErledigt ? new Date().toISOString() : null,
    } as never)
    .eq('id', id)

  if (error) {
    console.error('Error toggling checklist item:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${item.produktion_id}`)
  return { success: true }
}
