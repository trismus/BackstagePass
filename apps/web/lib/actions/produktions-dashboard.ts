'use server'

import { createClient } from '@/lib/supabase/server'
import { getBedarfUebersicht } from './auffuehrung-schichten'
import type {
  RolleMitProduktionsBesetzungen,
  Serienauffuehrung,
  RollenTyp,
  BesetzungsFortschritt,
  SchichtAbdeckungProAuffuehrung,
  ProbenAnwesenheit,
  ProbenDashboardStats,
  DashboardWarnung,
  ProduktionDashboardData,
} from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Public server action
// ---------------------------------------------------------------------------

export async function getProduktionDashboardData(
  produktionId: string,
  stueckId: string | null,
  rollenMitBesetzungen: RolleMitProduktionsBesetzungen[],
  serienAuffuehrungen: Record<string, Serienauffuehrung[]>
): Promise<ProduktionDashboardData> {
  const besetzung = berechneBesetzungsFortschritt(rollenMitBesetzungen)

  const allAuffuehrungen = Object.values(serienAuffuehrungen).flat()
  const schichtAbdeckung = await berechneSchichtAbdeckung(allAuffuehrungen)

  const proben = stueckId
    ? await berechneProbenStats(stueckId)
    : emptyProbenStats()

  const warnungen = berechneWarnungen(besetzung, schichtAbdeckung, proben)

  return { besetzung, schichtAbdeckung, proben, warnungen }
}

// ---------------------------------------------------------------------------
// Besetzung (pure computation — 0 DB queries)
// ---------------------------------------------------------------------------

function berechneBesetzungsFortschritt(
  rollen: RolleMitProduktionsBesetzungen[]
): BesetzungsFortschritt {
  if (rollen.length === 0) {
    return {
      totalRollen: 0,
      besetztRollen: 0,
      vorgemerktRollen: 0,
      offeneRollen: 0,
      progressProzent: 0,
      nachTyp: [],
      unbesetzteHauptrollen: [],
    }
  }

  let besetztRollen = 0
  let vorgemerktRollen = 0
  let offeneRollen = 0
  const unbesetzteHauptrollen: string[] = []

  const typMap = new Map<RollenTyp, { total: number; besetzt: number; offen: number }>()

  for (const rolle of rollen) {
    const hasBesetzt = rolle.besetzungen.some((b) => b.status === 'besetzt')
    const hasVorgemerkt = !hasBesetzt && rolle.besetzungen.some((b) => b.status === 'vorgemerkt')
    const isOffen = !hasBesetzt && !hasVorgemerkt

    if (hasBesetzt) besetztRollen++
    else if (hasVorgemerkt) vorgemerktRollen++
    else offeneRollen++

    if (isOffen && rolle.typ === 'hauptrolle') {
      unbesetzteHauptrollen.push(rolle.name)
    }

    const entry = typMap.get(rolle.typ) ?? { total: 0, besetzt: 0, offen: 0 }
    entry.total++
    if (hasBesetzt) entry.besetzt++
    if (isOffen) entry.offen++
    typMap.set(rolle.typ, entry)
  }

  const totalRollen = rollen.length
  const progressProzent = totalRollen > 0
    ? Math.round((besetztRollen / totalRollen) * 100)
    : 0

  const typOrder: RollenTyp[] = ['hauptrolle', 'nebenrolle', 'ensemble', 'statisterie']
  const nachTyp = typOrder
    .filter((typ) => typMap.has(typ))
    .map((typ) => ({ typ, ...typMap.get(typ)! }))

  return {
    totalRollen,
    besetztRollen,
    vorgemerktRollen,
    offeneRollen,
    progressProzent,
    nachTyp,
    unbesetzteHauptrollen,
  }
}

// ---------------------------------------------------------------------------
// Schichtabdeckung (1 DB call per published Aufführung via getBedarfUebersicht)
// ---------------------------------------------------------------------------

