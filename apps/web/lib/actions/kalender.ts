'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type {
  Veranstaltung,
  Probe,
  Serienauffuehrung,
  Produktion,
} from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type KalenderEventTyp =
  | 'veranstaltung'
  | 'probe'
  | 'auffuehrung'
  | 'vereinsevent'
  | 'sonstiges'

export type KalenderEvent = {
  id: string
  titel: string
  beschreibung: string | null
  datum: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  typ: KalenderEventTyp
  status: string
  // References
  veranstaltung_id?: string | null
  probe_id?: string | null
  serie_id?: string | null
  produktion_id?: string | null
  stueck_id?: string | null
  // Display helpers
  produktion_titel?: string | null
  stueck_titel?: string | null
  // Edit info
  kann_bearbeiten: boolean
}

export type KalenderFilter = {
  produktionId?: string
  typ?: KalenderEventTyp | 'all'
  nurEigene?: boolean
}

// =============================================================================
// Fetch Calendar Events
// =============================================================================

/**
 * Get all calendar events (veranstaltungen, proben, serienauffuehrungen)
 */
export async function getKalenderEvents(
  startDatum?: string,
  endDatum?: string,
  filter?: KalenderFilter
): Promise<KalenderEvent[]> {
  const supabase = await createClient()
  const profile = await getUserProfile()

  const events: KalenderEvent[] = []
  const kannBearbeiten = profile
    ? hasPermission(profile.role, 'veranstaltungen:write')
    : false

  // Fetch Veranstaltungen
  let veranstaltungenQuery = supabase
    .from('veranstaltungen')
    .select('id, titel, beschreibung, datum, startzeit, endzeit, ort, max_teilnehmer, warteliste_aktiv, organisator_id, typ, status, helfer_template_id, helfer_status, public_helfer_token, max_schichten_pro_helfer, helfer_buchung_deadline, helfer_buchung_limit_aktiv, koordinator_id, created_at, updated_at')
    .order('datum', { ascending: true })

  if (startDatum) {
    veranstaltungenQuery = veranstaltungenQuery.gte('datum', startDatum)
  }
  if (endDatum) {
    veranstaltungenQuery = veranstaltungenQuery.lte('datum', endDatum)
  }
  if (filter?.typ && filter.typ !== 'all' && filter.typ !== 'probe') {
    // Map to veranstaltung typ
    const typMap: Record<string, string> = {
      auffuehrung: 'auffuehrung',
      vereinsevent: 'vereinsevent',
      sonstiges: 'sonstiges',
    }
    if (typMap[filter.typ]) {
      veranstaltungenQuery = veranstaltungenQuery.eq('typ', typMap[filter.typ])
    }
  }

  const { data: veranstaltungen, error: vError } = await veranstaltungenQuery

  if (!vError && veranstaltungen) {
    for (const v of veranstaltungen as Veranstaltung[]) {
      // Skip if filtering by typ=probe
      if (filter?.typ === 'probe') continue

      events.push({
        id: `v-${v.id}`,
        titel: v.titel,
        beschreibung: v.beschreibung,
        datum: v.datum,
        startzeit: v.startzeit,
        endzeit: v.endzeit,
        ort: v.ort,
        typ: v.typ as KalenderEventTyp,
        status: v.status,
        veranstaltung_id: v.id,
        kann_bearbeiten: kannBearbeiten,
      })
    }
  }

  // Fetch Proben (only if not filtering by other types)
  if (!filter?.typ || filter.typ === 'all' || filter.typ === 'probe') {
    let probenQuery = supabase
      .from('proben')
      .select(`
        *,
        stueck:stuecke(id, titel)
      `)
      .order('datum', { ascending: true })

    if (startDatum) {
      probenQuery = probenQuery.gte('datum', startDatum)
    }
    if (endDatum) {
      probenQuery = probenQuery.lte('datum', endDatum)
    }
    if (filter?.produktionId) {
      // Filter by stueck_id through produktion
      const { data: produktion } = await supabase
        .from('produktionen')
        .select('stueck_id')
        .eq('id', filter.produktionId)
        .single()

      if (produktion?.stueck_id) {
        probenQuery = probenQuery.eq('stueck_id', produktion.stueck_id)
      }
    }

    const { data: proben, error: pError } = await probenQuery

    if (!pError && proben) {
      type ProbeWithStueck = Probe & { stueck: { id: string; titel: string } | null }
      for (const p of proben as unknown as ProbeWithStueck[]) {
        events.push({
          id: `p-${p.id}`,
          titel: p.titel,
          beschreibung: p.beschreibung,
          datum: p.datum,
          startzeit: p.startzeit,
          endzeit: p.endzeit,
          ort: p.ort,
          typ: 'probe',
          status: p.status,
          probe_id: p.id,
          stueck_id: p.stueck_id,
          stueck_titel: p.stueck?.titel || null,
          kann_bearbeiten: kannBearbeiten,
        })
      }
    }
  }

  // Fetch Serienauffuehrungen (if filtering by produktion or showing all/auffuehrung)
  if (!filter?.typ || filter.typ === 'all' || filter.typ === 'auffuehrung') {
    let serienQuery = supabase
      .from('serienauffuehrungen')
      .select(`
        *,
        serie:auffuehrungsserien(
          id,
          name,
          standard_ort,
          produktion:produktionen(id, titel)
        )
      `)
      .order('datum', { ascending: true })

    if (startDatum) {
      serienQuery = serienQuery.gte('datum', startDatum)
    }
    if (endDatum) {
      serienQuery = serienQuery.lte('datum', endDatum)
    }

    const { data: serien, error: sError } = await serienQuery

    if (!sError && serien) {
      type SerieWithDetails = Serienauffuehrung & {
        serie: {
          id: string
          name: string
          standard_ort: string | null
          produktion: { id: string; titel: string } | null
        } | null
      }

      for (const s of serien as unknown as SerieWithDetails[]) {
        // Skip if filtering by produktion and not matching
        if (
          filter?.produktionId &&
          s.serie?.produktion?.id !== filter.produktionId
        ) {
          continue
        }

        // Skip if already linked to veranstaltung (avoid duplicates)
        if (s.veranstaltung_id) continue

        events.push({
          id: `s-${s.id}`,
          titel: `${s.serie?.produktion?.titel || 'Aufführung'} - ${s.typ}`,
          beschreibung: s.notizen,
          datum: s.datum,
          startzeit: s.startzeit,
          endzeit: null,
          ort: s.ort || s.serie?.standard_ort || null,
          typ: 'auffuehrung',
          status: 'geplant',
          serie_id: s.serie_id,
          produktion_id: s.serie?.produktion?.id || null,
          produktion_titel: s.serie?.produktion?.titel || null,
          kann_bearbeiten: kannBearbeiten,
        })
      }
    }
  }

  // Sort all events by date and time
  events.sort((a, b) => {
    const dateCompare = a.datum.localeCompare(b.datum)
    if (dateCompare !== 0) return dateCompare

    // Compare times if dates are equal
    const aTime = a.startzeit || '00:00'
    const bTime = b.startzeit || '00:00'
    return aTime.localeCompare(bTime)
  })

  return events
}

