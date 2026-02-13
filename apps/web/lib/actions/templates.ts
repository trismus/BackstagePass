'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type {
  AuffuehrungTemplate,
  AuffuehrungTemplateInsert,
  AuffuehrungTemplateUpdate,
  TemplateMitDetails,
  TemplateZeitblock,
  TemplateZeitblockInsert,
  TemplateSchicht,
  TemplateSchichtInsert,
  TemplateRessourceInsert,
  TemplateInfoBlock,
  TemplateInfoBlockInsert,
  TemplateSachleistung,
  TemplateSachleistungInsert,
  ZeitblockInsert,
  AuffuehrungSchichtInsert,
  InfoBlockInsert,
  SachleistungInsert,
} from '../supabase/types'
import {
  templateSchema,
  templateUpdateSchema,
  templateZeitblockSchema,
  templateSchichtSchema,
  templateRessourceSchema,
  templateInfoBlockSchema,
  templateSachleistungSchema,
  validateInput,
} from '../validations/modul2'

/**
 * Get all templates (non-archived)
 */
export async function getTemplates(): Promise<AuffuehrungTemplate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('auffuehrung_templates')
    .select('id, name, beschreibung, archiviert, created_at, updated_at')
    .eq('archiviert', false)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching templates:', error)
    return []
  }

  return (data as AuffuehrungTemplate[]) || []
}

/**
 * Get all templates including archived
 */
export async function getAllTemplates(): Promise<AuffuehrungTemplate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('auffuehrung_templates')
    .select('id, name, beschreibung, archiviert, created_at, updated_at')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching all templates:', error)
    return []
  }

  return (data as AuffuehrungTemplate[]) || []
}

/**
 * Get a single template with all details
 */
export async function getTemplate(
  id: string
): Promise<TemplateMitDetails | null> {
  const supabase = await createClient()

  // Get template
  const { data: template, error: templateError } = await supabase
    .from('auffuehrung_templates')
    .select('id, name, beschreibung, archiviert, created_at, updated_at')
    .eq('id', id)
    .single()

  if (templateError || !template) {
    console.error('Error fetching template:', templateError)
    return null
  }

  // Get zeitbloecke
  const { data: zeitbloecke } = await supabase
    .from('template_zeitbloecke')
    .select('id, template_id, name, offset_minuten, dauer_minuten, typ, sortierung')
    .eq('template_id', id)
    .order('sortierung', { ascending: true })

  // Get schichten
  const { data: schichten } = await supabase
    .from('template_schichten')
    .select('id, template_id, zeitblock_name, rolle, anzahl_benoetigt')
    .eq('template_id', id)

  // Get ressourcen with details
  const { data: ressourcen } = await supabase
    .from('template_ressourcen')
    .select(
      `
      *,
      ressource:ressourcen(id, name)
    `
    )
    .eq('template_id', id)

  // Get info_bloecke
  const { data: info_bloecke } = await supabase
    .from('template_info_bloecke')
    .select('id, template_id, titel, beschreibung, offset_minuten, dauer_minuten, sortierung, created_at')
    .eq('template_id', id)
    .order('sortierung', { ascending: true })

  // Get sachleistungen
  const { data: sachleistungen } = await supabase
    .from('template_sachleistungen')
    .select('id, template_id, name, anzahl, beschreibung, created_at')
    .eq('template_id', id)

  return {
    ...(template as AuffuehrungTemplate),
    zeitbloecke: (zeitbloecke as TemplateZeitblock[]) || [],
    schichten: (schichten as TemplateSchicht[]) || [],
    ressourcen: ressourcen || [],
    info_bloecke: (info_bloecke as TemplateInfoBlock[]) || [],
    sachleistungen: (sachleistungen as TemplateSachleistung[]) || [],
  } as TemplateMitDetails
}

/**
 * Create a new template
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function createTemplate(
  data: AuffuehrungTemplateInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  // Validate input
  const validation = validateInput(templateSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('auffuehrung_templates')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating template:', error)
    return { success: false, error: 'Fehler beim Erstellen der Vorlage' }
  }

  revalidatePath('/templates')
  return { success: true, id: result?.id }
}

/**
 * Update a template
 * Requires EDITOR or ADMIN role (enforced by RLS)
 */
