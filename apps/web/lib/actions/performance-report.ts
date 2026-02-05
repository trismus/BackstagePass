'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'

// =============================================================================
// Types
// =============================================================================

export type HelferUebersicht = {
  angemeldet: number
  erschienen: number
  erscheinenRate: number
  noShows: number
  noShowRate: number
  intern: number
  extern: number
}

export type SchichtAuslastung = {
  gesamtSlots: number
  besetzteSlots: number
  auslastungProzent: number
  proZeitblock: {
    name: string
    slots: number
    besetzt: number
    auslastung: number
  }[]
}

export type WartelisteAktivitaet = {
  gesamt: number
  zugewiesen: number
  conversionRate: number
}

export type KritischeSchicht = {
  rolle: string
  zeitblock: string
  auslastungProzent: number
  fehlend: number
  benoetigt: number
  besetzt: number
}

export type NoShowAnalyse = {
  helfer: {
    name: string
    email: string | null
    rolle: string
  }[]
  zeitblockMitHoechsterRate: {
    name: string
    rate: number
  } | null
}

export type TopHelfer = {
  name: string
  email: string | null
  schichten: number
  stunden: number
}

export type PerformanceReport = {
  veranstaltungId: string
  veranstaltungTitel: string
  veranstaltungDatum: string
  helferUebersicht: HelferUebersicht
  schichtAuslastung: SchichtAuslastung
  wartelisteAktivitaet: WartelisteAktivitaet
  kritischeSchichten: KritischeSchicht[]
  noShowAnalyse: NoShowAnalyse
  topHelfer: TopHelfer[]
  generatedAt: string
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate hours from start and end time
 */
function calculateHours(startzeit: string, endzeit: string): number {
  const start = new Date(`2000-01-01T${startzeit}`)
  const end = new Date(`2000-01-01T${endzeit}`)
  let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  if (hours < 0) hours += 24
  return Math.round(hours * 4) / 4
}

// =============================================================================
// Main Action
// =============================================================================

/**
 * Generate performance report for a veranstaltung
 */
export async function generatePerformanceReport(
  veranstaltungId: string
): Promise<PerformanceReport | null> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get veranstaltung
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, helfer_status')
    .eq('id', veranstaltungId)
    .single()

  if (veranstaltungError || !veranstaltung) {
    console.error('Error fetching veranstaltung:', veranstaltungError)
    return null
  }

  // Get all schichten with zeitbloecke and zuweisungen
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      anzahl_benoetigt,
      zeitblock:zeitbloecke(id, name, startzeit, endzeit),
      zuweisungen:auffuehrung_zuweisungen(
        id,
        status,
        checked_in_at,
        no_show,
        person:personen(id, vorname, nachname, email)
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)

  // Get warteliste entries
  const schichtIds = schichten?.map((s) => s.id) || []
  const { data: warteliste } = await supabase
    .from('helfer_warteliste')
    .select('id, status')
    .in('schicht_id', schichtIds)

  // Calculate helper overview
  const helferMap = new Map<string, {
    name: string
    email: string | null
    erschienen: boolean
    noShow: boolean
    schichten: number
    stunden: number
    rollen: string[]
  }>()

  let totalSlots = 0
  let filledSlots = 0

  const zeitblockStats = new Map<string, {
    name: string
    slots: number
    besetzt: number
    erschienen: number
    noShows: number
  }>()

  for (const schicht of schichten || []) {
    const zeitblockData = schicht.zeitblock as unknown as {
      id: string
      name: string
      startzeit: string
      endzeit: string
    } | null

    const zeitblockName = zeitblockData?.name || 'Ohne Zeitblock'
    const zeitblockKey = zeitblockData?.id || 'no-zeitblock'

    // Initialize zeitblock stats
    if (!zeitblockStats.has(zeitblockKey)) {
      zeitblockStats.set(zeitblockKey, {
        name: zeitblockName,
        slots: 0,
        besetzt: 0,
        erschienen: 0,
        noShows: 0,
      })
    }

    const zbStats = zeitblockStats.get(zeitblockKey)!
    zbStats.slots += schicht.anzahl_benoetigt
    totalSlots += schicht.anzahl_benoetigt

    // Process zuweisungen
    const activeZuweisungen = (schicht.zuweisungen || []).filter(
      (z) => z.status !== 'abgesagt'
    )
    zbStats.besetzt += activeZuweisungen.length
    filledSlots += activeZuweisungen.length

    for (const z of activeZuweisungen) {
      const personData = z.person as unknown as {
        id: string
        vorname: string
        nachname: string
        email: string | null
      } | null

      if (!personData) continue

      const key = personData.id

      if (!helferMap.has(key)) {
        helferMap.set(key, {
          name: `${personData.vorname} ${personData.nachname}`,
          email: personData.email,
          erschienen: false,
          noShow: false,
          schichten: 0,
          stunden: 0,
          rollen: [],
        })
      }

      const helfer = helferMap.get(key)!
      helfer.schichten++
      helfer.rollen.push(schicht.rolle)

      // Calculate hours
      if (zeitblockData?.startzeit && zeitblockData?.endzeit) {
        helfer.stunden += calculateHours(zeitblockData.startzeit, zeitblockData.endzeit)
      }

      // Track check-in status
      if (z.checked_in_at) {
        helfer.erschienen = true
        zbStats.erschienen++
      }
      if (z.no_show) {
        helfer.noShow = true
        zbStats.noShows++
      }
    }
  }

  // Calculate helper overview stats
  const helferList = Array.from(helferMap.values())
  const angemeldet = helferList.length
  const erschienen = helferList.filter((h) => h.erschienen).length
  const noShows = helferList.filter((h) => h.noShow).length

  const helferUebersicht: HelferUebersicht = {
    angemeldet,
    erschienen,
    erscheinenRate: angemeldet > 0 ? Math.round((erschienen / angemeldet) * 100) : 0,
    noShows,
    noShowRate: angemeldet > 0 ? Math.round((noShows / angemeldet) * 100) : 0,
    intern: angemeldet, // For now, all are considered internal
    extern: 0,
  }

  // Calculate shift utilization
  const proZeitblock = Array.from(zeitblockStats.values()).map((zb) => ({
    name: zb.name,
    slots: zb.slots,
    besetzt: zb.besetzt,
    auslastung: zb.slots > 0 ? Math.round((zb.besetzt / zb.slots) * 100) : 0,
  }))

  const schichtAuslastung: SchichtAuslastung = {
    gesamtSlots: totalSlots,
    besetzteSlots: filledSlots,
    auslastungProzent: totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0,
    proZeitblock,
  }

  // Calculate waitlist activity
  const wartelisteGesamt = warteliste?.length || 0
  const wartelisteZugewiesen = warteliste?.filter((w) => w.status === 'zugewiesen').length || 0

  const wartelisteAktivitaet: WartelisteAktivitaet = {
    gesamt: wartelisteGesamt,
    zugewiesen: wartelisteZugewiesen,
    conversionRate: wartelisteGesamt > 0
      ? Math.round((wartelisteZugewiesen / wartelisteGesamt) * 100)
      : 0,
  }

  // Find critical shifts (< 80% filled)
  const kritischeSchichten: KritischeSchicht[] = []
  for (const schicht of schichten || []) {
    const zeitblockData = schicht.zeitblock as unknown as {
      name: string
    } | null

    const activeZuweisungen = (schicht.zuweisungen || []).filter(
      (z) => z.status !== 'abgesagt'
    )
    const besetzt = activeZuweisungen.length
    const benoetigt = schicht.anzahl_benoetigt
    const auslastung = benoetigt > 0 ? Math.round((besetzt / benoetigt) * 100) : 0

    if (auslastung < 80 && benoetigt > 0) {
      kritischeSchichten.push({
        rolle: schicht.rolle,
        zeitblock: zeitblockData?.name || 'Ohne Zeitblock',
        auslastungProzent: auslastung,
        fehlend: benoetigt - besetzt,
        benoetigt,
        besetzt,
      })
    }
  }

  // Sort by auslastung (worst first)
  kritischeSchichten.sort((a, b) => a.auslastungProzent - b.auslastungProzent)

  // No-show analysis
  const noShowHelfer = helferList
    .filter((h) => h.noShow)
    .map((h) => ({
      name: h.name,
      email: h.email,
      rolle: h.rollen[0] || '',
    }))

  // Find zeitblock with highest no-show rate
  let zeitblockMitHoechsterRate: { name: string; rate: number } | null = null
  let highestRate = 0

  for (const zb of zeitblockStats.values()) {
    if (zb.erschienen + zb.noShows > 0) {
      const rate = zb.noShows / (zb.erschienen + zb.noShows)
      if (rate > highestRate) {
        highestRate = rate
        zeitblockMitHoechsterRate = {
          name: zb.name,
          rate: Math.round(rate * 100),
        }
      }
    }
  }

  const noShowAnalyse: NoShowAnalyse = {
    helfer: noShowHelfer,
    zeitblockMitHoechsterRate,
  }

  // Top helpers (by number of shifts)
  const topHelfer: TopHelfer[] = helferList
    .filter((h) => h.schichten >= 1)
    .sort((a, b) => b.schichten - a.schichten || b.stunden - a.stunden)
    .slice(0, 10)
    .map((h) => ({
      name: h.name,
      email: h.email,
      schichten: h.schichten,
      stunden: Math.round(h.stunden * 4) / 4,
    }))

  return {
    veranstaltungId: veranstaltung.id,
    veranstaltungTitel: veranstaltung.titel,
    veranstaltungDatum: veranstaltung.datum,
    helferUebersicht,
    schichtAuslastung,
    wartelisteAktivitaet,
    kritischeSchichten,
    noShowAnalyse,
    topHelfer,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Export performance report as CSV
 */
export async function exportPerformanceReportCSV(
  veranstaltungId: string
): Promise<{ success: boolean; csv?: string; error?: string }> {
  const report = await generatePerformanceReport(veranstaltungId)
  if (!report) {
    return { success: false, error: 'Report konnte nicht generiert werden' }
  }

  const lines: string[] = []

  // Header
  lines.push(`Performance Report: ${report.veranstaltungTitel}`)
  lines.push(`Datum: ${new Date(report.veranstaltungDatum).toLocaleDateString('de-CH')}`)
  lines.push(`Generiert: ${new Date(report.generatedAt).toLocaleString('de-CH')}`)
  lines.push('')

  // Helfer Overview
  lines.push('=== Helfer-Uebersicht ===')
  lines.push(`Angemeldet;${report.helferUebersicht.angemeldet}`)
  lines.push(`Erschienen;${report.helferUebersicht.erschienen}`)
  lines.push(`Erscheinen-Rate;${report.helferUebersicht.erscheinenRate}%`)
  lines.push(`No-Shows;${report.helferUebersicht.noShows}`)
  lines.push(`No-Show-Rate;${report.helferUebersicht.noShowRate}%`)
  lines.push('')

  // Shift utilization
  lines.push('=== Schicht-Auslastung ===')
  lines.push(`Gesamt Slots;${report.schichtAuslastung.gesamtSlots}`)
  lines.push(`Besetzt;${report.schichtAuslastung.besetzteSlots}`)
  lines.push(`Auslastung;${report.schichtAuslastung.auslastungProzent}%`)
  lines.push('')

  // Per Zeitblock
  lines.push('Zeitblock;Slots;Besetzt;Auslastung')
  for (const zb of report.schichtAuslastung.proZeitblock) {
    lines.push(`${zb.name};${zb.slots};${zb.besetzt};${zb.auslastung}%`)
  }
  lines.push('')

  // Waitlist
  lines.push('=== Warteliste ===')
  lines.push(`Gesamt;${report.wartelisteAktivitaet.gesamt}`)
  lines.push(`Zugewiesen;${report.wartelisteAktivitaet.zugewiesen}`)
  lines.push(`Conversion;${report.wartelisteAktivitaet.conversionRate}%`)
  lines.push('')

  // Critical shifts
  if (report.kritischeSchichten.length > 0) {
    lines.push('=== Kritische Schichten (<80% Auslastung) ===')
    lines.push('Rolle;Zeitblock;Auslastung;Fehlend;Benoetigt;Besetzt')
    for (const ks of report.kritischeSchichten) {
      lines.push(`${ks.rolle};${ks.zeitblock};${ks.auslastungProzent}%;${ks.fehlend};${ks.benoetigt};${ks.besetzt}`)
    }
    lines.push('')
  }

  // Top Helpers
  if (report.topHelfer.length > 0) {
    lines.push('=== Top Helfer ===')
    lines.push('Name;Email;Schichten;Stunden')
    for (const h of report.topHelfer) {
      lines.push(`${h.name};${h.email || ''};${h.schichten};${h.stunden}`)
    }
    lines.push('')
  }

  // No-Shows
  if (report.noShowAnalyse.helfer.length > 0) {
    lines.push('=== No-Shows ===')
    lines.push('Name;Email;Rolle')
    for (const h of report.noShowAnalyse.helfer) {
      lines.push(`${h.name};${h.email || ''};${h.rolle}`)
    }
  }

  return { success: true, csv: lines.join('\n') }
}
