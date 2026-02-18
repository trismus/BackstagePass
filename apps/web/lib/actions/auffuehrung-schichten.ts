'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type {
  AuffuehrungSchichtInsert,
  AuffuehrungSchichtUpdate,
  SchichtMitZeitblock,
  AuffuehrungZuweisungInsert,
  AuffuehrungZuweisungUpdate,
  ZuweisungMitPerson,
  BedarfStatus,
  SchichtSichtbarkeit,
} from '../supabase/types'
import {
  schichtSchema,
  schichtUpdateSchema,
  zuweisungSchema,
  zuweisungUpdateSchema,
  validateInput,
} from '../validations/modul2'
import { requirePermission } from '../supabase/auth-helpers'

/**
 * Get all shifts for a performance with time block details
 */
export async function getSchichten(
  veranstaltungId: string
): Promise<SchichtMitZeitblock[]> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('auffuehrung_schichten')
    .select(
      `
      *,
      zeitblock:zeitbloecke(id, name, startzeit, endzeit, typ)
    `
    )
    .eq('veranstaltung_id', veranstaltungId)
    .order('rolle', { ascending: true })

  if (error) {
    console.error('Error fetching schichten:', error)
    return []
  }

  return (data as SchichtMitZeitblock[]) || []
}

/**
 * Get a single shift by ID
 */
export async function getSchicht(
  id: string
): Promise<SchichtMitZeitblock | null> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('auffuehrung_schichten')
    .select(
      `
      *,
      zeitblock:zeitbloecke(id, name, startzeit, endzeit, typ)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching schicht:', error)
    return null
  }

  return data as SchichtMitZeitblock
}

/**
 * Create a new shift
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function createSchicht(
  data: AuffuehrungSchichtInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  // Validate input
  const validation = validateInput(schichtSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('auffuehrung_schichten')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating schicht:', error)
    return { success: false, error: 'Fehler beim Erstellen der Schicht' }
  }

  revalidatePath(`/auffuehrungen/${data.veranstaltung_id}`)
  return { success: true, id: result?.id }
}

/**
 * Create multiple shifts at once
 */
export async function createSchichten(
  data: AuffuehrungSchichtInsert[]
): Promise<{ success: boolean; error?: string; ids?: string[] }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  if (data.length === 0) {
    return { success: true, ids: [] }
  }

  const supabase = await createClient()
  const { data: results, error } = await supabase
    .from('auffuehrung_schichten')
    .insert(data as never[])
    .select('id')

  if (error) {
    console.error('Error creating schichten:', error)
    return { success: false, error: error.message }
  }

  if (data[0]?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${data[0].veranstaltung_id}`)
  }

  return { success: true, ids: results?.map((r) => r.id) || [] }
}

/**
 * Update an existing shift
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function updateSchicht(
  id: string,
  data: AuffuehrungSchichtUpdate
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  // Validate input
  const validation = validateInput(schichtUpdateSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()

  // Get the veranstaltung_id for revalidation
  const { data: existing } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('auffuehrung_schichten')
    .update(validation.data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating schicht:', error)
    return { success: false, error: 'Fehler beim Aktualisieren der Schicht' }
  }

  if (existing?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${existing.veranstaltung_id}`)
  }

  return { success: true }
}

/**
 * Delete a shift
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function deleteSchicht(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()

  // Get the veranstaltung_id for revalidation
  const { data: existing } = await supabase
    .from('auffuehrung_schichten')
    .select('veranstaltung_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('auffuehrung_schichten')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting schicht:', error)
    return { success: false, error: error.message }
  }

  if (existing?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${existing.veranstaltung_id}`)
  }

  return { success: true }
}

// =============================================================================
// Zuweisungen (Assignments)
// =============================================================================

/**
 * Get all assignments for a shift with person details
 */
export async function getZuweisungen(
  schichtId: string
): Promise<ZuweisungMitPerson[]> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(
      `
      *,
      person:personen(id, vorname, nachname, email),
      external_helper:externe_helfer_profile(id, vorname, nachname, email)
    `
    )
    .eq('schicht_id', schichtId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching zuweisungen:', error)
    return []
  }

  return (data as ZuweisungMitPerson[]) || []
}

/**
 * Get all assignments for a performance
 */
export async function getZuweisungenForVeranstaltung(
  veranstaltungId: string
): Promise<ZuweisungMitPerson[]> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()

  // First get all shift IDs for this performance
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select('id')
    .eq('veranstaltung_id', veranstaltungId)

  if (!schichten || schichten.length === 0) {
    return []
  }

  const schichtIds = schichten.map((s) => s.id)

  const { data, error } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(
      `
      *,
      person:personen(id, vorname, nachname, email),
      external_helper:externe_helfer_profile(id, vorname, nachname, email)
    `
    )
    .in('schicht_id', schichtIds)

  if (error) {
    console.error('Error fetching zuweisungen for veranstaltung:', error)
    return []
  }

  return (data as ZuweisungMitPerson[]) || []
}

/**
 * Create a new assignment
 */
export async function createZuweisung(
  data: AuffuehrungZuweisungInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  // Validate input
  const validation = validateInput(zuweisungSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('auffuehrung_zuweisungen')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating zuweisung:', error)
    return { success: false, error: 'Fehler beim Erstellen der Zuweisung' }
  }

  revalidatePath('/auffuehrungen')
  return { success: true, id: result?.id }
}

/**
 * Update an existing assignment
 */