// =============================================================================
// Update Event (Drag & Drop)
// =============================================================================

/**
 * Update event date/time via drag & drop
 */
export async function updateKalenderEventDate(
  eventId: string,
  newDatum: string,
  newStartzeit?: string,
  newEndzeit?: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'veranstaltungen:write')) {
    return {
      success: false,
      error: 'Keine Berechtigung zum Bearbeiten von Terminen.',
    }
  }

  const supabase = await createClient()
  const [type, id] = eventId.split('-')

  if (type === 'v') {
    // Update Veranstaltung
    const updateData: Record<string, unknown> = { datum: newDatum }
    if (newStartzeit) updateData.startzeit = newStartzeit
    if (newEndzeit) updateData.endzeit = newEndzeit

    const { error } = await supabase
      .from('veranstaltungen')
      .update(updateData as never)
      .eq('id', id)

    if (error) {
      console.error('Error updating veranstaltung:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/veranstaltungen')
    revalidatePath('/kalender')
  } else if (type === 'p') {
    // Update Probe
    const updateData: Record<string, unknown> = { datum: newDatum }
    if (newStartzeit) updateData.startzeit = newStartzeit
    if (newEndzeit) updateData.endzeit = newEndzeit

    const { error } = await supabase
      .from('proben')
      .update(updateData as never)
      .eq('id', id)

    if (error) {
      console.error('Error updating probe:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/proben')
    revalidatePath('/kalender')
  } else if (type === 's') {
    // Update Serienauffuehrung
    const updateData: Record<string, unknown> = { datum: newDatum }
    if (newStartzeit) updateData.startzeit = newStartzeit

    const { error } = await supabase
      .from('serienauffuehrungen')
      .update(updateData as never)
      .eq('id', id)

    if (error) {
      console.error('Error updating serienauffuehrung:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/produktionen')
    revalidatePath('/kalender')
  } else {
    return { success: false, error: 'Unbekannter Event-Typ.' }
  }

  return { success: true }
}

// =============================================================================
// Fetch Produktionen for Filter
// =============================================================================

/**
 * Get all Produktionen for filter dropdown
 */
export async function getProduktionenForFilter(): Promise<
  Pick<Produktion, 'id' | 'titel' | 'status'>[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('produktionen')
    .select('id, titel, status')
    .not('status', 'eq', 'abgesagt')
    .order('titel', { ascending: true })

  if (error) {
    console.error('Error fetching produktionen:', error)
    return []
  }

  return data || []
}

// =============================================================================
// iCal Export
// =============================================================================

/**
 * Generate iCal content from events
 */
export async function generateICalExport(
  events: KalenderEvent[]
): Promise<string> {
  let ical =
    'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BackstagePass//TGW Kalender//DE\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:TGW Kalender\r\n'

  for (const event of events) {
    // Skip cancelled events
    if (event.status === 'abgesagt') continue

    const startDate = event.datum.replace(/-/g, '')
    const startTime = event.startzeit
      ? event.startzeit.replace(/:/g, '').substring(0, 4) + '00'
      : '000000'
    const endTime = event.endzeit
      ? event.endzeit.replace(/:/g, '').substring(0, 4) + '00'
      : '235959'
    const uid = `${event.id}@backstagepass.tgw`

    ical += 'BEGIN:VEVENT\r\n'
    ical += `UID:${uid}\r\n`
    ical += `DTSTART:${startDate}T${startTime}\r\n`
    ical += `DTEND:${startDate}T${endTime}\r\n`
    ical += `SUMMARY:${escapeICalText(event.titel)}\r\n`

    if (event.beschreibung) {
      ical += `DESCRIPTION:${escapeICalText(event.beschreibung)}\r\n`
    }
    if (event.ort) {
      ical += `LOCATION:${escapeICalText(event.ort)}\r\n`
    }

    // Add category based on type
    const categoryMap: Record<string, string> = {
      probe: 'PROBE',
      auffuehrung: 'AUFFUEHRUNG',
      vereinsevent: 'VEREINSEVENT',
      sonstiges: 'SONSTIGES',
    }
    ical += `CATEGORIES:${categoryMap[event.typ] || 'SONSTIGES'}\r\n`

    ical += 'END:VEVENT\r\n'
  }

  ical += 'END:VCALENDAR\r\n'
  return ical
}

/**
 * Escape special characters for iCal format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}
