'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'

// =============================================================================
// Types
// =============================================================================

export type ZeitblockAuslastung = {
  id: string
  name: string
  startzeit: string
  endzeit: string
  gesamtSlots: number
  besetztSlots: number
  auslastungProzent: number
}

export type KritischeSchicht = {
  id: string
  rolle: string
  zeitblockName: string | null
  startzeit: string | null
  endzeit: string | null
  benoetigt: number
  besetzt: number
  auslastungProzent: number
}

export type TopHelfer = {
  id: string
  name: string
  email: string | null
  anzahlSchichten: number
}

export type AnmeldungsTrendPunkt = {
  datum: string
  anzahl: number
  kumuliert: number
}

export type HelferStatistik = {
  // Overview
  totalSlots: number
  besetztSlots: number
  offeneSlots: number
  auslastungProzent: number

  // By Zeitblock
  zeitblockAuslastung: ZeitblockAuslastung[]

  // Internal vs External
  interneCount: number
  externeCount: number

  // Trend
  anmeldungsTrend: AnmeldungsTrendPunkt[]

  // Critical shifts
  kritischeSchichten: KritischeSchicht[]

  // Top helpers
  topHelfer: TopHelfer[]
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Get comprehensive statistics for a performance's helper list
 */
export async function getHelferStatistik(
  veranstaltungId: string
): Promise<HelferStatistik | null> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get zeitbloecke with schichten
  const { data: zeitbloecke, error: zeitblockError } = await supabase
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
        zuweisungen:auffuehrung_zuweisungen(id, status, person_id, created_at)
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .order('sortierung', { ascending: true })

  if (zeitblockError) {
    console.error('Error fetching zeitbloecke:', zeitblockError)
    return null
  }

  // Get orphan schichten
  const { data: orphanSchichten } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      anzahl_benoetigt,
      zuweisungen:auffuehrung_zuweisungen(id, status, person_id, created_at)
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .is('zeitblock_id', null)

  // Calculate totals
  let totalSlots = 0
  let besetztSlots = 0
  const kritischeSchichten: KritischeSchicht[] = []
  const personCounts: Record<string, number> = {}
  const allZuweisungen: { created_at: string }[] = []

  // Process zeitbloecke
  const zeitblockAuslastung: ZeitblockAuslastung[] = []

  zeitbloecke?.forEach((zb) => {
    let zbGesamtSlots = 0
    let zbBesetztSlots = 0

    interface SchichtType {
      id: string
      rolle: string
      anzahl_benoetigt: number
      zuweisungen: { id: string; status: string; person_id: string; created_at: string }[]
    }

    (zb.schichten as SchichtType[])?.forEach((s) => {
      const activeZuweisungen = s.zuweisungen?.filter((z) => z.status !== 'abgesagt') || []
      const benoetigt = s.anzahl_benoetigt
      const besetzt = activeZuweisungen.length

      zbGesamtSlots += benoetigt
      zbBesetztSlots += besetzt
      totalSlots += benoetigt
      besetztSlots += besetzt

      // Track person assignments
      activeZuweisungen.forEach((z) => {
        personCounts[z.person_id] = (personCounts[z.person_id] || 0) + 1
        allZuweisungen.push({ created_at: z.created_at })
      })

      // Check if critical
      const auslastung = benoetigt > 0 ? (besetzt / benoetigt) * 100 : 100
      if (auslastung < 50) {
        kritischeSchichten.push({
          id: s.id,
          rolle: s.rolle,
          zeitblockName: zb.name,
          startzeit: zb.startzeit,
          endzeit: zb.endzeit,
          benoetigt,
          besetzt,
          auslastungProzent: Math.round(auslastung),
        })
      }
    })

    zeitblockAuslastung.push({
      id: zb.id,
      name: zb.name,
      startzeit: zb.startzeit,
      endzeit: zb.endzeit,
      gesamtSlots: zbGesamtSlots,
      besetztSlots: zbBesetztSlots,
      auslastungProzent: zbGesamtSlots > 0 ? Math.round((zbBesetztSlots / zbGesamtSlots) * 100) : 100,
    })
  })

  // Process orphan schichten
  interface OrphanSchichtType {
    id: string
    rolle: string
    anzahl_benoetigt: number
    zuweisungen: { id: string; status: string; person_id: string; created_at: string }[]
  }

  (orphanSchichten as OrphanSchichtType[])?.forEach((s) => {
    const activeZuweisungen = s.zuweisungen?.filter((z) => z.status !== 'abgesagt') || []
    const benoetigt = s.anzahl_benoetigt
    const besetzt = activeZuweisungen.length

    totalSlots += benoetigt
    besetztSlots += besetzt

    activeZuweisungen.forEach((z) => {
      personCounts[z.person_id] = (personCounts[z.person_id] || 0) + 1
      allZuweisungen.push({ created_at: z.created_at })
    })

    const auslastung = benoetigt > 0 ? (besetzt / benoetigt) * 100 : 100
    if (auslastung < 50) {
      kritischeSchichten.push({
        id: s.id,
        rolle: s.rolle,
        zeitblockName: null,
        startzeit: null,
        endzeit: null,
        benoetigt,
        besetzt,
        auslastungProzent: Math.round(auslastung),
      })
    }
  })

  // Sort kritische schichten by auslastung (lowest first)
  kritischeSchichten.sort((a, b) => a.auslastungProzent - b.auslastungProzent)

  // Get top helpers
  const topPersonIds = Object.entries(personCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  let topHelfer: TopHelfer[] = []
  if (topPersonIds.length > 0) {
    const { data: persons } = await supabase
      .from('personen')
      .select('id, vorname, nachname, email')
      .in('id', topPersonIds)

    topHelfer = topPersonIds.map((id) => {
      const person = persons?.find((p) => p.id === id)
      return {
        id,
        name: person ? `${person.vorname} ${person.nachname}` : 'Unbekannt',
        email: person?.email || null,
        anzahlSchichten: personCounts[id],
      }
    })
  }

  // Calculate trend (group by day)
  const trendByDay: Record<string, number> = {}
  allZuweisungen.forEach((z) => {
    const date = z.created_at.split('T')[0]
    trendByDay[date] = (trendByDay[date] || 0) + 1
  })

  const sortedDates = Object.keys(trendByDay).sort()
  let kumuliert = 0
  const anmeldungsTrend: AnmeldungsTrendPunkt[] = sortedDates.map((datum) => {
    kumuliert += trendByDay[datum]
    return {
      datum,
      anzahl: trendByDay[datum],
      kumuliert,
    }
  })

  // Count internal vs external (for now, all are internal since we use personen table)
  // External helpers would be tracked differently
  const interneCount = Object.keys(personCounts).length
  const externeCount = 0

  return {
    totalSlots,
    besetztSlots,
    offeneSlots: totalSlots - besetztSlots,
    auslastungProzent: totalSlots > 0 ? Math.round((besetztSlots / totalSlots) * 100) : 0,
    zeitblockAuslastung,
    interneCount,
    externeCount,
    anmeldungsTrend,
    kritischeSchichten: kritischeSchichten.slice(0, 5), // Top 5 critical
    topHelfer: topHelfer.slice(0, 5), // Top 5 helpers
  }
}
