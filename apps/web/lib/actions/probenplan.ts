'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { isManagement } from '../supabase/auth-helpers'
import type { Szene, ProbeInsert } from '../supabase/types'
import {
  probenGeneratorSchema,
  probenplanTemplateSchema,
  type ProbenGeneratorFormData,
  type ProbenplanTemplateFormData,
  type WiederholungTyp,
} from '../validations/probenplan'

// =============================================================================
// Types
// =============================================================================

export type ProbenplanTemplate = {
  id: string
  stueck_id: string
  name: string
  beschreibung: string | null
  wiederholung_typ: WiederholungTyp
  wochentag: number
  startzeit: string | null
  endzeit: string | null
  dauer_wochen: number
  ort: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  szenen?: { szene_id: string; szene: Szene }[]
}

export type ProbeKonflikt = {
  person_id: string
  person_name: string
  konflikt_typ: 'verfuegbarkeit' | 'andere_probe'
  konflikt_grund: string
}

export type GeneratedProbe = {
  datum: string
  titel: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  konflikte: ProbeKonflikt[]
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate dates based on recurring pattern
 */
function calculateRecurringDates(
  startDatum: string,
  endDatum: string,
  wochentag: number,
  wiederholungTyp: WiederholungTyp
): string[] {
  const dates: string[] = []
  const start = new Date(startDatum)
  const end = new Date(endDatum)

  // Find the first occurrence of the weekday on or after start date
  const current = new Date(start)
  const dayDiff = (wochentag - current.getDay() + 7) % 7
  current.setDate(current.getDate() + dayDiff)

  // If the first occurrence is before start date, move to next week
  if (current < start) {
    current.setDate(current.getDate() + 7)
  }

  // Calculate interval in days
  const intervalDays =
    wiederholungTyp === 'woechentlich' ? 7 :
    wiederholungTyp === 'zweiwoechentlich' ? 14 :
    28 // monthly approximation

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])

    if (wiederholungTyp === 'monatlich') {
      // For monthly, add 4 weeks (approximate month)
      current.setDate(current.getDate() + 28)
      // Adjust to stay on the same weekday
      const newDayDiff = (wochentag - current.getDay() + 7) % 7
      if (newDayDiff !== 0) {
        current.setDate(current.getDate() + newDayDiff - 7)
      }
    } else {
      current.setDate(current.getDate() + intervalDays)
    }
  }

  return dates
}

// =============================================================================
// Template CRUD
// =============================================================================

/**
 * Get all templates for a Stück
 */
export async function getProbenplanTemplates(
  stueckId: string
): Promise<ProbenplanTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('probenplan_templates')
    .select(`
      *,
      szenen:probenplan_template_szenen(
        szene_id,
        szene:szenen(id, nummer, titel)
      )
    `)
    .eq('stueck_id', stueckId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching probenplan templates:', error)
    return []
  }

  return (data as unknown as ProbenplanTemplate[]) || []
}

/**
 * Get a single template
 */