async function berechneSchichtAbdeckung(
  auffuehrungen: Serienauffuehrung[]
): Promise<SchichtAbdeckungProAuffuehrung[]> {
  const results: SchichtAbdeckungProAuffuehrung[] = []

  for (const a of auffuehrungen) {
    const hatVeranstaltung = !!a.veranstaltung_id

    if (!hatVeranstaltung) {
      results.push({
        serienauffuehrungId: a.id,
        datum: a.datum,
        typ: a.typ,
        hatVeranstaltung: false,
        totalBenoetigt: 0,
        totalZugewiesen: 0,
        totalOffen: 0,
        abdeckungProzent: 0,
      })
      continue
    }

    const bedarf = await getBedarfUebersicht(a.veranstaltung_id!)
    const totalBenoetigt = bedarf.reduce((s, b) => s + b.benoetigt, 0)
    const totalZugewiesen = bedarf.reduce((s, b) => s + b.zugewiesen, 0)
    const totalOffen = bedarf.reduce((s, b) => s + b.offen, 0)
    const abdeckungProzent = totalBenoetigt > 0
      ? Math.round((totalZugewiesen / totalBenoetigt) * 100)
      : 100

    results.push({
      serienauffuehrungId: a.id,
      datum: a.datum,
      typ: a.typ,
      hatVeranstaltung: true,
      totalBenoetigt,
      totalZugewiesen,
      totalOffen,
      abdeckungProzent,
    })
  }

  return results
}

// ---------------------------------------------------------------------------
// Proben stats (3 DB queries)
// ---------------------------------------------------------------------------

async function berechneProbenStats(stueckId: string): Promise<ProbenDashboardStats> {
  const supabase = await createClient()

  // 1) Probe statuses
  const { data: proben, error: probenError } = await supabase
    .from('proben')
    .select('id, status')
    .eq('stueck_id', stueckId)

  if (probenError || !proben) {
    console.error('Error fetching proben for dashboard:', probenError)
    return emptyProbenStats()
  }

  if (proben.length === 0) {
    return emptyProbenStats()
  }

  const total = proben.length
  const geplant = proben.filter(
    (p) => p.status === 'geplant' || p.status === 'bestaetigt'
  ).length
  const abgeschlossen = proben.filter((p) => p.status === 'abgeschlossen').length
  const abgesagt = proben.filter((p) => p.status === 'abgesagt').length
  const progressProzent = total > 0
    ? Math.round((abgeschlossen / total) * 100)
    : 0

  // 2) Attendance data
  const probeIds = proben.map((p) => p.id)
  const { data: teilnehmer, error: tnError } = await supabase
    .from('proben_teilnehmer')
    .select('person_id, status')
    .in('probe_id', probeIds)

  if (tnError || !teilnehmer) {
    console.error('Error fetching proben_teilnehmer for dashboard:', tnError)
    return {
      total, geplant, abgeschlossen, abgesagt, progressProzent,
      anwesenheiten: [],
      topAbwesende: [],
    }
  }

  // Count per person: eingeladen = total entries, erschienen = status 'erschienen'
  const personMap = new Map<string, { eingeladen: number; erschienen: number }>()
  for (const t of teilnehmer) {
    const entry = personMap.get(t.person_id) ?? { eingeladen: 0, erschienen: 0 }
    entry.eingeladen++
    if (t.status === 'erschienen') entry.erschienen++
    personMap.set(t.person_id, entry)
  }

  // 3) Person names
  const personIds = [...personMap.keys()]
  let personNames = new Map<string, string>()
  if (personIds.length > 0) {
    const { data: personen } = await supabase
      .from('personen')
      .select('id, vorname, nachname')
      .in('id', personIds)
    if (personen) {
      personNames = new Map(
        personen.map((p) => [p.id, `${p.vorname} ${p.nachname}`])
      )
    }
  }

  const anwesenheiten: ProbenAnwesenheit[] = personIds.map((pid) => {
    const stats = personMap.get(pid)!
    return {
      personId: pid,
      personName: personNames.get(pid) ?? 'Unbekannt',
      eingeladen: stats.eingeladen,
      erschienen: stats.erschienen,
      anwesenheitsquote: stats.eingeladen > 0
        ? Math.round((stats.erschienen / stats.eingeladen) * 100)
        : 0,
    }
  })

  // Top 5 worst attendance (min 3 invites)
  const topAbwesende = [...anwesenheiten]
    .filter((a) => a.eingeladen >= 3)
    .sort((a, b) => a.anwesenheitsquote - b.anwesenheitsquote)
    .slice(0, 5)

  return {
    total, geplant, abgeschlossen, abgesagt, progressProzent,
    anwesenheiten,
    topAbwesende,
  }
}