export async function updateTemplate(
  id: string,
  data: AuffuehrungTemplateUpdate
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = validateInput(templateUpdateSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('auffuehrung_templates')
    .update(validation.data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating template:', error)
    return { success: false, error: 'Fehler beim Aktualisieren der Vorlage' }
  }

  revalidatePath('/templates')
  revalidatePath(`/templates/${id}`)
  return { success: true }
}

/**
 * Archive a template (soft delete)
 */
export async function archiveTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return updateTemplate(id, { archiviert: true })
}

/**
 * Delete a template (hard delete)
 * Requires ADMIN role (enforced by RLS)
 */
export async function deleteTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('auffuehrung_templates')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting template:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/templates')
  return { success: true }
}

// =============================================================================
// Template Zeitblöcke
// =============================================================================

export async function addTemplateZeitblock(
  data: TemplateZeitblockInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  // Validate input
  const validation = validateInput(templateZeitblockSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('template_zeitbloecke')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error adding template zeitblock:', error)
    return { success: false, error: 'Fehler beim Hinzufügen des Zeitblocks' }
  }

  revalidatePath(`/templates/${data.template_id}`)
  return { success: true, id: result?.id }
}

export async function removeTemplateZeitblock(
  id: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('template_zeitbloecke')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing template zeitblock:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/templates/${templateId}`)
  return { success: true }
}

// =============================================================================
// Template Schichten
// =============================================================================

export async function addTemplateSchicht(
  data: TemplateSchichtInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  // Validate input
  const validation = validateInput(templateSchichtSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('template_schichten')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error adding template schicht:', error)
    return { success: false, error: 'Fehler beim Hinzufügen der Schicht' }
  }

  revalidatePath(`/templates/${data.template_id}`)
  return { success: true, id: result?.id }
}

export async function removeTemplateSchicht(
  id: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('template_schichten')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing template schicht:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/templates/${templateId}`)
  return { success: true }
}

// =============================================================================
// Template Ressourcen
// =============================================================================

export async function addTemplateRessource(
  data: TemplateRessourceInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  // Validate input
  const validation = validateInput(templateRessourceSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('template_ressourcen')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error adding template ressource:', error)
    return { success: false, error: 'Fehler beim Hinzufügen der Ressource' }
  }

  revalidatePath(`/templates/${data.template_id}`)
  return { success: true, id: result?.id }
}

export async function removeTemplateRessource(
  id: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('template_ressourcen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing template ressource:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/templates/${templateId}`)
  return { success: true }
}

// =============================================================================
// Template Info-Blöcke
// =============================================================================

export async function addTemplateInfoBlock(
  data: TemplateInfoBlockInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  // Validate input
  const validation = validateInput(templateInfoBlockSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('template_info_bloecke')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error adding template info block:', error)
    return { success: false, error: 'Fehler beim Hinzufügen des Info-Blocks' }
  }

  revalidatePath(`/templates/${data.template_id}`)
  return { success: true, id: result?.id }
}

export async function removeTemplateInfoBlock(
  id: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('template_info_bloecke')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing template info block:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/templates/${templateId}`)
  return { success: true }
}

// =============================================================================
// Template Sachleistungen
// =============================================================================

export async function addTemplateSachleistung(
  data: TemplateSachleistungInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  // Validate input
  const validation = validateInput(templateSachleistungSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('template_sachleistungen')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error adding template sachleistung:', error)
    return { success: false, error: 'Fehler beim Hinzufügen der Sachleistung' }
  }

  revalidatePath(`/templates/${data.template_id}`)
  return { success: true, id: result?.id }
}

export async function removeTemplateSachleistung(
  id: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('template_sachleistungen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing template sachleistung:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/templates/${templateId}`)
  return { success: true }
}

// =============================================================================
// Apply Template
// =============================================================================

/**
 * Apply a template to a performance
 * Creates zeitbloecke, schichten, and ressourcen reservations based on template
 *
 * @param templateId - The template to apply
 * @param veranstaltungId - The performance to apply the template to
 * @param startzeit - The start time of the performance (used to calculate zeitblock times)
 */
