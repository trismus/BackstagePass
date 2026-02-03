'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import { ALLOWED_TRANSITIONS } from '../produktionen-utils'
import type {
  Produktion,
  ProduktionInsert,
  ProduktionUpdate,
  ProduktionStatus,
  Auffuehrungsserie,
  AuffuehrungsserieInsert,
  AuffuehrungsserieUpdate,
  Serienauffuehrung,
  SerienauffuehrungInsert,
  SerienauffuehrungUpdate,
  AuffuehrungsTyp,
} from '../supabase/types'

// =============================================================================
// Produktionen
// =============================================================================

export async function getProduktionen(): Promise<Produktion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('produktionen')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching produktionen:', error)
    return []
  }

  return (data as Produktion[]) || []
}

export async function getAktiveProduktionen(): Promise<Produktion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('produktionen')
    .select('*')
    .not('status', 'in', '("abgeschlossen","abgesagt")')
    .order('premiere', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching active produktionen:', error)
    return []
  }

  return (data as Produktion[]) || []
}

export async function getProduktion(id: string): Promise<Produktion | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('produktionen')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching produktion:', error)
    return null
  }

  return data as Produktion
}

export async function createProduktion(
  data: ProduktionInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Produktionen erstellen.',
    }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('produktionen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating produktion:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  return { success: true, id: result?.id }
}

export async function updateProduktion(
  id: string,
  data: ProduktionUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Produktionen bearbeiten.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('produktionen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating produktion:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  revalidatePath(`/produktionen/${id}`)
  return { success: true }
}

export async function deleteProduktion(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:delete')) {
    return {
      success: false,
      error:
        'Keine Berechtigung. Nur Administratoren können Produktionen löschen.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('produktionen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting produktion:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  return { success: true }
}

export async function updateProduktionStatus(
  id: string,
  newStatus: ProduktionStatus
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung.',
    }
  }

  // Fetch current status
  const produktion = await getProduktion(id)
  if (!produktion) {
    return { success: false, error: 'Produktion nicht gefunden.' }
  }

  // Validate transition
  const allowed = ALLOWED_TRANSITIONS[produktion.status]
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Status-Übergang von "${produktion.status}" zu "${newStatus}" ist nicht erlaubt.`,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('produktionen')
    .update({ status: newStatus } as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating produktion status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/produktionen')
  revalidatePath(`/produktionen/${id}`)
  return { success: true }
}

// =============================================================================
// Aufführungsserien
// =============================================================================

export async function getSerien(
  produktionId: string
): Promise<Auffuehrungsserie[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('auffuehrungsserien')
    .select('*')
    .eq('produktion_id', produktionId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching serien:', error)
    return []
  }

  return (data as Auffuehrungsserie[]) || []
}

export async function getSerie(
  id: string
): Promise<Auffuehrungsserie | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('auffuehrungsserien')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching serie:', error)
    return null
  }

  return data as Auffuehrungsserie
}

export async function createSerie(
  data: AuffuehrungsserieInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung.',
    }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('auffuehrungsserien')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating serie:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${data.produktion_id}`)
  return { success: true, id: result?.id }
}

export async function updateSerie(
  id: string,
  data: AuffuehrungsserieUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung.',
    }
  }

  const supabase = await createClient()

  const serie = await getSerie(id)
  const produktionId = serie?.produktion_id

  const { error } = await supabase
    .from('auffuehrungsserien')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating serie:', error)
    return { success: false, error: error.message }
  }

  if (produktionId) {
    revalidatePath(`/produktionen/${produktionId}`)
  }
  return { success: true }
}

export async function deleteSerie(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung.',
    }
  }

  const supabase = await createClient()

  const serie = await getSerie(id)
  const produktionId = serie?.produktion_id

  const { error } = await supabase
    .from('auffuehrungsserien')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting serie:', error)
    return { success: false, error: error.message }
  }

  if (produktionId) {
    revalidatePath(`/produktionen/${produktionId}`)
  }
  return { success: true }
}

// =============================================================================
// Serienaufführungen
// =============================================================================

export async function getSerienAuffuehrungen(
  serieId: string
): Promise<Serienauffuehrung[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('serienauffuehrungen')
    .select('*')
    .eq('serie_id', serieId)
    .order('datum', { ascending: true })

  if (error) {
    console.error('Error fetching serienauffuehrungen:', error)
    return []
  }

  return (data as Serienauffuehrung[]) || []
}

export async function generiereAuffuehrungen(
  serieId: string,
  termine: { datum: string; startzeit?: string; typ?: AuffuehrungsTyp }[]
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  if (termine.length > 100) {
    return {
      success: false,
      error: 'Maximal 100 Aufführungen pro Anfrage.',
    }
  }

  const serie = await getSerie(serieId)
  if (!serie) {
    return { success: false, error: 'Serie nicht gefunden.' }
  }

  const inserts: SerienauffuehrungInsert[] = termine.map((t) => ({
    serie_id: serieId,
    datum: t.datum,
    startzeit: t.startzeit || serie.standard_startzeit || null,
    ort: serie.standard_ort || null,
    typ: t.typ || 'regulaer',
    ist_ausnahme: false,
    veranstaltung_id: null,
    notizen: null,
  }))

  const supabase = await createClient()
  const { error } = await supabase
    .from('serienauffuehrungen')
    .insert(inserts as never)

  if (error) {
    console.error('Error generating auffuehrungen:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${serie.produktion_id}`)
  return { success: true, count: inserts.length }
}

export async function generiereAuffuehrungenWiederholung(
  serieId: string,
  config: {
    startDatum: string
    endDatum: string
    wochentage: number[]
    startzeit?: string
    ausnahmen?: string[]
  }
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  // Generate dates
  const termine: { datum: string; startzeit?: string }[] = []
  const ausnahmenSet = new Set(config.ausnahmen || [])
  const current = new Date(config.startDatum)
  const end = new Date(config.endDatum)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    const dateStr = current.toISOString().split('T')[0]

    if (config.wochentage.includes(dayOfWeek) && !ausnahmenSet.has(dateStr)) {
      termine.push({
        datum: dateStr,
        startzeit: config.startzeit,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  if (termine.length === 0) {
    return { success: false, error: 'Keine Termine im angegebenen Zeitraum.' }
  }

  if (termine.length > 100) {
    return {
      success: false,
      error: `Zu viele Termine (${termine.length}). Maximal 100 erlaubt.`,
    }
  }

  return generiereAuffuehrungen(serieId, termine)
}

export async function updateSerienauffuehrung(
  id: string,
  data: SerienauffuehrungUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('serienauffuehrungen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating serienauffuehrung:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteSerienauffuehrung(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('serienauffuehrungen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting serienauffuehrung:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
