'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { isManagement } from '../supabase/auth-helpers'
import type {
  ProtokollTemplate,
  ProtokollTemplateInsert,
  ProbenProtokollInsert,
  ProtokollSzenenNotizInsert,
  ProtokollAufgabe,
  ProtokollAufgabeInsert,
  ProtokollAufgabeUpdate,
  ProbenProtokollMitDetails,
  ProtokollStatus,
} from '../supabase/types'

// =============================================================================
// Protocol Templates
// =============================================================================

/**
 * Get all protocol templates
 */
export async function getProtokollTemplates(): Promise<ProtokollTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('protokoll_templates')
    .select('*')
    .order('ist_standard', { ascending: false })
    .order('name')

  if (error) {
    console.error('Error fetching protokoll templates:', error)
    return []
  }

  return (data as ProtokollTemplate[]) || []
}

/**
 * Get default template
 */
export async function getDefaultProtokollTemplate(): Promise<ProtokollTemplate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('protokoll_templates')
    .select('*')
    .eq('ist_standard', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching default template:', error)
    return null
  }

  return data as ProtokollTemplate
}

/**
 * Create a new protocol template
 */
export async function createProtokollTemplate(
  data: ProtokollTemplateInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('protokoll_templates')
    .insert({
      ...data,
      created_by: profile.id,
    } as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating protokoll template:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/proben')
  return { success: true, id: result?.id }
}

// =============================================================================
// Protocols
// =============================================================================

/**
 * Get protocol for a probe
 */
export async function getProbenProtokoll(
  probeId: string
): Promise<ProbenProtokollMitDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proben_protokolle')
    .select(`
      *,
      probe:proben(id, titel, datum),
      template:protokoll_templates(id, name),
      szenen_notizen:protokoll_szenen_notizen(
        *,
        szene:szenen(id, nummer, titel)
      ),
      aufgaben:protokoll_aufgaben(
        *,
        zustaendig:personen(id, vorname, nachname)
      )
    `)
    .eq('probe_id', probeId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching proben protokoll:', error)
    return null
  }

  return data as unknown as ProbenProtokollMitDetails
}

/**
 * Create or update protocol for a probe
 */
export async function createOrUpdateProtokoll(
  probeId: string,
  data: Partial<ProbenProtokollInsert>
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()

  // Check if protocol exists
  const existing = await getProbenProtokoll(probeId)

  if (existing) {
    // Update
    const { error } = await supabase
      .from('proben_protokolle')
      .update(data as never)
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating protokoll:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/proben/${probeId}`)
    return { success: true, id: existing.id }
  } else {
    // Create
    const { data: result, error } = await supabase
      .from('proben_protokolle')
      .insert({
        probe_id: probeId,
        erstellt_von: profile.id,
        status: 'entwurf',
        ...data,
      } as never)
      .select('id')
      .single()

    if (error) {
      console.error('Error creating protokoll:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/proben/${probeId}`)
    return { success: true, id: result?.id }
  }
}

/**
 * Update protocol status
 */
export async function updateProtokollStatus(
  protokollId: string,
  status: ProtokollStatus
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()

  const { data: protokoll } = await supabase
    .from('proben_protokolle')
    .select('probe_id')
    .eq('id', protokollId)
    .single()

  const { error } = await supabase
    .from('proben_protokolle')
    .update({ status } as never)
    .eq('id', protokollId)

  if (error) {
    console.error('Error updating protokoll status:', error)
    return { success: false, error: error.message }
  }

  if (protokoll?.probe_id) {
    revalidatePath(`/proben/${protokoll.probe_id}`)
  }
  return { success: true }
}

// =============================================================================
// Scene Notes
// =============================================================================

/**
 * Update or create scene note
 */
export async function updateSzenenNotiz(
  protokollId: string,
  szeneId: string,
  data: Partial<ProtokollSzenenNotizInsert>
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()

  // Check if exists
  const { data: existing } = await supabase
    .from('protokoll_szenen_notizen')
    .select('id')
    .eq('protokoll_id', protokollId)
    .eq('szene_id', szeneId)
    .single()

  if (existing) {
    // Update
    const { error } = await supabase
      .from('protokoll_szenen_notizen')
      .update(data as never)
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating szenen notiz:', error)
      return { success: false, error: error.message }
    }
  } else {
    // Create
    const { error } = await supabase
      .from('protokoll_szenen_notizen')
      .insert({
        protokoll_id: protokollId,
        szene_id: szeneId,
        ...data,
      } as never)

    if (error) {
      console.error('Error creating szenen notiz:', error)
      return { success: false, error: error.message }
    }
  }

  // Get probe_id for revalidation
  const { data: protokoll } = await supabase
    .from('proben_protokolle')
    .select('probe_id')
    .eq('id', protokollId)
    .single()

  if (protokoll?.probe_id) {
    revalidatePath(`/proben/${protokoll.probe_id}`)
  }

  return { success: true }
}

// =============================================================================
// Tasks
// =============================================================================

/**
 * Get tasks for a protocol
 */
export async function getProtokollAufgaben(
  protokollId: string
): Promise<(ProtokollAufgabe & { zustaendig: { id: string; vorname: string; nachname: string } | null })[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('protokoll_aufgaben')
    .select(`
      *,
      zustaendig:personen(id, vorname, nachname)
    `)
    .eq('protokoll_id', protokollId)
    .order('prioritaet', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching protokoll aufgaben:', error)
    return []
  }

  return (data as unknown as (ProtokollAufgabe & { zustaendig: { id: string; vorname: string; nachname: string } | null })[]) || []
}