export async function applyTemplate(
  templateId: string,
  veranstaltungId: string,
  startzeit: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the template with all details
  const template = await getTemplate(templateId)
  if (!template) {
    return { success: false, error: 'Template nicht gefunden' }
  }

  // Parse the start time
  const [startHours, startMinutes] = startzeit.split(':').map(Number)
  const startTotalMinutes = startHours * 60 + startMinutes

  // Helper function to convert offset minutes to TIME string
  const minutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60) % 24
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Create zeitbloecke from template
  const zeitblockMap: Record<string, string> = {} // name -> id mapping for schichten

  if (template.zeitbloecke.length > 0) {
    const zeitblockInserts: ZeitblockInsert[] = template.zeitbloecke.map(
      (tz) => ({
        veranstaltung_id: veranstaltungId,
        name: tz.name,
        startzeit: minutesToTime(startTotalMinutes + tz.offset_minuten),
        endzeit: minutesToTime(
          startTotalMinutes + tz.offset_minuten + tz.dauer_minuten
        ),
        typ: tz.typ,
        sortierung: tz.sortierung,
      })
    )

    const { data: createdZeitbloecke, error: zeitblockError } = await supabase
      .from('zeitbloecke')
      .insert(zeitblockInserts as never[])
      .select('id, name')

    if (zeitblockError) {
      console.error('Error creating zeitbloecke from template:', zeitblockError)
      return { success: false, error: 'Fehler beim Erstellen der Zeitblöcke' }
    }

    // Build name -> id mapping
    createdZeitbloecke?.forEach((zb) => {
      zeitblockMap[zb.name] = zb.id
    })
  }

  // Create schichten from template
  if (template.schichten.length > 0) {
    const schichtInserts: AuffuehrungSchichtInsert[] = template.schichten.map(
      (ts) => ({
        veranstaltung_id: veranstaltungId,
        zeitblock_id: ts.zeitblock_name
          ? zeitblockMap[ts.zeitblock_name] || null
          : null,
        rolle: ts.rolle,
        anzahl_benoetigt: ts.anzahl_benoetigt,
      })
    )

    const { error: schichtError } = await supabase
      .from('auffuehrung_schichten')
      .insert(schichtInserts as never[])

    if (schichtError) {
      console.error('Error creating schichten from template:', schichtError)
      return { success: false, error: 'Fehler beim Erstellen der Schichten' }
    }
  }

  // Create ressourcen reservierungen from template
  if (template.ressourcen.length > 0) {
    const ressourcenInserts = template.ressourcen
      .filter((tr) => tr.ressource_id)
      .map((tr) => ({
        veranstaltung_id: veranstaltungId,
        ressource_id: tr.ressource_id!,
        menge: tr.menge,
      }))

    if (ressourcenInserts.length > 0) {
      const { error: ressourcenError } = await supabase
        .from('ressourcen_reservierungen')
        .insert(ressourcenInserts as never[])

      if (ressourcenError) {
        console.error(
          'Error creating ressourcen reservierungen from template:',
          ressourcenError
        )
        // Don't fail the whole operation for resource errors
      }
    }
  }

  // Create info_bloecke from template (with calculated times from offsets)
  if (template.info_bloecke && template.info_bloecke.length > 0) {
    const infoBlockInserts: InfoBlockInsert[] = template.info_bloecke.map(
      (ib) => ({
        veranstaltung_id: veranstaltungId,
        titel: ib.titel,
        beschreibung: ib.beschreibung,
        startzeit: minutesToTime(startTotalMinutes + ib.offset_minuten),
        endzeit: minutesToTime(
          startTotalMinutes + ib.offset_minuten + ib.dauer_minuten
        ),
        sortierung: ib.sortierung,
      })
    )

    const { error: infoBlockError } = await supabase
      .from('info_bloecke')
      .insert(infoBlockInserts as never[])

    if (infoBlockError) {
      console.error('Error creating info_bloecke from template:', infoBlockError)
      // Don't fail the whole operation for info block errors
    }
  }

  // Create sachleistungen from template
  if (template.sachleistungen && template.sachleistungen.length > 0) {
    const sachleistungInserts: SachleistungInsert[] = template.sachleistungen.map(
      (sl) => ({
        veranstaltung_id: veranstaltungId,
        name: sl.name,
        anzahl: sl.anzahl,
        beschreibung: sl.beschreibung,
      })
    )

    const { error: sachleistungError } = await supabase
      .from('sachleistungen')
      .insert(sachleistungInserts as never[])

    if (sachleistungError) {
      console.error(
        'Error creating sachleistungen from template:',
        sachleistungError
      )
      // Don't fail the whole operation for sachleistung errors
    }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  revalidatePath('/auffuehrungen')
  return { success: true }
}

