'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { getTemplate } from './templates'
import type {
  ZeitblockInsert,
  AuffuehrungSchichtInsert,
  InfoBlockInsert,
  SachleistungInsert,
} from '../supabase/types'

/**
 * Result of generating shifts from a template
 */
export type GenerateSchichtenResult = {
  success: boolean
  error?: string
  zeitbloecke?: number
  schichten?: number
  slots?: number
  infoBloecke?: number
  sachleistungen?: number
}

/**
 * Generate shifts from a template for a specific performance
 *
 * This is the core function of the shift generation system.
 * It copies all template data (time blocks, shifts, info blocks, sachleistungen)
 * and creates concrete instances with calculated times.
 *
 * @param veranstaltungId - The performance to generate shifts for
 * @param templateId - The template to use
 * @returns Result with counts of created items or error
 */
export async function generateSchichtenFromTemplate(
  veranstaltungId: string,
  templateId: string
): Promise<GenerateSchichtenResult> {
  // Check permission
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get the template with all details
  const template = await getTemplate(templateId)
  if (!template) {
    return { success: false, error: 'Template nicht gefunden' }
  }

  // Get the veranstaltung to check start time and existing shifts
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, startzeit, helfer_status')
    .eq('id', veranstaltungId)
    .single()

  if (veranstaltungError || !veranstaltung) {
    console.error('Error fetching veranstaltung:', veranstaltungError)
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  // Check if shifts already exist
  const { count: existingSchichtenCount } = await supabase
    .from('auffuehrung_schichten')
    .select('id', { count: 'exact', head: true })
    .eq('veranstaltung_id', veranstaltungId)

  if (existingSchichtenCount && existingSchichtenCount > 0) {
    return {
      success: false,
      error: `Diese Veranstaltung hat bereits ${existingSchichtenCount} Schichten. Bitte zuerst zuruecksetzen.`,
    }
  }

  let createdZeitbloecke = 0
  let createdSchichten = 0
  let createdSlots = 0
  let createdInfoBloecke = 0
  let createdSachleistungen = 0

  // Map zeitblock name to created zeitblock ID
  const zeitblockMap: Record<string, string> = {}

  try {
    // 1. Create zeitbloecke from template
    if (template.zeitbloecke.length > 0) {
      const zeitblockInserts: ZeitblockInsert[] = template.zeitbloecke.map((tz) => ({
        veranstaltung_id: veranstaltungId,
        name: tz.name,
        startzeit: tz.startzeit,
        endzeit: tz.endzeit,
        typ: tz.typ,
        sortierung: tz.sortierung,
      }))

      const { data: createdZeitblockData, error: zeitblockError } = await supabase
        .from('zeitbloecke')
        .insert(zeitblockInserts as never[])
        .select('id, name')

      if (zeitblockError) {
        console.error('Error creating zeitbloecke:', zeitblockError)
        throw new Error('Fehler beim Erstellen der Zeitbloecke')
      }

      // Build name -> id mapping
      createdZeitblockData?.forEach((zb) => {
        zeitblockMap[zb.name] = zb.id
      })

      createdZeitbloecke = createdZeitblockData?.length ?? 0
    }

    // 2. Create schichten from template
    if (template.schichten.length > 0) {
      const schichtInserts: AuffuehrungSchichtInsert[] = template.schichten.map((ts) => ({
        veranstaltung_id: veranstaltungId,
        zeitblock_id: ts.zeitblock_name ? zeitblockMap[ts.zeitblock_name] ?? null : null,
        rolle: ts.rolle,
        anzahl_benoetigt: ts.anzahl_benoetigt,
        sichtbarkeit: ts.nur_mitglieder ? 'intern' as const : 'public' as const,
      }))

      const { data: createdSchichtData, error: schichtError } = await supabase
        .from('auffuehrung_schichten')
        .insert(schichtInserts as never[])
        .select('id, anzahl_benoetigt')

      if (schichtError) {
        console.error('Error creating schichten:', schichtError)
        throw new Error('Fehler beim Erstellen der Schichten')
      }

      createdSchichten = createdSchichtData?.length ?? 0

      // Count total slots (sum of anzahl_benoetigt)
      createdSlots = createdSchichtData?.reduce((sum, s) => sum + s.anzahl_benoetigt, 0) ?? 0
    }

    // 3. Create info_bloecke from template
    if (template.info_bloecke && template.info_bloecke.length > 0) {
      const infoBlockInserts: InfoBlockInsert[] = template.info_bloecke.map((ib) => ({
        veranstaltung_id: veranstaltungId,
        titel: ib.titel,
        beschreibung: ib.beschreibung,
        startzeit: ib.startzeit,
        endzeit: ib.endzeit,
        sortierung: ib.sortierung,
      }))

      const { data: createdInfoData, error: infoBlockError } = await supabase
        .from('info_bloecke')
        .insert(infoBlockInserts as never[])
        .select('id')

      if (infoBlockError) {
        console.error('Error creating info_bloecke:', infoBlockError)
        // Don't throw, info blocks are not critical
      } else {
        createdInfoBloecke = createdInfoData?.length ?? 0
      }
    }

    // 4. Create sachleistungen from template
    if (template.sachleistungen && template.sachleistungen.length > 0) {
      const sachleistungInserts: SachleistungInsert[] = template.sachleistungen.map((sl) => ({
        veranstaltung_id: veranstaltungId,
        name: sl.name,
        anzahl: sl.anzahl,
        beschreibung: sl.beschreibung,
      }))

      const { data: createdSachData, error: sachleistungError } = await supabase
        .from('sachleistungen')
        .insert(sachleistungInserts as never[])
        .select('id')

      if (sachleistungError) {
        console.error('Error creating sachleistungen:', sachleistungError)
        // Don't throw, sachleistungen are not critical
      } else {
        createdSachleistungen = createdSachData?.length ?? 0
      }
    }

    // 5. Update veranstaltung with template reference and status
    const { error: updateError } = await supabase
      .from('veranstaltungen')
      .update({
        helfer_template_id: templateId,
        helfer_status: 'entwurf',
      } as never)
      .eq('id', veranstaltungId)

    if (updateError) {
      console.error('Error updating veranstaltung:', updateError)
      // Don't throw, this is informational
    }

    // Revalidate paths
    revalidatePath(`/auffuehrungen/${veranstaltungId}`)
    revalidatePath(`/auffuehrungen/${veranstaltungId}/schichten`)
    revalidatePath(`/auffuehrungen/${veranstaltungId}/helfer-koordination`)
    revalidatePath('/auffuehrungen')

    return {
      success: true,
      zeitbloecke: createdZeitbloecke,
      schichten: createdSchichten,
      slots: createdSlots,
      infoBloecke: createdInfoBloecke,
      sachleistungen: createdSachleistungen,
    }
  } catch (error) {
    console.error('Error in generateSchichtenFromTemplate:', error)

    // Attempt to clean up on error (rollback)
    // Note: Supabase doesn't support true transactions in the JS client,
    // so we do manual cleanup
    try {
      await supabase
        .from('zeitbloecke')
        .delete()
        .eq('veranstaltung_id', veranstaltungId)

      await supabase
        .from('auffuehrung_schichten')
        .delete()
        .eq('veranstaltung_id', veranstaltungId)

      await supabase
        .from('info_bloecke')
        .delete()
        .eq('veranstaltung_id', veranstaltungId)

      await supabase
        .from('sachleistungen')
        .delete()
        .eq('veranstaltung_id', veranstaltungId)
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten',
    }
  }
}

/**
 * Reset (delete) all generated shifts for a veranstaltung
 * This allows re-generating from a different template
 */
export async function resetSchichten(
  veranstaltungId: string
): Promise<{ success: boolean; error?: string }> {
  // Only admins can reset shifts
  await requirePermission('admin:access')

  const supabase = await createClient()

  try {
    // Delete all related data
    const { error: zeitblockError } = await supabase
      .from('zeitbloecke')
      .delete()
      .eq('veranstaltung_id', veranstaltungId)

    if (zeitblockError) {
      console.error('Error deleting zeitbloecke:', zeitblockError)
      throw new Error('Fehler beim Loeschen der Zeitbloecke')
    }

    const { error: schichtError } = await supabase
      .from('auffuehrung_schichten')
      .delete()
      .eq('veranstaltung_id', veranstaltungId)

    if (schichtError) {
      console.error('Error deleting schichten:', schichtError)
      throw new Error('Fehler beim Loeschen der Schichten')
    }

    const { error: infoError } = await supabase
      .from('info_bloecke')
      .delete()
      .eq('veranstaltung_id', veranstaltungId)

    if (infoError) {
      console.error('Error deleting info_bloecke:', infoError)
      // Non-critical, continue
    }

    const { error: sachError } = await supabase
      .from('sachleistungen')
      .delete()
      .eq('veranstaltung_id', veranstaltungId)

    if (sachError) {
      console.error('Error deleting sachleistungen:', sachError)
      // Non-critical, continue
    }

    // Reset template reference and status
    const { error: updateError } = await supabase
      .from('veranstaltungen')
      .update({
        helfer_template_id: null,
        helfer_status: null,
      } as never)
      .eq('id', veranstaltungId)

    if (updateError) {
      console.error('Error resetting veranstaltung:', updateError)
    }

    // Revalidate paths
    revalidatePath(`/auffuehrungen/${veranstaltungId}`)
    revalidatePath(`/auffuehrungen/${veranstaltungId}/schichten`)
    revalidatePath(`/auffuehrungen/${veranstaltungId}/helfer-koordination`)
    revalidatePath('/auffuehrungen')

    return { success: true }
  } catch (error) {
    console.error('Error in resetSchichten:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten',
    }
  }
}

/**
 * Get the current state of shifts for a veranstaltung
 */
export async function getSchichtenStatus(veranstaltungId: string): Promise<{
  hasSchichten: boolean
  zeitbloeckeCount: number
  schichtenCount: number
  slotsCount: number
  zugewiesenCount: number
  templateId: string | null
  status: string | null
}> {
  const supabase = await createClient()

  // Get veranstaltung info
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('helfer_template_id, helfer_status')
    .eq('id', veranstaltungId)
    .single()

  // Count zeitbloecke
  const { count: zeitbloeckeCount } = await supabase
    .from('zeitbloecke')
    .select('id', { count: 'exact', head: true })
    .eq('veranstaltung_id', veranstaltungId)

  // Count schichten and sum anzahl_benoetigt
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select('id, anzahl_benoetigt')
    .eq('veranstaltung_id', veranstaltungId)

  const schichtenCount = schichten?.length ?? 0
  const slotsCount = schichten?.reduce((sum, s) => sum + s.anzahl_benoetigt, 0) ?? 0

  // Count zuweisungen
  const { count: zugewiesenCount } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id', { count: 'exact', head: true })
    .in(
      'schicht_id',
      schichten?.map((s) => s.id) ?? []
    )

  return {
    hasSchichten: schichtenCount > 0,
    zeitbloeckeCount: zeitbloeckeCount ?? 0,
    schichtenCount,
    slotsCount,
    zugewiesenCount: zugewiesenCount ?? 0,
    templateId: veranstaltung?.helfer_template_id ?? null,
    status: veranstaltung?.helfer_status ?? null,
  }
}
