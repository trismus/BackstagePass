'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { checkPersonConflicts } from './conflict-check'
import type {
  ZuweisungVorschlag,
  ZuweisungenPreviewResult,
} from '../supabase/types'

const MAX_CONFLICT_CHECKS = 50

export async function generateZuweisungenPreview(
  produktionId: string
): Promise<{ success: true; data: ZuweisungenPreviewResult } | { success: false; error: string }> {
  const profile = await requirePermission('produktionen:write')
  if (!profile) {
    return { success: false, error: 'Keine Berechtigung' }
  }

  const supabase = await createClient()

  // 1. Get cast members with status 'besetzt' and person_id set
  const { data: besetzungen, error: besetzungError } = await supabase
    .from('produktions_besetzungen')
    .select('id, person_id, rolle_id')
    .eq('produktion_id', produktionId)
    .eq('status', 'besetzt')
    .not('person_id', 'is', null)

  if (besetzungError) {
    return { success: false, error: besetzungError.message }
  }

  if (!besetzungen || besetzungen.length === 0) {
    return {
      success: true,
      data: {
        vorschlaege: [],
        auffuehrungen_ohne_veranstaltung: [],
        veranstaltungen_ohne_vorfuehrung: [],
        stats: {
          total_besetzt: 0,
          total_auffuehrungen: 0,
          total_vorschlaege: 0,
          total_bereits_vorhanden: 0,
          total_mit_konflikten: 0,
        },
      },
    }
  }

  // Dedupe persons (one person can be cast in multiple roles)
  const uniquePersonIds = [...new Set(besetzungen.map((b) => b.person_id as string))]

  // Get person names
  const { data: personen } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .in('id', uniquePersonIds)

  const personMap = new Map(
    (personen || []).map((p) => [p.id, `${p.vorname} ${p.nachname}`])
  )

  // 2. Traverse: auffuehrungsserien → serienauffuehrungen
  const { data: serien } = await supabase
    .from('auffuehrungsserien')
    .select('id, name')
    .eq('produktion_id', produktionId)

  if (!serien || serien.length === 0) {
    return {
      success: true,
      data: {
        vorschlaege: [],
        auffuehrungen_ohne_veranstaltung: [],
        veranstaltungen_ohne_vorfuehrung: [],
        stats: {
          total_besetzt: uniquePersonIds.length,
          total_auffuehrungen: 0,
          total_vorschlaege: 0,
          total_bereits_vorhanden: 0,
          total_mit_konflikten: 0,
        },
      },
    }
  }

  const serieIds = serien.map((s) => s.id)
  const serieNameMap = new Map(serien.map((s) => [s.id, s.name]))

  const { data: serienauffuehrungen } = await supabase
    .from('serienauffuehrungen')
    .select('id, serie_id, veranstaltung_id, datum')
    .in('serie_id', serieIds)

  if (!serienauffuehrungen || serienauffuehrungen.length === 0) {
    return {
      success: true,
      data: {
        vorschlaege: [],
        auffuehrungen_ohne_veranstaltung: [],
        veranstaltungen_ohne_vorfuehrung: [],
        stats: {
          total_besetzt: uniquePersonIds.length,
          total_auffuehrungen: 0,
          total_vorschlaege: 0,
          total_bereits_vorhanden: 0,
          total_mit_konflikten: 0,
        },
      },
    }
  }

  // Separate: with and without veranstaltung_id
  const auffuehrungenOhneVeranstaltung = serienauffuehrungen
    .filter((sa) => !sa.veranstaltung_id)
    .map((sa) => ({
      id: sa.id,
      datum: sa.datum,
      serie_name: serieNameMap.get(sa.serie_id) || '',
    }))

  const mitVeranstaltung = serienauffuehrungen.filter((sa) => sa.veranstaltung_id)
  const veranstaltungIds = mitVeranstaltung.map((sa) => sa.veranstaltung_id as string)

  if (veranstaltungIds.length === 0) {
    return {
      success: true,
      data: {
        vorschlaege: [],
        auffuehrungen_ohne_veranstaltung: auffuehrungenOhneVeranstaltung,
        veranstaltungen_ohne_vorfuehrung: [],
        stats: {
          total_besetzt: uniquePersonIds.length,
          total_auffuehrungen: mitVeranstaltung.length,
          total_vorschlaege: 0,
          total_bereits_vorhanden: 0,
          total_mit_konflikten: 0,
        },
      },
    }
  }

  // 3. For each veranstaltung_id: get zeitbloecke (typ=vorfuehrung) + veranstaltung info
  const { data: veranstaltungen } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum')
    .in('id', veranstaltungIds)

  const veranstaltungMap = new Map(
    (veranstaltungen || []).map((v) => [v.id, { titel: v.titel, datum: v.datum }])
  )

  const { data: zeitbloecke } = await supabase
    .from('zeitbloecke')
    .select('id, veranstaltung_id, name, startzeit, endzeit, typ')
    .in('veranstaltung_id', veranstaltungIds)
    .eq('typ', 'vorfuehrung')

  // Track veranstaltungen without vorfuehrung zeitbloecke
  const veranstaltungenMitVorfuehrung = new Set(
    (zeitbloecke || []).map((zb) => zb.veranstaltung_id)
  )
  const veranstaltungenOhneVorfuehrung = veranstaltungIds
    .filter((vId) => !veranstaltungenMitVorfuehrung.has(vId))
    .map((vId) => {
      const v = veranstaltungMap.get(vId)
      return {
        veranstaltung_id: vId,
        titel: v?.titel || '',
        datum: v?.datum || '',
      }
    })

  if (!zeitbloecke || zeitbloecke.length === 0) {
    return {
      success: true,
      data: {
        vorschlaege: [],
        auffuehrungen_ohne_veranstaltung: auffuehrungenOhneVeranstaltung,
        veranstaltungen_ohne_vorfuehrung: veranstaltungenOhneVorfuehrung,
        stats: {
          total_besetzt: uniquePersonIds.length,
          total_auffuehrungen: mitVeranstaltung.length,
          total_vorschlaege: 0,
          total_bereits_vorhanden: 0,
          total_mit_konflikten: 0,
        },
      },
    }
  }

  const zeitblockIds = zeitbloecke.map((zb) => zb.id)

  // Get schichten for vorfuehrung zeitbloecke
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select('id, veranstaltung_id, zeitblock_id, rolle')
    .in('zeitblock_id', zeitblockIds)

  if (!schichten || schichten.length === 0) {
    return {
      success: true,
      data: {
        vorschlaege: [],
        auffuehrungen_ohne_veranstaltung: auffuehrungenOhneVeranstaltung,
        veranstaltungen_ohne_vorfuehrung: veranstaltungenOhneVorfuehrung,
        stats: {
          total_besetzt: uniquePersonIds.length,
          total_auffuehrungen: mitVeranstaltung.length,
          total_vorschlaege: 0,
          total_bereits_vorhanden: 0,
          total_mit_konflikten: 0,
        },
      },
    }
  }

  // Build zeitblock lookup
  const zeitblockMap = new Map(
    zeitbloecke.map((zb) => [
      zb.id,
      {
        name: zb.name,
        startzeit: zb.startzeit,
        endzeit: zb.endzeit,
        veranstaltung_id: zb.veranstaltung_id,
      },
    ])
  )

  // 5. Check existing zuweisungen for deduplication
  const schichtIds = schichten.map((s) => s.id)
  const { data: existingZuweisungen } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('schicht_id, person_id')
    .in('schicht_id', schichtIds)
    .in('person_id', uniquePersonIds)

  const existingSet = new Set(
    (existingZuweisungen || []).map((z) => `${z.schicht_id}::${z.person_id}`)
  )

  // 4. Cross product: persons × qualifying shifts
  const vorschlaege: ZuweisungVorschlag[] = []

  for (const schicht of schichten) {
    const zb = zeitblockMap.get(schicht.zeitblock_id!)
    if (!zb) continue

    const v = veranstaltungMap.get(zb.veranstaltung_id)
    if (!v) continue

    for (const personId of uniquePersonIds) {
      const key = `${schicht.id}::${personId}`
      vorschlaege.push({
        key,
        person_id: personId,
        person_name: personMap.get(personId) || 'Unbekannt',
        schicht_id: schicht.id,
        schicht_rolle: schicht.rolle,
        veranstaltung_id: zb.veranstaltung_id,
        veranstaltung_titel: v.titel,
        veranstaltung_datum: v.datum,
        zeitblock_name: zb.name,
        zeitblock_startzeit: zb.startzeit,
        zeitblock_endzeit: zb.endzeit,
        bereits_vorhanden: existingSet.has(key),
        konflikte: [],
      })
    }
  }

  // 6. Conflict check (batched, max 50)
  const newVorschlaege = vorschlaege.filter((v) => !v.bereits_vorhanden)
  const checksToPerform = newVorschlaege.slice(0, MAX_CONFLICT_CHECKS)

  let totalMitKonflikten = 0

  for (const vorschlag of checksToPerform) {
    if (!vorschlag.zeitblock_startzeit || !vorschlag.zeitblock_endzeit) continue
    try {
      const result = await checkPersonConflicts(
        vorschlag.person_id,
        vorschlag.zeitblock_startzeit,
        vorschlag.zeitblock_endzeit
      )
      if (result.has_conflicts) {
        vorschlag.konflikte = result.conflicts
        totalMitKonflikten++
      }
    } catch {
      // Skip conflict check on error
    }
  }

  // If we skipped some, mark them with an empty konflikte array (already default)
  // The UI can show a warning that not all conflicts were checked

  return {
    success: true,
    data: {
      vorschlaege,
      auffuehrungen_ohne_veranstaltung: auffuehrungenOhneVeranstaltung,
      veranstaltungen_ohne_vorfuehrung: veranstaltungenOhneVorfuehrung,
      stats: {
        total_besetzt: uniquePersonIds.length,
        total_auffuehrungen: mitVeranstaltung.length,
        total_vorschlaege: vorschlaege.length,
        total_bereits_vorhanden: vorschlaege.filter((v) => v.bereits_vorhanden).length,
        total_mit_konflikten: totalMitKonflikten,
      },
    },
  }
}

export async function confirmZuweisungen(
  produktionId: string,
  proposals: { schicht_id: string; person_id: string }[],
  status: 'vorgeschlagen' | 'zugesagt' = 'vorgeschlagen'
): Promise<{ success: boolean; error?: string; count?: number }> {
  const profile = await requirePermission('produktionen:write')
  if (!profile) {
    return { success: false, error: 'Keine Berechtigung' }
  }

  if (proposals.length === 0) {
    return { success: false, error: 'Keine Vorschläge ausgewählt' }
  }

  const supabase = await createClient()

  const notiz = `Auto-generiert aus Besetzung von ${profile.display_name}`

  const rows = proposals.map((p) => ({
    schicht_id: p.schicht_id,
    person_id: p.person_id,
    status,
    notizen: notiz,
  }))

  const { error, count } = await supabase
    .from('auffuehrung_zuweisungen')
    .upsert(rows, {
      onConflict: 'schicht_id,person_id',
      ignoreDuplicates: true,
      count: 'exact',
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${produktionId}` as never)
  revalidatePath('/auffuehrungen')

  return { success: true, count: count ?? proposals.length }
}
