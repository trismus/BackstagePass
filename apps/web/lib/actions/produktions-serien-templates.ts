'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { generateSchichtenFromTemplate } from './schicht-generator'
import type {
  ProduktionsSerieTemplateMitDetails,
  Wochentag,
} from '../supabase/types'

// =============================================================================
// Get Serie Template Mappings
// =============================================================================

/**
 * Get all template mappings for a series
 */
export async function getSerieTemplateMappings(
  serieId: string
): Promise<ProduktionsSerieTemplateMitDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('produktions_serie_templates')
    .select(`
      *,
      template:auffuehrung_templates(id, name)
    `)
    .eq('serie_id', serieId)
    .order('wochentag', { ascending: true })

  if (error) {
    console.error('Error fetching serie template mappings:', error)
    return []
  }

  return (data as ProduktionsSerieTemplateMitDetails[]) || []
}

// =============================================================================
// Assign Templates to Serie (by Weekday)
// =============================================================================

export type WeekdayMapping = {
  wochentag: Wochentag
  template_id: string
}

/**
 * Assign templates to a series based on weekday
 * Replaces all existing mappings
 */
export async function assignTemplatesZurSerie(
  serieId: string,
  mappings: WeekdayMapping[]
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('produktionen:write')

  const supabase = await createClient()

  // First, delete all existing mappings for this series
  const { error: deleteError } = await supabase
    .from('produktions_serie_templates')
    .delete()
    .eq('serie_id', serieId)

  if (deleteError) {
    console.error('Error deleting existing mappings:', deleteError)
    return { success: false, error: 'Fehler beim Aktualisieren der Zuordnungen' }
  }

  // If no new mappings, we're done
  if (mappings.length === 0) {
    revalidatePath(`/produktionen`)
    return { success: true }
  }

  // Insert new mappings
  const inserts = mappings.map((m) => ({
    serie_id: serieId,
    wochentag: m.wochentag,
    template_id: m.template_id,
  }))

  const { error: insertError } = await supabase
    .from('produktions_serie_templates')
    .insert(inserts as never[])

  if (insertError) {
    console.error('Error inserting new mappings:', insertError)
    return { success: false, error: 'Fehler beim Speichern der Zuordnungen' }
  }

  revalidatePath(`/produktionen`)
  return { success: true }
}

// =============================================================================
// Bulk Generate Schichten
// =============================================================================

export type BulkGenerateResult = {
  veranstaltungId: string
  titel: string
  datum: string
  wochentag: Wochentag
  templateName: string
  success: boolean
  error?: string
  zeitbloecke?: number
  schichten?: number
  slots?: number
}

/**
 * Get preview of what will be generated for a series
 */
export async function getBulkGeneratePreview(serieId: string): Promise<{
  auffuehrungen: {
    id: string
    veranstaltungId: string | null
    titel: string
    datum: string
    wochentag: Wochentag
    templateId: string | null
    templateName: string | null
    hasSchichten: boolean
    helferStatus: string | null
  }[]
  mappings: ProduktionsSerieTemplateMitDetails[]
}> {
  const supabase = await createClient()

  // Get series with auffuehrungen
  const { data: serienauffuehrungen } = await supabase
    .from('serienauffuehrungen')
    .select(`
      id,
      datum,
      veranstaltung_id,
      veranstaltung:veranstaltungen(
        id,
        titel,
        helfer_template_id,
        helfer_status
      )
    `)
    .eq('serie_id', serieId)
    .order('datum', { ascending: true })

  // Get template mappings
  const mappings = await getSerieTemplateMappings(serieId)

  // Build preview data
  const auffuehrungen = await Promise.all(
    (serienauffuehrungen || []).map(async (sa) => {
      const datum = new Date(sa.datum)
      const wochentag = datum.getDay() as Wochentag

      // Find template for this weekday
      const mapping = mappings.find((m) => m.wochentag === wochentag)

      // Check if schichten already exist
      let hasSchichten = false
      if (sa.veranstaltung_id) {
        const { count } = await supabase
          .from('auffuehrung_schichten')
          .select('id', { count: 'exact', head: true })
          .eq('veranstaltung_id', sa.veranstaltung_id)
        hasSchichten = (count ?? 0) > 0
      }

      // Handle the joined veranstaltung data - Supabase returns single object for 1:1 joins
      const veranstaltung = sa.veranstaltung as unknown as {
        id: string
        titel: string
        helfer_template_id: string | null
        helfer_status: string | null
      } | null

      return {
        id: sa.id,
        veranstaltungId: sa.veranstaltung_id,
        titel: veranstaltung?.titel ?? `Auffuehrung am ${sa.datum}`,
        datum: sa.datum,
        wochentag,
        templateId: mapping?.template_id ?? null,
        templateName: mapping?.template?.name ?? null,
        hasSchichten,
        helferStatus: veranstaltung?.helfer_status ?? null,
      }
    })
  )

  return { auffuehrungen, mappings }
}

/**
 * Bulk generate schichten for all (or selected) auffuehrungen in a series
 */
export async function bulkGenerateSchichten(
  serieId: string,
  veranstaltungIds: string[]
): Promise<{
  success: boolean
  results: BulkGenerateResult[]
  successCount: number
  errorCount: number
}> {
  await requirePermission('produktionen:write')

  // Get preview to have all the data we need
  const preview = await getBulkGeneratePreview(serieId)

  const results: BulkGenerateResult[] = []
  let successCount = 0
  let errorCount = 0

  // Filter to only selected veranstaltungen that have templates
  const toProcess = preview.auffuehrungen.filter(
    (a) =>
      a.veranstaltungId &&
      veranstaltungIds.includes(a.veranstaltungId) &&
      a.templateId &&
      !a.hasSchichten
  )

  // Process each veranstaltung
  for (const auff of toProcess) {
    try {
      const result = await generateSchichtenFromTemplate(
        auff.veranstaltungId!,
        auff.templateId!
      )

      if (result.success) {
        successCount++
        results.push({
          veranstaltungId: auff.veranstaltungId!,
          titel: auff.titel,
          datum: auff.datum,
          wochentag: auff.wochentag,
          templateName: auff.templateName ?? 'Unbekannt',
          success: true,
          zeitbloecke: result.zeitbloecke,
          schichten: result.schichten,
          slots: result.slots,
        })
      } else {
        errorCount++
        results.push({
          veranstaltungId: auff.veranstaltungId!,
          titel: auff.titel,
          datum: auff.datum,
          wochentag: auff.wochentag,
          templateName: auff.templateName ?? 'Unbekannt',
          success: false,
          error: result.error,
        })
      }
    } catch (error) {
      errorCount++
      results.push({
        veranstaltungId: auff.veranstaltungId!,
        titel: auff.titel,
        datum: auff.datum,
        wochentag: auff.wochentag,
        templateName: auff.templateName ?? 'Unbekannt',
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      })
    }
  }

  revalidatePath(`/produktionen`)
  revalidatePath(`/auffuehrungen`)

  return {
    success: errorCount === 0,
    results,
    successCount,
    errorCount,
  }
}
