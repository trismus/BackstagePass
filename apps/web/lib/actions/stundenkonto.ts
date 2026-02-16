'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '../supabase/server'
import type { StundenkontoEintrag, StundenkontoInsert } from '../supabase/types'

/**
 * Get all stundenkonto entries for a person
 */
export async function getStundenkontoForPerson(
  personId: string
): Promise<StundenkontoEintrag[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stundenkonto')
    .select('id, person_id, typ, referenz_id, stunden, beschreibung, erfasst_von, created_at')
    .eq('person_id', personId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching stundenkonto:', error)
    return []
  }

  return (data as StundenkontoEintrag[]) || []
}

/**
 * Get total hours (saldo) for a person
 */
export async function getStundensaldo(personId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stundenkonto')
    .select('stunden')
    .eq('person_id', personId)

  if (error) {
    console.error('Error fetching stundensaldo:', error)
    return 0
  }

  return data?.reduce((sum, entry) => sum + (entry.stunden || 0), 0) || 0
}

/**
 * Add a correction entry to stundenkonto
 * Requires ADMIN role
 */
export async function addStundenkorrektur(
  personId: string,
  stunden: number,
  beschreibung: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) {
    return { success: false, error: 'Nicht authentifiziert' }
  }

  const entry: StundenkontoInsert = {
    person_id: personId,
    typ: 'korrektur',
    referenz_id: null,
    stunden,
    beschreibung,
    erfasst_von: user.id,
  }

  const { error } = await supabase.from('stundenkonto').insert(entry as never)

  if (error) {
    console.error('Error adding stunden korrektur:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mein-bereich')
  revalidatePath('/dashboard')
  revalidatePath('/mein-bereich/stundenkonto')
  return { success: true }
}

/**
 * Add hours from a helferschicht
 */
export async function addStundenFromSchicht(
  personId: string,
  schichtId: string,
  stunden: number,
  beschreibung: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()

  const entry: StundenkontoInsert = {
    person_id: personId,
    typ: 'helfereinsatz',
    referenz_id: schichtId,
    stunden,
    beschreibung,
    erfasst_von: user?.id || null,
  }

  const { error } = await supabase.from('stundenkonto').insert(entry as never)

  if (error) {
    console.error('Error adding stunden from schicht:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mein-bereich')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Export stundenkonto as CSV
 */
export async function exportStundenkontoCSV(personId: string): Promise<string> {
  const entries = await getStundenkontoForPerson(personId)

  const headers = ['Datum', 'Typ', 'Stunden', 'Beschreibung']
  const rows = entries.map((e) => [
    new Date(e.created_at).toLocaleDateString('de-CH'),
    e.typ,
    e.stunden.toString(),
    e.beschreibung || '',
  ])

  const csv = [headers, ...rows].map((row) => row.join(';')).join('\n')
  return csv
}

/**
 * Get stundenkonto summary for dashboard
 */
export async function getStundenkontoSummary(personId: string): Promise<{
  total: number
  thisYear: number
  lastEntries: StundenkontoEintrag[]
}> {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const yearStart = `${currentYear}-01-01`

  // Get all entries
  const { data: allData } = await supabase
    .from('stundenkonto')
    .select('id, person_id, typ, referenz_id, stunden, beschreibung, erfasst_von, created_at')
    .eq('person_id', personId)
    .order('created_at', { ascending: false })

  const entries = (allData as StundenkontoEintrag[]) || []

  // Calculate totals
  const total = entries.reduce((sum, e) => sum + e.stunden, 0)
  const thisYear = entries
    .filter((e) => e.created_at >= yearStart)
    .reduce((sum, e) => sum + e.stunden, 0)

  return {
    total,
    thisYear,
    lastEntries: entries.slice(0, 5),
  }
}