/**
 * Create a template from an existing performance
 */
export async function createTemplateFromVeranstaltung(
  veranstaltungId: string,
  templateName: string,
  beschreibung?: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()

  // Get the veranstaltung start time
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('startzeit')
    .eq('id', veranstaltungId)
    .single()

  if (!veranstaltung?.startzeit) {
    return { success: false, error: 'Veranstaltung hat keine Startzeit' }
  }

  // Parse the start time
  const [startHours, startMinutes] = veranstaltung.startzeit
    .split(':')
    .map(Number)
  const startTotalMinutes = startHours * 60 + startMinutes

  // Create the template
  const { data: template, error: templateError } = await supabase
    .from('auffuehrung_templates')
    .insert({ name: templateName, beschreibung } as never)
    .select('id')
    .single()

  if (templateError || !template) {
    console.error('Error creating template:', templateError)
    return {
      success: false,
      error: templateError?.message || 'Fehler beim Erstellen',
    }
  }

  // Get existing zeitbloecke
  const { data: zeitbloecke } = await supabase
    .from('zeitbloecke')
    .select('id, veranstaltung_id, name, startzeit, endzeit, typ, sortierung, created_at')
    .eq('veranstaltung_id', veranstaltungId)
    .order('sortierung', { ascending: true })

  // Helper function to convert TIME to offset minutes
  const timeToOffset = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes - startTotalMinutes
  }

  const timeToDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    return endH * 60 + endM - (startH * 60 + startM)
  }

  // Create template zeitbloecke
  if (zeitbloecke && zeitbloecke.length > 0) {
    const templateZeitbloecke: TemplateZeitblockInsert[] = zeitbloecke.map(
      (zb) => ({
        template_id: template.id,
        name: zb.name,
        offset_minuten: timeToOffset(zb.startzeit),
        dauer_minuten: timeToDuration(zb.startzeit, zb.endzeit),
        typ: zb.typ,
        sortierung: zb.sortierung,
      })
    )

    await supabase
      .from('template_zeitbloecke')
      .insert(templateZeitbloecke as never[])
  }

  // Get existing schichten with zeitblock names
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select(
      `
      *,
      zeitblock:zeitbloecke(name)
    `
    )
    .eq('veranstaltung_id', veranstaltungId)

  // Create template schichten
  if (schichten && schichten.length > 0) {
    const templateSchichten: TemplateSchichtInsert[] = schichten.map((s) => ({
      template_id: template.id,
      zeitblock_name: (s.zeitblock as { name: string } | null)?.name || null,
      rolle: s.rolle,
      anzahl_benoetigt: s.anzahl_benoetigt,
    }))

    await supabase
      .from('template_schichten')
      .insert(templateSchichten as never[])
  }

  // Get existing ressourcen reservierungen
  const { data: ressourcen } = await supabase
    .from('ressourcen_reservierungen')
    .select('ressource_id, menge')
    .eq('veranstaltung_id', veranstaltungId)

  // Create template ressourcen
  if (ressourcen && ressourcen.length > 0) {
    const templateRessourcen: TemplateRessourceInsert[] = ressourcen.map(
      (r) => ({
        template_id: template.id,
        ressource_id: r.ressource_id,
        menge: r.menge,
      })
    )

    await supabase
      .from('template_ressourcen')
      .insert(templateRessourcen as never[])
  }

  revalidatePath('/templates')
  return { success: true, id: template.id }
}
