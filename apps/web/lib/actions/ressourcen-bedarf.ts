'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type {
  RessourcenReservierungInsert,
  RessourcenReservierungUpdate,
  RessourcenReservierungMitRessource,
  SerieRessource,
  SerieRessourceInsert,
  RessourcenKonflikt,
  Ressource,
} from '../supabase/types'

// =============================================================================
// Ressourcen Reservierungen
// =============================================================================

export async function getRessourcenReservierungen(
  veranstaltungId: string
): Promise<RessourcenReservierungMitRessource[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ressourcen_reservierungen')
    .select('*, ressource:ressourcen(id, name, kategorie, menge)')
    .eq('veranstaltung_id', veranstaltungId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching ressourcen reservierungen:', error)
    return []
  }

  return (data as unknown as RessourcenReservierungMitRessource[]) || []
}

export async function createRessourcenReservierung(
  data: RessourcenReservierungInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'veranstaltungen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('ressourcen_reservierungen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating ressourcen reservierung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/veranstaltungen/${data.veranstaltung_id}`)
  return { success: true, id: result?.id }
}

export async function updateRessourcenReservierung(
  id: string,
  data: RessourcenReservierungUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'veranstaltungen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('ressourcen_reservierungen')
    .select('veranstaltung_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('ressourcen_reservierungen')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating ressourcen reservierung:', error)
    return { success: false, error: error.message }
  }

  if (existing?.veranstaltung_id) {
    revalidatePath(`/veranstaltungen/${existing.veranstaltung_id}`)
  }
  return { success: true }
}

export async function deleteRessourcenReservierung(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'veranstaltungen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('ressourcen_reservierungen')
    .select('veranstaltung_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('ressourcen_reservierungen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ressourcen reservierung:', error)
    return { success: false, error: error.message }
  }

  if (existing?.veranstaltung_id) {
    revalidatePath(`/veranstaltungen/${existing.veranstaltung_id}`)
  }
  return { success: true }
}

// =============================================================================
// Conflict Detection
// =============================================================================

export async function checkRessourceKonflikt(
  ressourceId: string,
  veranstaltungId: string
): Promise<RessourcenKonflikt[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('check_ressource_konflikt', {
    p_ressource_id: ressourceId,
    p_veranstaltung_id: veranstaltungId,
  })

  if (error) {
    console.error('Error checking ressource konflikt:', error)
    return []
  }

  return (data as RessourcenKonflikt[]) || []
}

export async function getRessourceVerfuegbarkeit(
  ressourceId: string,
  datum: string
): Promise<{ total: number; reserviert: number; verfuegbar: number }> {
  const supabase = await createClient()

  // Get total available
  const { data: ressource } = await supabase
    .from('ressourcen')
    .select('menge')
    .eq('id', ressourceId)
    .single()

  const total = ressource?.menge || 0

  // Get reserved amount on this date
  const { data: reservierungen } = await supabase
    .from('ressourcen_reservierungen')
    .select('menge, veranstaltung:veranstaltungen!inner(datum)')
    .eq('ressource_id', ressourceId)
    .eq('veranstaltung.datum', datum)

  const reserviert = (reservierungen || []).reduce(
    (sum, r) => sum + (r.menge || 0),
    0
  )

  return {
    total,
    reserviert,
    verfuegbar: Math.max(0, total - reserviert),
  }
}

// =============================================================================
// Serie Ressourcen (Defaults)
// =============================================================================

export async function getSerieRessourcen(
  serieId: string
): Promise<(SerieRessource & { ressource: Pick<Ressource, 'id' | 'name' | 'kategorie'> | null })[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('serie_ressourcen')
    .select('*, ressource:ressourcen(id, name, kategorie)')
    .eq('serie_id', serieId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching serie ressourcen:', error)
    return []
  }

  return (data as unknown as (SerieRessource & { ressource: Pick<Ressource, 'id' | 'name' | 'kategorie'> | null })[]) || []
}

export async function createSerieRessource(
  data: SerieRessourceInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('serie_ressourcen')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating serie ressource:', error)
    return { success: false, error: error.message }
  }

  return { success: true, id: result?.id }
}

export async function deleteSerieRessource(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('serie_ressourcen').delete().eq('id', id)

  if (error) {
    console.error('Error deleting serie ressource:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// =============================================================================
// Copy Serie Defaults to Veranstaltung
// =============================================================================

export async function copySerieRessourcenToVeranstaltung(
  serieId: string,
  veranstaltungId: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'copy_serie_ressourcen_to_veranstaltung',
    {
      p_serie_id: serieId,
      p_veranstaltung_id: veranstaltungId,
    }
  )

  if (error) {
    console.error('Error copying serie ressourcen:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/veranstaltungen/${veranstaltungId}`)
  return { success: true, count: data as number }
}

// =============================================================================
// Get Available Ressourcen (for selection)
// =============================================================================

export async function getVerfuegbareRessourcen(): Promise<Ressource[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ressourcen')
    .select('id, name, beschreibung, kategorie, menge, aktiv, created_at, updated_at')
    .eq('aktiv', true)
    .order('kategorie', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching ressourcen:', error)
    return []
  }

  return (data as Ressource[]) || []
}