/**
 * Create a task from protocol
 */
export async function createProtokollAufgabe(
  data: ProtokollAufgabeInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('protokoll_aufgaben')
    .insert(data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating protokoll aufgabe:', error)
    return { success: false, error: error.message }
  }

  // Get probe_id for revalidation
  const { data: protokoll } = await supabase
    .from('proben_protokolle')
    .select('probe_id')
    .eq('id', data.protokoll_id)
    .single()

  if (protokoll?.probe_id) {
    revalidatePath(`/proben/${protokoll.probe_id}`)
  }

  return { success: true, id: result?.id }
}

/**
 * Update a task
 */
export async function updateProtokollAufgabe(
  aufgabeId: string,
  data: ProtokollAufgabeUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('protokoll_aufgaben')
    .update(data as never)
    .eq('id', aufgabeId)

  if (error) {
    console.error('Error updating protokoll aufgabe:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Delete a task
 */
export async function deleteProtokollAufgabe(
  aufgabeId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('protokoll_aufgaben')
    .delete()
    .eq('id', aufgabeId)

  if (error) {
    console.error('Error deleting protokoll aufgabe:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get open tasks for current user
 */
export async function getMeineAufgaben(): Promise<
  (ProtokollAufgabe & {
    protokoll: { probe: { id: string; titel: string; datum: string } }
  })[]
> {
  const profile = await getUserProfile()
  if (!profile) return []

  const supabase = await createClient()

  // Get person ID for current user
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (!person) return []

  const { data, error } = await supabase
    .from('protokoll_aufgaben')
    .select(`
      *,
      protokoll:proben_protokolle(
        probe:proben(id, titel, datum)
      )
    `)
    .eq('zustaendig_id', person.id)
    .neq('status', 'erledigt')
    .neq('status', 'abgebrochen')
    .order('faellig_bis', { ascending: true, nullsFirst: false })
    .order('prioritaet', { ascending: false })

  if (error) {
    console.error('Error fetching meine aufgaben:', error)
    return []
  }

  return (data as unknown as (ProtokollAufgabe & {
    protokoll: { probe: { id: string; titel: string; datum: string } }
  })[]) || []
}

// =============================================================================
// Export
// =============================================================================

/**
 * Generate protocol as text for sharing
 */
export async function exportProtokollAsText(
  probeId: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  const protokoll = await getProbenProtokoll(probeId)
  if (!protokoll) {
    return { success: false, error: 'Protokoll nicht gefunden' }
  }

  const supabase = await createClient()

  // Get probe details
  const { data: probe } = await supabase
    .from('proben')
    .select(`
      titel, datum, startzeit, endzeit, ort,
      stueck:stuecke(titel)
    `)
    .eq('id', probeId)
    .single()

  if (!probe) {
    return { success: false, error: 'Probe nicht gefunden' }
  }

  let text = '# PROBENPROTOKOLL\n\n'
  text += `**${probe.titel}**\n`
  text += `Stück: ${(probe.stueck as unknown as { titel: string })?.titel || '-'}\n`
  text += `Datum: ${new Date(probe.datum).toLocaleDateString('de-CH')}\n`
  if (probe.startzeit) {
    text += `Zeit: ${probe.startzeit.slice(0, 5)}`
    if (probe.endzeit) text += ` - ${probe.endzeit.slice(0, 5)}`
    text += '\n'
  }
  if (probe.ort) text += `Ort: ${probe.ort}\n`
  text += '\n---\n\n'

  if (protokoll.anwesenheits_notizen) {
    text += '## Anwesenheit\n'
    text += protokoll.anwesenheits_notizen + '\n\n'
  }

  if (protokoll.allgemeine_notizen) {
    text += '## Allgemeine Notizen\n'
    text += protokoll.allgemeine_notizen + '\n\n'
  }

  if (protokoll.szenen_notizen && protokoll.szenen_notizen.length > 0) {
    text += '## Szenen-Notizen\n\n'
    for (const notiz of protokoll.szenen_notizen) {
      const szene = notiz.szene as unknown as { nummer: number; titel: string }
      text += `### Szene ${szene?.nummer}: ${szene?.titel}\n`
      if (notiz.status) text += `Status: ${notiz.status}\n`
      if (notiz.fortschritt) text += `Fortschritt: ${notiz.fortschritt}/5\n`
      if (notiz.notizen) text += notiz.notizen + '\n'
      text += '\n'
    }
  }

  if (protokoll.aufgaben && protokoll.aufgaben.length > 0) {
    text += '## Aufgaben\n\n'
    for (const aufgabe of protokoll.aufgaben) {
      const zustaendig = aufgabe.zustaendig as unknown as { vorname: string; nachname: string } | null
      text += `- [ ] ${aufgabe.titel}`
      if (zustaendig) text += ` (${zustaendig.vorname} ${zustaendig.nachname})`
      if (aufgabe.faellig_bis) text += ` - bis ${new Date(aufgabe.faellig_bis).toLocaleDateString('de-CH')}`
      text += '\n'
      if (aufgabe.beschreibung) text += `  ${aufgabe.beschreibung}\n`
    }
  }

  return { success: true, text }
}
