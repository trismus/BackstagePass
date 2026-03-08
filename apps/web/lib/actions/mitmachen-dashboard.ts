'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import type {
  SchichtSichtbarkeit,
  HelferStatus,
  ZuweisungStatus,
} from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type DashboardZuweisung = {
  id: string
  person_id: string | null
  external_helper_id: string | null
  status: ZuweisungStatus
  person: { id: string; vorname: string; nachname: string } | null
  external_helper: { id: string; vorname: string; nachname: string } | null
}

export type DashboardSchichtDetail = {
  id: string
  rolle: string
  anzahl_benoetigt: number
  sichtbarkeit: SchichtSichtbarkeit
  zeitblock: {
    id: string
    name: string
    startzeit: string
    endzeit: string
  } | null
  zuweisungen: DashboardZuweisung[]
  anzahl_belegt: number
  freie_plaetze: number
}

export type DashboardVeranstaltung = {
  id: string
  titel: string
  datum: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  helfer_status: HelferStatus
  public_helfer_token: string | null
  schichten: DashboardSchichtDetail[]
  total_benoetigt: number
  total_belegt: number
  total_offen: number
}

export type MitmachenDashboardData = {
  veranstaltungen: DashboardVeranstaltung[]
  personen: { id: string; vorname: string; nachname: string }[]
  summary: {
    total_events: number
    total_schichten: number
    total_benoetigt: number
    total_belegt: number
    total_offen: number
    intern_offen: number
    public_offen: number
  }
}

// =============================================================================
// Data Fetching
// =============================================================================

