'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'

// =============================================================================
// Types
// =============================================================================

export type ExportSchicht = {
  zeitblockName: string
  zeitblockStart: string
  zeitblockEnd: string
  schichtId: string
  rolle: string
  benoetigt: number
  helfer: {
    name: string
    email: string
    telefon: string
    status: string
    isExtern: boolean
  }[]
}

export type ExportHelferUebersicht = {
  name: string
  email: string
  telefon: string
  anzahlSchichten: number
  schichten: string[]
}

export type ExportData = {
  veranstaltung: {
    titel: string
    datum: string
    ort: string
    startzeit: string
    endzeit: string
  }
  schichten: ExportSchicht[]
  helferUebersicht: ExportHelferUebersicht[]
  generatedAt: string
}

// =============================================================================
// Data Fetching for Export
// =============================================================================

/**
 * Get all data needed for export
 */
export async function getExportData(
  veranstaltungId: string
): Promise<ExportData | null> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get veranstaltung
  const { data: veranstaltung } = await supabase
    .from('veranstaltungen')
    .select('titel, datum, ort, startzeit, endzeit')
    .eq('id', veranstaltungId)
    .single()

  if (!veranstaltung) {
    return null
  }

  // Get zeitbloecke with schichten
  const { data: zeitbloecke } = await supabase
    .from('zeitbloecke')
    .select(`
      id,
      name,
      startzeit,
      endzeit,
      schichten:auffuehrung_schichten(
        id,
        rolle,
        anzahl_benoetigt,
        zuweisungen:auffuehrung_zuweisungen(
          id,
          status,
          person:personen(id, vorname, nachname, email, telefon)
        )
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .order('sortierung', { ascending: true })

  // Get orphan schichten
  const { data: orphanSchichten } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      anzahl_benoetigt,
      zuweisungen:auffuehrung_zuweisungen(
        id,
        status,
        person:personen(id, vorname, nachname, email, telefon)
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .is('zeitblock_id', null)

  // Build export schichten
  const schichten: ExportSchicht[] = []
  const helferMap: Record<string, {
    name: string
    email: string
    telefon: string
    schichten: string[]
  }> = {}

  interface ZuweisungType {
    id: string
    status: string
    person: { id: string; vorname: string; nachname: string; email: string | null; telefon: string | null } | null
  }

  interface SchichtType {
    id: string
    rolle: string
    anzahl_benoetigt: number
    zuweisungen: ZuweisungType[]
  }

  const processSchicht = (
    s: SchichtType,
    zeitblockName: string,
    zeitblockStart: string,
    zeitblockEnd: string
  ) => {
    const helfer = (s.zuweisungen || [])
      .filter((z) => z.status !== 'abgesagt')
      .map((z) => {
        const person = z.person
        const name = person ? `${person.vorname} ${person.nachname}` : 'Unbekannt'
        const email = person?.email || ''
        const telefon = person?.telefon || ''

        // Track in helferMap
        if (person?.id) {
          if (!helferMap[person.id]) {
            helferMap[person.id] = {
              name,
              email,
              telefon,
              schichten: [],
            }
          }
          helferMap[person.id].schichten.push(`${s.rolle} (${zeitblockStart} - ${zeitblockEnd})`)
        }

        return {
          name,
          email,
          telefon,
          status: z.status,
          isExtern: false,
        }
      })

    schichten.push({
      zeitblockName,
      zeitblockStart,
      zeitblockEnd,
      schichtId: s.id,
      rolle: s.rolle,
      benoetigt: s.anzahl_benoetigt,
      helfer,
    })
  }

  // Process zeitbloecke
  zeitbloecke?.forEach((zb) => {
    (zb.schichten as unknown as SchichtType[])?.forEach((s) => {
      processSchicht(s, zb.name, zb.startzeit, zb.endzeit)
    })
  })

  // Process orphan schichten
  ;(orphanSchichten as unknown as SchichtType[])?.forEach((s) => {
    processSchicht(
      s,
      'Ohne Zeitblock',
      veranstaltung.startzeit || '00:00',
      veranstaltung.endzeit || '23:59'
    )
  })

  // Build helper overview
  const helferUebersicht: ExportHelferUebersicht[] = Object.values(helferMap)
    .map((h) => ({
      ...h,
      anzahlSchichten: h.schichten.length,
    }))
    .sort((a, b) => b.anzahlSchichten - a.anzahlSchichten)

  return {
    veranstaltung: {
      titel: veranstaltung.titel,
      datum: veranstaltung.datum,
      ort: veranstaltung.ort || '',
      startzeit: veranstaltung.startzeit || '',
      endzeit: veranstaltung.endzeit || '',
    },
    schichten,
    helferUebersicht,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Generate Excel data (returns JSON that can be converted to Excel client-side)
 */
export async function generateExcelData(
  veranstaltungId: string
): Promise<{
  success: boolean
  data?: {
    schichten: Record<string, string | number>[]
    helfer: Record<string, string | number>[]
    meta: Record<string, string>
  }
  error?: string
}> {
  const exportData = await getExportData(veranstaltungId)

  if (!exportData) {
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  // Build schichten sheet data
  const schichtenRows: Record<string, string | number>[] = []

  exportData.schichten.forEach((s) => {
    if (s.helfer.length === 0) {
      // Empty slot
      schichtenRows.push({
        Zeitblock: s.zeitblockName,
        Start: s.zeitblockStart,
        Ende: s.zeitblockEnd,
        Rolle: s.rolle,
        'Helfer Name': '',
        'Helfer Email': '',
        'Helfer Telefon': '',
        Status: 'Unbesetzt',
      })
    } else {
      s.helfer.forEach((h) => {
        schichtenRows.push({
          Zeitblock: s.zeitblockName,
          Start: s.zeitblockStart,
          Ende: s.zeitblockEnd,
          Rolle: s.rolle,
          'Helfer Name': h.name,
          'Helfer Email': h.email,
          'Helfer Telefon': h.telefon,
          Status: h.status,
        })
      })
    }
  })

  // Build helfer sheet data
  const helferRows = exportData.helferUebersicht.map((h) => ({
    Name: h.name,
    Email: h.email,
    Telefon: h.telefon,
    'Anzahl Schichten': h.anzahlSchichten,
    Schichten: h.schichten.join('; '),
  }))

  // Build meta
  const meta = {
    Veranstaltung: exportData.veranstaltung.titel,
    Datum: new Date(exportData.veranstaltung.datum).toLocaleDateString('de-CH'),
    Ort: exportData.veranstaltung.ort,
    'Generiert am': new Date(exportData.generatedAt).toLocaleString('de-CH'),
  }

  return {
    success: true,
    data: {
      schichten: schichtenRows,
      helfer: helferRows,
      meta,
    },
  }
}