export async function updateZuweisung(
  id: string,
  data: AuffuehrungZuweisungUpdate
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  // Validate input
  const validation = validateInput(zuweisungUpdateSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('auffuehrung_zuweisungen')
    .update(validation.data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating zuweisung:', error)
    return { success: false, error: 'Fehler beim Aktualisieren der Zuweisung' }
  }

  revalidatePath('/auffuehrungen')
  return { success: true }
}

/**
 * Delete an assignment
 */
export async function deleteZuweisung(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('veranstaltungen:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()
  const { error } = await supabase
    .from('auffuehrung_zuweisungen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting zuweisung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/auffuehrungen')
  return { success: true }
}

// =============================================================================
// Bedarf Übersicht (Demand Overview)
// =============================================================================

/**
 * Get demand overview for a performance
 * Shows how many people are needed vs. assigned per role and time block
 */
export async function getBedarfUebersicht(
  veranstaltungId: string
): Promise<BedarfStatus[]> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()

  // Get all shifts with time blocks
  const { data: schichten, error: schichtenError } = await supabase
    .from('auffuehrung_schichten')
    .select(
      `
      id,
      rolle,
      anzahl_benoetigt,
      zeitblock:zeitbloecke(id, name, startzeit, endzeit)
    `
    )
    .eq('veranstaltung_id', veranstaltungId)

  if (schichtenError || !schichten) {
    console.error('Error fetching schichten for bedarf:', schichtenError)
    return []
  }

  // Get assignment counts per shift
  const schichtIds = schichten.map((s) => s.id)
  if (schichtIds.length === 0) {
    return []
  }

  const { data: zuweisungen, error: zuweisungenError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('schicht_id, status')
    .in('schicht_id', schichtIds)
    .in('status', ['zugesagt', 'erschienen'])

  if (zuweisungenError) {
    console.error('Error fetching zuweisungen for bedarf:', zuweisungenError)
    return []
  }

  // Count assignments per shift
  const zuweisungCounts: Record<string, number> = {}
  zuweisungen?.forEach((z) => {
    zuweisungCounts[z.schicht_id] = (zuweisungCounts[z.schicht_id] || 0) + 1
  })

  // Build the overview
  return schichten.map((schicht) => {
    // Handle the zeitblock which may be an array or object from Supabase
    const zb = schicht.zeitblock
    const zeitblockData = Array.isArray(zb) ? zb[0] : zb

    return {
      rolle: schicht.rolle,
      zeitblock: zeitblockData as BedarfStatus['zeitblock'],
      benoetigt: schicht.anzahl_benoetigt,
      zugewiesen: zuweisungCounts[schicht.id] || 0,
      offen: schicht.anzahl_benoetigt - (zuweisungCounts[schicht.id] || 0),
    }
  })
}

// =============================================================================
// Dashboard: Offene Schichten
// =============================================================================

export type DashboardSchicht = {
  id: string
  rolle: string
  freie_plaetze: number
  sichtbarkeit: SchichtSichtbarkeit
  zeitblock: { name: string; startzeit: string; endzeit: string } | null
  veranstaltung: { id: string; titel: string; datum: string; ort: string | null }
}

/**
 * Get open shifts for the member dashboard.
 * Returns shifts with free slots from published performances (intern + public).
 */
export async function getOffeneSchichtenForDashboard(): Promise<DashboardSchicht[]> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Get upcoming published performances
  const { data: veranstaltungen, error: vError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, ort')
    .eq('helfer_status', 'veroeffentlicht')
    .gte('datum', today)
    .order('datum', { ascending: true })

  if (vError || !veranstaltungen || veranstaltungen.length === 0) {
    if (vError) console.error('Error fetching veranstaltungen for dashboard:', vError)
    return []
  }

  const veranstaltungIds = veranstaltungen.map((v) => v.id)
  const veranstaltungMap = new Map(veranstaltungen.map((v) => [v.id, v]))

  // Get all shifts for these performances with time blocks
  const { data: schichten, error: sError } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      veranstaltung_id,
      rolle,
      anzahl_benoetigt,
      sichtbarkeit,
      zeitblock:zeitbloecke(name, startzeit, endzeit)
    `)
    .in('veranstaltung_id', veranstaltungIds)

  if (sError || !schichten || schichten.length === 0) {
    if (sError) console.error('Error fetching schichten for dashboard:', sError)
    return []
  }

  // Get assignment counts per shift (exclude cancelled)
  const schichtIds = schichten.map((s) => s.id)
  const { data: zuweisungen } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('schicht_id')
    .in('schicht_id', schichtIds)
    .neq('status', 'abgesagt')

  const zuweisungCounts: Record<string, number> = {}
  zuweisungen?.forEach((z) => {
    zuweisungCounts[z.schicht_id] = (zuweisungCounts[z.schicht_id] || 0) + 1
  })

  // Build result: only shifts with free slots
  const result: DashboardSchicht[] = []
  for (const schicht of schichten) {
    const assigned = zuweisungCounts[schicht.id] || 0
    const freiePlaetze = schicht.anzahl_benoetigt - assigned
    if (freiePlaetze <= 0) continue

    const v = veranstaltungMap.get(schicht.veranstaltung_id)
    if (!v) continue

    const zb = schicht.zeitblock
    const zeitblockData = Array.isArray(zb) ? zb[0] : zb

    result.push({
      id: schicht.id,
      rolle: schicht.rolle,
      freie_plaetze: freiePlaetze,
      sichtbarkeit: schicht.sichtbarkeit,
      zeitblock: zeitblockData ?? null,
      veranstaltung: { id: v.id, titel: v.titel, datum: v.datum, ort: v.ort },
    })
  }

  // Sort by date, then by zeitblock start time
  result.sort((a, b) => {
    const dateCmp = a.veranstaltung.datum.localeCompare(b.veranstaltung.datum)
    if (dateCmp !== 0) return dateCmp
    const aStart = a.zeitblock?.startzeit ?? ''
    const bStart = b.zeitblock?.startzeit ?? ''
    return aStart.localeCompare(bStart)
  })

  return result.slice(0, 8)
}