export async function getMitmachenDashboardData(): Promise<MitmachenDashboardData> {
  await requirePermission('veranstaltungen:read')
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Fetch upcoming events that have helfer_status set
  const { data: veranstaltungen, error: vError } = await supabase
    .from('veranstaltungen')
    .select(
      'id, titel, datum, startzeit, endzeit, ort, helfer_status, public_helfer_token'
    )
    .not('helfer_status', 'is', null)
    .gte('datum', today)
    .order('datum', { ascending: true })

  if (vError || !veranstaltungen?.length) {
    return {
      veranstaltungen: [],
      personen: [],
      summary: {
        total_events: 0,
        total_schichten: 0,
        total_benoetigt: 0,
        total_belegt: 0,
        total_offen: 0,
        intern_offen: 0,
        public_offen: 0,
      },
    }
  }

  const veranstaltungIds = veranstaltungen.map((v) => v.id)

  // Fetch schichten, zeitbloecke, zuweisungen, and active members in parallel
  const [schichtenResult, zeitblockResult, zuweisungenResult, personenResult] =
    await Promise.all([
      supabase
        .from('auffuehrung_schichten')
        .select(
          'id, veranstaltung_id, zeitblock_id, rolle, anzahl_benoetigt, sichtbarkeit'
        )
        .in('veranstaltung_id', veranstaltungIds),
      supabase
        .from('zeitbloecke')
        .select('id, name, startzeit, endzeit, veranstaltung_id')
        .in('veranstaltung_id', veranstaltungIds)
        .order('sortierung', { ascending: true }),
      supabase
        .from('auffuehrung_zuweisungen')
        .select(
          `
          id, schicht_id, person_id, external_helper_id, status,
          person:personen(id, vorname, nachname),
          external_helper:externe_helfer_profile(id, vorname, nachname)
        `
        )
        .neq('status', 'abgesagt'),
      supabase
        .from('personen')
        .select('id, vorname, nachname')
        .eq('aktiv', true)
        .order('nachname', { ascending: true }),
    ])

  const schichten = schichtenResult.data || []
  const zeitbloecke = zeitblockResult.data || []
  const alleZuweisungen = zuweisungenResult.data || []
  const personen = personenResult.data || []

  // Filter zuweisungen to only those belonging to our schichten
  const schichtIds = new Set(schichten.map((s) => s.id))
  const relevantZuweisungen = alleZuweisungen.filter((z) =>
    schichtIds.has(z.schicht_id)
  )

  // Group zuweisungen by schicht_id
  const zuweisungBySchicht = new Map<string, DashboardZuweisung[]>()
  for (const z of relevantZuweisungen) {
    const list = zuweisungBySchicht.get(z.schicht_id) || []
    list.push({
      id: z.id,
      person_id: z.person_id,
      external_helper_id: z.external_helper_id,
      status: z.status as ZuweisungStatus,
      person: (Array.isArray(z.person)
        ? z.person[0]
        : z.person) as DashboardZuweisung['person'],
      external_helper: (Array.isArray(z.external_helper)
        ? z.external_helper[0]
        : z.external_helper) as DashboardZuweisung['external_helper'],
    })
    zuweisungBySchicht.set(z.schicht_id, list)
  }

  // Build zeitblock map
  const zeitblockMap = new Map(zeitbloecke.map((zb) => [zb.id, zb]))

  // Summary counters
  let totalSchichten = 0
  let totalBenoetigt = 0
  let totalBelegt = 0
  let internOffen = 0
  let publicOffen = 0

  // Build veranstaltungen with schichten
  const result: DashboardVeranstaltung[] = veranstaltungen
    .filter((v) => v.helfer_status !== null)
    .map((v) => {
      const eventSchichten = schichten
        .filter((s) => s.veranstaltung_id === v.id)
        .map((s) => {
          const zuweisungen = zuweisungBySchicht.get(s.id) || []
          const belegt = zuweisungen.length
          const offen = Math.max(0, s.anzahl_benoetigt - belegt)
          const zb = s.zeitblock_id ? zeitblockMap.get(s.zeitblock_id) : null

          totalSchichten++
          totalBenoetigt += s.anzahl_benoetigt
          totalBelegt += belegt
          if (s.sichtbarkeit === 'intern') internOffen += offen
          else publicOffen += offen

          return {
            id: s.id,
            rolle: s.rolle,
            anzahl_benoetigt: s.anzahl_benoetigt,
            sichtbarkeit: s.sichtbarkeit as SchichtSichtbarkeit,
            zeitblock: zb
              ? {
                  id: zb.id,
                  name: zb.name,
                  startzeit: zb.startzeit,
                  endzeit: zb.endzeit,
                }
              : null,
            zuweisungen,
            anzahl_belegt: belegt,
            freie_plaetze: offen,
          }
        })

      const eventBenoetigt = eventSchichten.reduce(
        (s, c) => s + c.anzahl_benoetigt,
        0
      )
      const eventBelegt = eventSchichten.reduce(
        (s, c) => s + c.anzahl_belegt,
        0
      )

      return {
        id: v.id,
        titel: v.titel,
        datum: v.datum,
        startzeit: v.startzeit,
        endzeit: v.endzeit,
        ort: v.ort,
        helfer_status: v.helfer_status as HelferStatus,
        public_helfer_token: v.public_helfer_token,
        schichten: eventSchichten,
        total_benoetigt: eventBenoetigt,
        total_belegt: eventBelegt,
        total_offen: Math.max(0, eventBenoetigt - eventBelegt),
      }
    })

  return {
    veranstaltungen: result,
    personen,
    summary: {
      total_events: result.length,
      total_schichten: totalSchichten,
      total_benoetigt: totalBenoetigt,
      total_belegt: totalBelegt,
      total_offen: Math.max(0, totalBenoetigt - totalBelegt),
      intern_offen: internOffen,
      public_offen: publicOffen,
    },
  }
}

// =============================================================================
// Assignment Action
// =============================================================================

export async function assignPersonToSchicht(
  schichtId: string,
  personId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('veranstaltungen:write')
  } catch {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()

  // Check for existing assignment
  const { data: existing } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id')
    .eq('schicht_id', schichtId)
    .eq('person_id', personId)
    .neq('status', 'abgesagt')
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Person ist bereits zugewiesen' }
  }

  const { error } = await supabase.from('auffuehrung_zuweisungen').insert({
    schicht_id: schichtId,
    person_id: personId,
    status: 'zugesagt',
    notizen: null,
  } as never)

  if (error) {
    console.error('Error assigning person:', error)
    return { success: false, error: 'Fehler beim Zuweisen' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/auffuehrungen')
  revalidatePath('/mitmachen')
  return { success: true }
}

export async function removeAssignment(
  zuweisungId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('veranstaltungen:write')
  } catch {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('auffuehrung_zuweisungen')
    .delete()
    .eq('id', zuweisungId)

  if (error) {
    console.error('Error removing assignment:', error)
    return { success: false, error: 'Fehler beim Entfernen' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/auffuehrungen')
  revalidatePath('/mitmachen')
  return { success: true }
}
