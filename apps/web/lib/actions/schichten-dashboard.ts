'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type {
  AmpelStatus,
  DashboardAuffuehrung,
  DashboardHelferZuweisung,
  DashboardSchicht,
  DashboardZeitblock,
  SchichtenDashboardData,
  SchichtenDashboardStats,
  TopHelfer,
  AuffuehrungSchicht,
  AuffuehrungZuweisung,
  Person,
  ExterneHelferProfil,
  HelferZuweisungTyp,
  Zeitblock,
  ZuweisungStatus,
} from '../supabase/types'

// =============================================================================
// Types for raw Supabase query results
// =============================================================================

type RawZuweisung = AuffuehrungZuweisung & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email' | 'telefon'> | null
  external_helper: Pick<ExterneHelferProfil, 'id' | 'vorname' | 'nachname' | 'email' | 'telefon'> | null
}

type RawSchicht = AuffuehrungSchicht & {
  zuweisungen: RawZuweisung[]
}

type RawZeitblock = Zeitblock & {
  schichten: RawSchicht[]
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Determine Ampel status based on occupancy ratio.
 * - rot: below 50% filled
 * - gelb: 50-99% filled
 * - gruen: 100% filled
 */
function computeAmpel(soll: number, ist: number): AmpelStatus {
  if (soll === 0) return 'gruen'
  const ratio = ist / soll
  if (ratio >= 1) return 'gruen'
  if (ratio >= 0.5) return 'gelb'
  return 'rot'
}

/**
 * Transform a raw Supabase zuweisung into a dashboard-friendly structure
 */
function transformZuweisung(raw: RawZuweisung): DashboardHelferZuweisung {
  // Supabase joins can return arrays for 1:1 relations
  const person = Array.isArray(raw.person) ? raw.person[0] : raw.person
  const extHelper = Array.isArray(raw.external_helper) ? raw.external_helper[0] : raw.external_helper

  if (person) {
    return {
      id: raw.id,
      typ: 'intern',
      name: `${person.vorname} ${person.nachname}`,
      email: person.email ?? null,
      telefon: null,
      status: raw.status as ZuweisungStatus,
    }
  }

  if (extHelper) {
    return {
      id: raw.id,
      typ: 'extern',
      name: `${extHelper.vorname} ${extHelper.nachname}`,
      email: extHelper.email ?? null,
      telefon: extHelper.telefon ?? null,
      status: raw.status as ZuweisungStatus,
    }
  }

  // Fallback: zuweisung without resolved person or external helper
  return {
    id: raw.id,
    typ: 'intern',
    name: 'Unbekannt',
    email: null,
    telefon: null,
    status: raw.status as ZuweisungStatus,
  }
}

/**
 * Transform a raw schicht including its zuweisungen
 */
function transformSchicht(raw: RawSchicht): DashboardSchicht {
  const activeZuweisungen = (raw.zuweisungen || []).filter(
    (z) => z.status !== 'abgesagt'
  )
  const zuweisungen = activeZuweisungen.map(transformZuweisung)
  const offene_plaetze = Math.max(0, raw.anzahl_benoetigt - zuweisungen.length)

  return {
    id: raw.id,
    rolle: raw.rolle,
    anzahl_benoetigt: raw.anzahl_benoetigt,
    sichtbarkeit: raw.sichtbarkeit,
    zuweisungen,
    offene_plaetze,
  }
}

// =============================================================================
// Main Server Action
// =============================================================================

/**
 * Fetch all upcoming Auffuehrungen with their Zeitbloecke, Schichten, and
 * Zuweisungen for the Vorstand Schichten-Dashboard.
 *
 * Data source: System B (leading system)
 * - veranstaltungen (typ = 'auffuehrung', future dates)
 * - zeitbloecke
 * - auffuehrung_schichten
 * - auffuehrung_zuweisungen (with person + external_helper joins)
 */
export async function getSchichtenDashboard(): Promise<{
  success: boolean
  data?: SchichtenDashboardData
  error?: string
}> {
  try {
    await requirePermission('helferliste:read')
    const supabase = await createClient()

    // 1. Fetch all upcoming auffuehrungen
    const today = new Date().toISOString().split('T')[0]

    const { data: veranstaltungen, error: veranstaltungError } = await supabase
      .from('veranstaltungen')
      .select('id, titel, datum, startzeit, endzeit, ort, helfer_status, helfer_buchung_deadline')
      .eq('typ', 'auffuehrung')
      .gte('datum', today)
      .in('status', ['geplant', 'bestaetigt'])
      .order('datum', { ascending: true })

    if (veranstaltungError) {
      console.error('Error fetching veranstaltungen:', veranstaltungError)
      return { success: false, error: 'Fehler beim Laden der Aufführungen' }
    }

    if (!veranstaltungen || veranstaltungen.length === 0) {
      return {
        success: true,
        data: {
          stats: {
            total_schichten: 0,
            besetzt_voll: 0,
            besetzt_teilweise: 0,
            besetzt_kritisch: 0,
            belegungsquote: 0,
          },
          auffuehrungen: [],
          top_helfer: [],
        },
      }
    }

    const veranstaltungIds = veranstaltungen.map((v) => v.id)

    // 2. Fetch all zeitbloecke with schichten and zuweisungen for these performances
    const { data: zeitbloecke, error: zeitblockError } = await supabase
      .from('zeitbloecke')
      .select(`
        *,
        schichten:auffuehrung_schichten(
          *,
          zuweisungen:auffuehrung_zuweisungen(
            *,
            person:personen(id, vorname, nachname, email, telefon),
            external_helper:externe_helfer_profile(id, vorname, nachname, email, telefon)
          )
        )
      `)
      .in('veranstaltung_id', veranstaltungIds)
      .order('sortierung', { ascending: true })

    if (zeitblockError) {
      console.error('Error fetching zeitbloecke:', zeitblockError)
      return { success: false, error: 'Fehler beim Laden der Zeitblöcke' }
    }

    // 3. Also fetch schichten without zeitblock (orphans)
    const { data: orphanSchichten, error: orphanError } = await supabase
      .from('auffuehrung_schichten')
      .select(`
        *,
        zuweisungen:auffuehrung_zuweisungen(
          *,
          person:personen(id, vorname, nachname, email, telefon),
          external_helper:externe_helfer_profile(id, vorname, nachname, email, telefon)
        )
      `)
      .in('veranstaltung_id', veranstaltungIds)
      .is('zeitblock_id', null)

    if (orphanError) {
      console.error('Error fetching orphan schichten:', orphanError)
    }

    // 4. Group data by veranstaltung and build dashboard structure
    const zeitblockMap = new Map<string, RawZeitblock[]>()
    const orphanMap = new Map<string, RawSchicht[]>()

    for (const zb of (zeitbloecke || []) as unknown as RawZeitblock[]) {
      const list = zeitblockMap.get(zb.veranstaltung_id) || []
      list.push(zb)
      zeitblockMap.set(zb.veranstaltung_id, list)
    }

    for (const s of (orphanSchichten || []) as unknown as RawSchicht[]) {
      const list = orphanMap.get(s.veranstaltung_id) || []
      list.push(s)
      orphanMap.set(s.veranstaltung_id, list)
    }

    // 5. Build auffuehrungen with stats
    let totalSchichten = 0
    let besetztVoll = 0
    let besetztTeilweise = 0
    let besetztKritisch = 0
    let gesamtSoll = 0
    let gesamtIst = 0

    const auffuehrungen: DashboardAuffuehrung[] = veranstaltungen.map((v) => {
      const rawZeitbloecke = zeitblockMap.get(v.id) || []
      const rawOrphans = orphanMap.get(v.id) || []

      // Transform zeitbloecke
      const dashboardZeitbloecke: DashboardZeitblock[] = rawZeitbloecke.map((zb) => ({
        id: zb.id,
        name: zb.name,
        startzeit: zb.startzeit,
        endzeit: zb.endzeit,
        typ: zb.typ,
        schichten: (zb.schichten || []).map(transformSchicht),
      }))

      // Add orphan schichten as a separate "Sonstige" zeitblock if present
      if (rawOrphans.length > 0) {
        dashboardZeitbloecke.push({
          id: 'orphan',
          name: 'Sonstige Schichten',
          startzeit: '',
          endzeit: '',
          typ: 'standard',
          schichten: rawOrphans.map(transformSchicht),
        })
      }

      // Calculate belegung for this auffuehrung
      const allSchichten = dashboardZeitbloecke.flatMap((zb) => zb.schichten)
      const soll = allSchichten.reduce((sum, s) => sum + s.anzahl_benoetigt, 0)
      const ist = allSchichten.reduce((sum, s) => sum + s.zuweisungen.length, 0)

      // Per-schicht stats
      for (const schicht of allSchichten) {
        totalSchichten++
        const schichtAmpel = computeAmpel(schicht.anzahl_benoetigt, schicht.zuweisungen.length)
        if (schichtAmpel === 'gruen') besetztVoll++
        else if (schichtAmpel === 'gelb') besetztTeilweise++
        else besetztKritisch++
      }

      gesamtSoll += soll
      gesamtIst += ist

      return {
        id: v.id,
        titel: v.titel,
        datum: v.datum,
        startzeit: v.startzeit,
        endzeit: v.endzeit,
        ort: v.ort,
        helfer_status: v.helfer_status,
        helfer_buchung_deadline: v.helfer_buchung_deadline,
        ampel: computeAmpel(soll, ist),
        belegung: { soll, ist },
        zeitbloecke: dashboardZeitbloecke,
      }
    })

    const stats: SchichtenDashboardStats = {
      total_schichten: totalSchichten,
      besetzt_voll: besetztVoll,
      besetzt_teilweise: besetztTeilweise,
      besetzt_kritisch: besetztKritisch,
      belegungsquote: gesamtSoll > 0
        ? Math.round((gesamtIst / gesamtSoll) * 100)
        : 0,
    }

    // 6. Compute Top 10 Helfer ranking across all performances
    const helferCounts = new Map<string, { name: string; typ: HelferZuweisungTyp; count: number }>()

    for (const auffuehrung of auffuehrungen) {
      for (const zb of auffuehrung.zeitbloecke) {
        for (const schicht of zb.schichten) {
          for (const zuweisung of schicht.zuweisungen) {
            const key = `${zuweisung.typ}:${zuweisung.name}`
            const existing = helferCounts.get(key)
            if (existing) {
              existing.count++
            } else {
              helferCounts.set(key, {
                name: zuweisung.name,
                typ: zuweisung.typ,
                count: 1,
              })
            }
          }
        }
      }
    }

    const topHelfer: TopHelfer[] = Array.from(helferCounts.entries())
      .map(([key, entry]) => ({
        id: key,
        name: entry.name,
        typ: entry.typ,
        schichten_count: entry.count,
      }))
      .sort((a, b) => b.schichten_count - a.schichten_count)
      .slice(0, 10)

    return {
      success: true,
      data: { stats, auffuehrungen, top_helfer: topHelfer },
    }
  } catch (error) {
    console.error('getSchichtenDashboard failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}
