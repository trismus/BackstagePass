'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type { ZeitblockTyp } from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type HelferStatus = 'eingecheckt' | 'erwartet' | 'no_show'

export type LiveHelfer = {
  id: string
  name: string
  status: HelferStatus
  checkedInAt: string | null
}

export type LiveSchicht = {
  id: string
  rolle: string
  benoetigt: number
  besetzt: number
  eingecheckt: number
  helfer: LiveHelfer[]
  auslastung: number
  statusColor: 'green' | 'yellow' | 'orange' | 'red'
}

export type LiveZeitblock = {
  id: string
  name: string
  startzeit: string
  endzeit: string
  typ: ZeitblockTyp
  status: 'geplant' | 'aktiv' | 'abgeschlossen'
  schichten: LiveSchicht[]
}

export type LiveAlert = {
  id: string
  typ: 'kritisch' | 'warnung'
  message: string
  zeitblock: string
  rolle: string
  createdAt: string
}

export type LiveBoardData = {
  veranstaltung: {
    id: string
    titel: string
    datum: string
    startzeit: string | null
    endzeit: string | null
  }
  zeitbloecke: LiveZeitblock[]
  alerts: LiveAlert[]
  stats: {
    total: number
    eingecheckt: number
    erwartet: number
    noShow: number
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getZeitblockStatus(
  startzeit: string,
  endzeit: string,
  datum: string
): 'geplant' | 'aktiv' | 'abgeschlossen' {
  const now = new Date()
  const start = new Date(`${datum}T${startzeit}`)
  const end = new Date(`${datum}T${endzeit}`)

  if (now < start) return 'geplant'
  if (now > end) return 'abgeschlossen'
  return 'aktiv'
}

function getSchichtStatusColor(
  besetzt: number,
  benoetigt: number,
  eingecheckt: number,
  noShow: number
): 'green' | 'yellow' | 'orange' | 'red' {
  // Critical: has no-shows or severely understaffed
  if (noShow > 0 || besetzt < benoetigt * 0.5) {
    return 'red'
  }
  // All checked in and fully staffed
  if (eingecheckt === besetzt && besetzt >= benoetigt) {
    return 'green'
  }
  // Fully staffed but not all checked in
  if (besetzt >= benoetigt) {
    return 'yellow'
  }
  // Partially staffed
  return 'orange'
}

// =============================================================================
// Data Fetching
// =============================================================================

/**
 * Get live board data for a veranstaltung
 */
export async function getLiveBoardData(
  veranstaltungId: string
): Promise<LiveBoardData | null> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get veranstaltung
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, startzeit, endzeit')
    .eq('id', veranstaltungId)
    .single()

  if (veranstaltungError || !veranstaltung) {
    console.error('Error fetching veranstaltung:', veranstaltungError)
    return null
  }

  // Get zeitbloecke
  const { data: zeitbloecke, error: zeitblockError } = await supabase
    .from('zeitbloecke')
    .select('id, name, startzeit, endzeit, typ, sortierung')
    .eq('veranstaltung_id', veranstaltungId)
    .order('sortierung', { ascending: true })

  if (zeitblockError) {
    console.error('Error fetching zeitbloecke:', zeitblockError)
    return null
  }

  // Get all schichten with zuweisungen
  const { data: schichten, error: schichtenError } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      anzahl_benoetigt,
      zeitblock_id,
      zuweisungen:auffuehrung_zuweisungen(
        id,
        checked_in_at,
        no_show,
        status,
        person:personen(id, vorname, nachname)
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)

  if (schichtenError) {
    console.error('Error fetching schichten:', schichtenError)
    return null
  }

  // Build live data
  const alerts: LiveAlert[] = []
  const totalStats = { total: 0, eingecheckt: 0, erwartet: 0, noShow: 0 }

  const liveZeitbloecke: LiveZeitblock[] = (zeitbloecke || []).map((zb) => {
    const zbSchichten = (schichten || []).filter((s) => s.zeitblock_id === zb.id)
    const zbStatus = getZeitblockStatus(zb.startzeit, zb.endzeit, veranstaltung.datum)

    const liveSchichten: LiveSchicht[] = zbSchichten.map((schicht) => {
      const zuweisungen = (schicht.zuweisungen || []).filter(
        (z: { status: string }) => z.status !== 'abgesagt'
      ) as Array<{
        id: unknown
        checked_in_at: unknown
        no_show: unknown
        status: string
        person: unknown
      }>

      const helfer: LiveHelfer[] = zuweisungen.map((z) => {
        // Supabase returns person as array or single object depending on query
        const personData = z.person
        const person = (Array.isArray(personData) ? personData[0] : personData) as
          | { vorname: string; nachname: string }
          | null

        let status: HelferStatus = 'erwartet'
        if (z.no_show) status = 'no_show'
        else if (z.checked_in_at) status = 'eingecheckt'

        return {
          id: z.id as string,
          name: person ? `${person.vorname} ${person.nachname}` : 'Unbekannt',
          status,
          checkedInAt: z.checked_in_at as string | null,
        }
      })

      const besetzt = helfer.length
      const eingecheckt = helfer.filter((h) => h.status === 'eingecheckt').length
      const noShow = helfer.filter((h) => h.status === 'no_show').length
      const erwartet = helfer.filter((h) => h.status === 'erwartet').length

      // Update total stats
      totalStats.total += besetzt
      totalStats.eingecheckt += eingecheckt
      totalStats.noShow += noShow
      totalStats.erwartet += erwartet

      // Generate alerts for critical situations
      if (noShow >= 2 && zbStatus === 'aktiv') {
        alerts.push({
          id: `${schicht.id}-noshow`,
          typ: 'kritisch',
          message: `${schicht.rolle} hat ${noShow} No-Shows!`,
          zeitblock: zb.name,
          rolle: schicht.rolle,
          createdAt: new Date().toISOString(),
        })
      }

      // Check for understaffing alert (15 minutes before start)
      const zbStart = new Date(`${veranstaltung.datum}T${zb.startzeit}`)
      const fifteenMinutesBefore = new Date(zbStart.getTime() - 15 * 60 * 1000)
      const now = new Date()

      if (
        now >= fifteenMinutesBefore &&
        now < zbStart &&
        besetzt < schicht.anzahl_benoetigt
      ) {
        alerts.push({
          id: `${schicht.id}-understaffed`,
          typ: 'warnung',
          message: `${schicht.rolle} beginnt in wenigen Minuten und ist unterbesetzt`,
          zeitblock: zb.name,
          rolle: schicht.rolle,
          createdAt: new Date().toISOString(),
        })
      }

      return {
        id: schicht.id,
        rolle: schicht.rolle,
        benoetigt: schicht.anzahl_benoetigt,
        besetzt,
        eingecheckt,
        helfer,
        auslastung: schicht.anzahl_benoetigt > 0
          ? Math.round((besetzt / schicht.anzahl_benoetigt) * 100)
          : 100,
        statusColor: getSchichtStatusColor(besetzt, schicht.anzahl_benoetigt, eingecheckt, noShow),
      }
    })

    return {
      id: zb.id,
      name: zb.name,
      startzeit: zb.startzeit,
      endzeit: zb.endzeit,
      typ: zb.typ as ZeitblockTyp,
      status: zbStatus,
      schichten: liveSchichten,
    }
  })

  return {
    veranstaltung: {
      id: veranstaltung.id,
      titel: veranstaltung.titel,
      datum: veranstaltung.datum,
      startzeit: veranstaltung.startzeit,
      endzeit: veranstaltung.endzeit,
    },
    zeitbloecke: liveZeitbloecke,
    alerts,
    stats: totalStats,
  }
}