export async function getProbenplanTemplate(
  id: string
): Promise<ProbenplanTemplate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('probenplan_templates')
    .select(`
      *,
      szenen:probenplan_template_szenen(
        szene_id,
        szene:szenen(id, nummer, titel)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching probenplan template:', error)
    return null
  }

  return data as unknown as ProbenplanTemplate
}

/**
 * Create a new template
 */
export async function createProbenplanTemplate(
  data: ProbenplanTemplateFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Vorlagen erstellen.',
    }
  }

  const validated = probenplanTemplateSchema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || 'Validierungsfehler',
    }
  }

  const supabase = await createClient()
  const { szenen_ids, ...templateData } = validated.data

  // Insert template
  const { data: result, error } = await supabase
    .from('probenplan_templates')
    .insert({
      ...templateData,
      created_by: profile.id,
    } as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating probenplan template:', error)
    return { success: false, error: error.message }
  }

  // Insert template scenes
  if (szenen_ids && szenen_ids.length > 0 && result?.id) {
    const szenenInserts = szenen_ids.map((szeneId, index) => ({
      template_id: result.id,
      szene_id: szeneId,
      reihenfolge: index + 1,
    }))

    const { error: szenenError } = await supabase
      .from('probenplan_template_szenen')
      .insert(szenenInserts as never)

    if (szenenError) {
      console.error('Error inserting template szenen:', szenenError)
    }
  }

  revalidatePath(`/stuecke/${data.stueck_id}`)
  revalidatePath('/proben/generator')
  return { success: true, id: result?.id }
}

/**
 * Delete a template
 */
export async function deleteProbenplanTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Vorlagen löschen.',
    }
  }

  const supabase = await createClient()

  // Get stueck_id for revalidation
  const { data: template } = await supabase
    .from('probenplan_templates')
    .select('stueck_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('probenplan_templates')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting probenplan template:', error)
    return { success: false, error: error.message }
  }

  if (template?.stueck_id) {
    revalidatePath(`/stuecke/${template.stueck_id}`)
  }
  revalidatePath('/proben/generator')
  return { success: true }
}

// =============================================================================
// Conflict Detection
// =============================================================================

/**
 * Check for conflicts on a specific date
 */
export async function checkProbeKonflikte(
  stueckId: string,
  datum: string,
  startzeit?: string,
  endzeit?: string,
  szenenIds?: string[]
): Promise<ProbeKonflikt[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('check_probe_konflikte', {
    p_stueck_id: stueckId,
    p_datum: datum,
    p_startzeit: startzeit || null,
    p_endzeit: endzeit || null,
    p_szenen_ids: szenenIds || null,
  })

  if (error) {
    console.error('Error checking probe konflikte:', error)
    return []
  }

  return (data as ProbeKonflikt[]) || []
}

// =============================================================================
// Probe Generation
// =============================================================================

/**
 * Preview generated proben (without creating)
 */
export async function previewGeneratedProben(
  data: ProbenGeneratorFormData
): Promise<{ success: boolean; error?: string; proben?: GeneratedProbe[] }> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return {
      success: false,
      error: 'Keine Berechtigung.',
    }
  }

  const validated = probenGeneratorSchema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || 'Validierungsfehler',
    }
  }

  const {
    stueck_id,
    titel_prefix,
    wiederholung_typ,
    wochentag,
    startzeit,
    endzeit,
    start_datum,
    end_datum,
    ort,
    szenen_ids,
  } = validated.data

  // Calculate dates
  const dates = calculateRecurringDates(
    start_datum,
    end_datum,
    wochentag,
    wiederholung_typ
  )

  // Check conflicts for each date
  const proben: GeneratedProbe[] = []
  for (let i = 0; i < dates.length; i++) {
    const datum = dates[i]
    const konflikte = await checkProbeKonflikte(
      stueck_id,
      datum,
      startzeit,
      endzeit,
      szenen_ids
    )

    proben.push({
      datum,
      titel: `${titel_prefix} ${i + 1}`,
      startzeit,
      endzeit,
      ort: ort || null,
      konflikte,
    })
  }

  return { success: true, proben }
}

/**
 * Generate proben from settings
 */
export async function generateProben(
  data: ProbenGeneratorFormData
): Promise<{
  success: boolean
  error?: string
  created_count?: number
  probe_ids?: string[]
}> {
  const profile = await getUserProfile()
  if (!profile || !isManagement(profile.role)) {
    return {
      success: false,
      error: 'Keine Berechtigung. Nur Vorstand kann Proben erstellen.',
    }
  }

  const validated = probenGeneratorSchema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || 'Validierungsfehler',
    }
  }

  const {
    stueck_id,
    titel_prefix,
    beschreibung,
    wiederholung_typ,
    wochentag,
    startzeit,
    endzeit,
    start_datum,
    end_datum,
    ort,
    szenen_ids,
    auto_einladen,
  } = validated.data

  const supabase = await createClient()

  // Calculate dates
  const dates = calculateRecurringDates(
    start_datum,
    end_datum,
    wochentag,
    wiederholung_typ
  )

  if (dates.length === 0) {
    return {
      success: false,
      error: 'Keine Termine im angegebenen Zeitraum gefunden.',
    }
  }

  const probeIds: string[] = []

  for (let i = 0; i < dates.length; i++) {
    const datum = dates[i]

    // Create the probe
    const probeData: ProbeInsert = {
      stueck_id,
      titel: `${titel_prefix} ${i + 1}`,
      beschreibung: beschreibung || null,
      datum,
      startzeit,
      endzeit,
      ort: ort || null,
      status: 'geplant',
      notizen: null,
    }

    const { data: probe, error: probeError } = await supabase
      .from('proben')
      .insert(probeData as never)
      .select('id')
      .single()

    if (probeError || !probe) {
      console.error('Error creating probe:', probeError)
      continue
    }

    probeIds.push(probe.id)

    // Add scenes to the probe
    if (szenen_ids && szenen_ids.length > 0) {
      const szenenInserts = szenen_ids.map((szeneId, index) => ({
        probe_id: probe.id,
        szene_id: szeneId,
        reihenfolge: index + 1,
      }))

      const { error: szenenError } = await supabase
        .from('proben_szenen')
        .insert(szenenInserts as never)

      if (szenenError) {
        console.error('Error inserting probe szenen:', szenenError)
      }
    }

    // Auto-invite participants based on cast
    if (auto_einladen) {
      const { error: inviteError } = await supabase.rpc(
        'generate_probe_teilnehmer',
        { probe_uuid: probe.id }
      )

      if (inviteError) {
        console.error('Error auto-inviting teilnehmer:', inviteError)
      }
    }
  }

  revalidatePath(`/stuecke/${stueck_id}`)
  revalidatePath('/proben')
  revalidatePath('/kalender')

  return {
    success: true,
    created_count: probeIds.length,
    probe_ids: probeIds,
  }
}

/**
 * Generate proben from a saved template
 */
export async function generateProbenFromTemplate(
  templateId: string,
  startDatum: string,
  endDatum: string,
  titelPrefix?: string
): Promise<{
  success: boolean
  error?: string
  created_count?: number
  probe_ids?: string[]
}> {
  const template = await getProbenplanTemplate(templateId)
  if (!template) {
    return { success: false, error: 'Vorlage nicht gefunden.' }
  }

  const szenenIds = template.szenen?.map((s) => s.szene_id) || []

  const data: ProbenGeneratorFormData = {
    stueck_id: template.stueck_id,
    titel_prefix: titelPrefix || template.name,
    beschreibung: template.beschreibung || undefined,
    wiederholung_typ: template.wiederholung_typ,
    wochentag: template.wochentag,
    startzeit: template.startzeit || '19:00',
    endzeit: template.endzeit || '22:00',
    start_datum: startDatum,
    end_datum: endDatum,
    ort: template.ort || undefined,
    szenen_ids: szenenIds.length > 0 ? szenenIds : undefined,
    auto_einladen: true,
  }

  return generateProben(data)
}

// =============================================================================
// Data Fetching for Generator UI
// =============================================================================

/**
 * Get Stücke with their scenes for the generator
 */
export async function getStueckeMitSzenen(): Promise<
  { id: string; titel: string; szenen: Szene[] }[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stuecke')
    .select(`
      id,
      titel,
      szenen(*)
    `)
    .eq('status', 'in_produktion')
    .order('titel')

  if (error) {
    console.error('Error fetching stuecke:', error)
    return []
  }

  return (data as unknown as { id: string; titel: string; szenen: Szene[] }[]) || []
}

/**
 * Get affected cast members for selected scenes
 */
export async function getBetroffeneDarsteller(
  stueckId: string,
  szenenIds?: string[]
): Promise<{ id: string; vorname: string; nachname: string; rolle: string }[]> {
  const supabase = await createClient()

  let query = supabase
    .from('besetzungen')
    .select(`
      person:personen(id, vorname, nachname),
      rolle:rollen(id, name, stueck_id)
    `)
    .eq('rolle.stueck_id', stueckId)

  // If specific scenes are selected, filter by those scenes
  if (szenenIds && szenenIds.length > 0) {
    // Get roles that appear in the selected scenes
    const { data: roleIds } = await supabase
      .from('szenen_rollen')
      .select('rolle_id')
      .in('szene_id', szenenIds)

    if (roleIds && roleIds.length > 0) {
      const uniqueRoleIds = [...new Set(roleIds.map((r) => r.rolle_id))]
      query = query.in('rolle_id', uniqueRoleIds)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching betroffene darsteller:', error)
    return []
  }

  // Transform and deduplicate
  const personMap = new Map<
    string,
    { id: string; vorname: string; nachname: string; rolle: string }
  >()

  for (const item of data || []) {
    const person = item.person as unknown as {
      id: string
      vorname: string
      nachname: string
    } | null
    const rolle = item.rolle as unknown as {
      id: string
      name: string
      stueck_id: string
    } | null

    if (person && rolle) {
      const existing = personMap.get(person.id)
      if (existing) {
        existing.rolle += `, ${rolle.name}`
      } else {
        personMap.set(person.id, {
          id: person.id,
          vorname: person.vorname,
          nachname: person.nachname,
          rolle: rolle.name,
        })
      }
    }
  }

  return Array.from(personMap.values())
}