function emptyProbenStats(): ProbenDashboardStats {
  return {
    total: 0,
    geplant: 0,
    abgeschlossen: 0,
    abgesagt: 0,
    progressProzent: 0,
    anwesenheiten: [],
    topAbwesende: [],
  }
}

// ---------------------------------------------------------------------------
// Warnungen (pure computation)
// ---------------------------------------------------------------------------

function berechneWarnungen(
  besetzung: BesetzungsFortschritt,
  schichtAbdeckung: SchichtAbdeckungProAuffuehrung[],
  proben: ProbenDashboardStats
): DashboardWarnung[] {
  const warnungen: DashboardWarnung[] = []

  // Besetzung warnings
  if (besetzung.unbesetzteHauptrollen.length > 0) {
    warnungen.push({
      typ: 'kritisch',
      kategorie: 'besetzung',
      titel: `${besetzung.unbesetzteHauptrollen.length} Hauptrolle${besetzung.unbesetzteHauptrollen.length > 1 ? 'n' : ''} unbesetzt`,
      beschreibung: besetzung.unbesetzteHauptrollen.join(', '),
    })
  }

  if (besetzung.offeneRollen > 0 && besetzung.unbesetzteHauptrollen.length === 0) {
    warnungen.push({
      typ: 'warnung',
      kategorie: 'besetzung',
      titel: `${besetzung.offeneRollen} Rolle${besetzung.offeneRollen > 1 ? 'n' : ''} noch offen`,
      beschreibung: 'Es gibt noch unbesetzte Rollen in der Produktion.',
    })
  }

  // Schicht warnings
  for (const a of schichtAbdeckung) {
    if (!a.hatVeranstaltung) {
      warnungen.push({
        typ: 'info',
        kategorie: 'schicht',
        titel: 'Aufführung nicht publiziert',
        beschreibung: `${new Date(a.datum).toLocaleDateString('de-CH')} — noch keine Veranstaltung verknüpft.`,
      })
    } else if (a.totalBenoetigt > 0 && a.abdeckungProzent < 50) {
      warnungen.push({
        typ: 'kritisch',
        kategorie: 'schicht',
        titel: `Schichtabdeckung kritisch (${a.abdeckungProzent}%)`,
        beschreibung: `${new Date(a.datum).toLocaleDateString('de-CH')} — ${a.totalOffen} von ${a.totalBenoetigt} Positionen offen.`,
      })
    } else if (a.totalBenoetigt > 0 && a.abdeckungProzent < 80) {
      warnungen.push({
        typ: 'warnung',
        kategorie: 'schicht',
        titel: `Schichtabdeckung unvollständig (${a.abdeckungProzent}%)`,
        beschreibung: `${new Date(a.datum).toLocaleDateString('de-CH')} — ${a.totalOffen} von ${a.totalBenoetigt} Positionen offen.`,
      })
    }
  }

  // Proben warnings
  for (const person of proben.topAbwesende) {
    if (person.anwesenheitsquote < 50) {
      warnungen.push({
        typ: 'warnung',
        kategorie: 'probe',
        titel: `Niedrige Anwesenheit: ${person.personName}`,
        beschreibung: `${person.anwesenheitsquote}% Anwesenheit (${person.erschienen}/${person.eingeladen} Proben).`,
      })
    }
  }

  return warnungen
}
