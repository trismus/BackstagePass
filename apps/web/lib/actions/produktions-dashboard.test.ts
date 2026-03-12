/**
 * Unit Tests for Produktions-Dashboard
 * Issue #348
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockClient } from '@/tests/mocks/supabase'
import type {
  RolleMitProduktionsBesetzungen,
  Serienauffuehrung,
} from '@/lib/supabase/types'

const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

const mockGetBedarfUebersicht = vi.fn()

vi.mock('./auffuehrung-schichten', () => ({
  getBedarfUebersicht: (...args: unknown[]) =>
    mockGetBedarfUebersicht(...args),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { getProduktionDashboardData } from './produktions-dashboard'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainResolving(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.then = (resolve: (v: unknown) => void) => {
    resolve({ data, error })
    return Promise.resolve({ data, error })
  }
  return chain
}

function makeRolle(
  overrides: Partial<RolleMitProduktionsBesetzungen> & { name: string; typ: RolleMitProduktionsBesetzungen['typ'] }
): RolleMitProduktionsBesetzungen {
  return {
    id: `rolle-${overrides.name}`,
    stueck_id: 'stueck-1',
    beschreibung: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    besetzungen: [],
    ...overrides,
  }
}

function makeAuffuehrung(
  overrides: Partial<Serienauffuehrung> = {}
): Serienauffuehrung {
  return {
    id: 'auff-1',
    serie_id: 'serie-1',
    veranstaltung_id: null,
    datum: '2026-06-15',
    startzeit: '19:30:00',
    ort: 'Gemeindesaal',
    typ: 'regulaer',
    ist_ausnahme: false,
    notizen: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests: Besetzung computation
// ---------------------------------------------------------------------------

describe('getProduktionDashboardData — besetzung', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty besetzung when no rollen', async () => {
    const result = await getProduktionDashboardData('prod-1', null, [], {})

    expect(result.besetzung.totalRollen).toBe(0)
    expect(result.besetzung.progressProzent).toBe(0)
    expect(result.besetzung.nachTyp).toEqual([])
  })

  it('computes fully cast production', async () => {
    const rollen: RolleMitProduktionsBesetzungen[] = [
      makeRolle({
        name: 'Hamlet',
        typ: 'hauptrolle',
        besetzungen: [
          {
            id: 'b-1',
            produktion_id: 'prod-1',
            rolle_id: 'rolle-Hamlet',
            person_id: 'person-1',
            typ: 'hauptbesetzung',
            status: 'besetzt',
            notizen: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
            person: { id: 'person-1', vorname: 'Max', nachname: 'M', skills: [] },
          },
        ],
      }),
      makeRolle({
        name: 'Ophelia',
        typ: 'nebenrolle',
        besetzungen: [
          {
            id: 'b-2',
            produktion_id: 'prod-1',
            rolle_id: 'rolle-Ophelia',
            person_id: 'person-2',
            typ: 'hauptbesetzung',
            status: 'besetzt',
            notizen: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
            person: { id: 'person-2', vorname: 'Anna', nachname: 'A', skills: [] },
          },
        ],
      }),
    ]

    const result = await getProduktionDashboardData('prod-1', 'stueck-1', rollen, {})

    expect(result.besetzung.totalRollen).toBe(2)
    expect(result.besetzung.besetztRollen).toBe(2)
    expect(result.besetzung.offeneRollen).toBe(0)
    expect(result.besetzung.progressProzent).toBe(100)
    expect(result.besetzung.unbesetzteHauptrollen).toEqual([])
  })

  it('identifies unbesetzte Hauptrollen', async () => {
    const rollen: RolleMitProduktionsBesetzungen[] = [
      makeRolle({ name: 'Hamlet', typ: 'hauptrolle', besetzungen: [] }),
      makeRolle({ name: 'Ophelia', typ: 'hauptrolle', besetzungen: [] }),
      makeRolle({
        name: 'Wache',
        typ: 'statisterie',
        besetzungen: [
          {
            id: 'b-3',
            produktion_id: 'prod-1',
            rolle_id: 'rolle-Wache',
            person_id: 'person-3',
            typ: 'hauptbesetzung',
            status: 'besetzt',
            notizen: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
            person: { id: 'person-3', vorname: 'Peter', nachname: 'P', skills: [] },
          },
        ],
      }),
    ]

    const result = await getProduktionDashboardData('prod-1', 'stueck-1', rollen, {})

    expect(result.besetzung.offeneRollen).toBe(2)
    expect(result.besetzung.unbesetzteHauptrollen).toEqual(['Hamlet', 'Ophelia'])
    expect(result.besetzung.progressProzent).toBe(33) // 1/3
  })

  it('counts vorgemerkt roles separately', async () => {
    const rollen: RolleMitProduktionsBesetzungen[] = [
      makeRolle({
        name: 'Hamlet',
        typ: 'hauptrolle',
        besetzungen: [
          {
            id: 'b-4',
            produktion_id: 'prod-1',
            rolle_id: 'rolle-Hamlet',
            person_id: 'person-1',
            typ: 'hauptbesetzung',
            status: 'vorgemerkt',
            notizen: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
            person: { id: 'person-1', vorname: 'Max', nachname: 'M', skills: [] },
          },
        ],
      }),
    ]

    const result = await getProduktionDashboardData('prod-1', 'stueck-1', rollen, {})

    expect(result.besetzung.vorgemerktRollen).toBe(1)
    expect(result.besetzung.besetztRollen).toBe(0)
    expect(result.besetzung.offeneRollen).toBe(0)
    // vorgemerkt hauptrolle is NOT counted as unbesetzt
    expect(result.besetzung.unbesetzteHauptrollen).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Tests: Schichtabdeckung
// ---------------------------------------------------------------------------

describe('getProduktionDashboardData — schichtAbdeckung', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks unpublished performances', async () => {
    const auffuehrungen: Record<string, Serienauffuehrung[]> = {
      'serie-1': [makeAuffuehrung({ id: 'a-1', veranstaltung_id: null })],
    }

    const result = await getProduktionDashboardData('prod-1', null, [], auffuehrungen)

    expect(result.schichtAbdeckung).toHaveLength(1)
    expect(result.schichtAbdeckung[0].hatVeranstaltung).toBe(false)
    expect(result.schichtAbdeckung[0].abdeckungProzent).toBe(0)
  })

  it('computes coverage from getBedarfUebersicht', async () => {
    mockGetBedarfUebersicht.mockResolvedValueOnce([
      { rolle: 'Einlass', zeitblock: null, benoetigt: 4, zugewiesen: 3, offen: 1 },
      { rolle: 'Bar', zeitblock: null, benoetigt: 2, zugewiesen: 2, offen: 0 },
    ])

    const auffuehrungen: Record<string, Serienauffuehrung[]> = {
      'serie-1': [
        makeAuffuehrung({ id: 'a-1', veranstaltung_id: 'v-1' }),
      ],
    }

    const result = await getProduktionDashboardData('prod-1', null, [], auffuehrungen)

    expect(result.schichtAbdeckung).toHaveLength(1)
    const s = result.schichtAbdeckung[0]
    expect(s.hatVeranstaltung).toBe(true)
    expect(s.totalBenoetigt).toBe(6)
    expect(s.totalZugewiesen).toBe(5)
    expect(s.totalOffen).toBe(1)
    expect(s.abdeckungProzent).toBe(83)
  })

  it('handles empty performances', async () => {
    const result = await getProduktionDashboardData('prod-1', null, [], {})
    expect(result.schichtAbdeckung).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Tests: Warnungen
// ---------------------------------------------------------------------------

describe('getProduktionDashboardData — warnungen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates kritisch warning for unbesetzte Hauptrollen', async () => {
    const rollen: RolleMitProduktionsBesetzungen[] = [
      makeRolle({ name: 'Hamlet', typ: 'hauptrolle', besetzungen: [] }),
    ]

    const result = await getProduktionDashboardData('prod-1', null, rollen, {})

    const besetzungWarnungen = result.warnungen.filter((w) => w.kategorie === 'besetzung')
    expect(besetzungWarnungen).toHaveLength(1)
    expect(besetzungWarnungen[0].typ).toBe('kritisch')
    expect(besetzungWarnungen[0].beschreibung).toContain('Hamlet')
  })

  it('generates warnung for offene Rollen without Hauptrollen', async () => {
    const rollen: RolleMitProduktionsBesetzungen[] = [
      makeRolle({ name: 'Wache', typ: 'nebenrolle', besetzungen: [] }),
    ]

    const result = await getProduktionDashboardData('prod-1', null, rollen, {})

    const besetzungWarnungen = result.warnungen.filter((w) => w.kategorie === 'besetzung')
    expect(besetzungWarnungen).toHaveLength(1)
    expect(besetzungWarnungen[0].typ).toBe('warnung')
  })

  it('generates info for unpublished performances', async () => {
    const auffuehrungen: Record<string, Serienauffuehrung[]> = {
      'serie-1': [makeAuffuehrung({ veranstaltung_id: null })],
    }

    const result = await getProduktionDashboardData('prod-1', null, [], auffuehrungen)

    const schichtWarnungen = result.warnungen.filter((w) => w.kategorie === 'schicht')
    expect(schichtWarnungen).toHaveLength(1)
    expect(schichtWarnungen[0].typ).toBe('info')
  })

  it('generates kritisch for < 50% coverage', async () => {
    mockGetBedarfUebersicht.mockResolvedValueOnce([
      { rolle: 'Einlass', zeitblock: null, benoetigt: 10, zugewiesen: 3, offen: 7 },
    ])

    const auffuehrungen: Record<string, Serienauffuehrung[]> = {
      'serie-1': [makeAuffuehrung({ veranstaltung_id: 'v-1' })],
    }

    const result = await getProduktionDashboardData('prod-1', null, [], auffuehrungen)

    const schichtWarnungen = result.warnungen.filter((w) => w.kategorie === 'schicht')
    expect(schichtWarnungen).toHaveLength(1)
    expect(schichtWarnungen[0].typ).toBe('kritisch')
  })

  it('returns no warnungen when everything is fine', async () => {
    const rollen: RolleMitProduktionsBesetzungen[] = [
      makeRolle({
        name: 'Hamlet',
        typ: 'hauptrolle',
        besetzungen: [
          {
            id: 'b-1',
            produktion_id: 'prod-1',
            rolle_id: 'rolle-Hamlet',
            person_id: 'person-1',
            typ: 'hauptbesetzung',
            status: 'besetzt',
            notizen: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
            person: { id: 'person-1', vorname: 'Max', nachname: 'M', skills: [] },
          },
        ],
      }),
    ]

    const result = await getProduktionDashboardData('prod-1', null, rollen, {})
    expect(result.warnungen).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Tests: Proben stats
// ---------------------------------------------------------------------------

describe('getProduktionDashboardData — proben', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty proben stats when no stueckId', async () => {
    const result = await getProduktionDashboardData('prod-1', null, [], {})
    expect(result.proben.total).toBe(0)
    expect(result.proben.anwesenheiten).toEqual([])
  })

  it('computes proben stats with attendance data', async () => {
    // Mock proben query
    mockSupabase.from
      .mockReturnValueOnce(
        chainResolving([
          { id: 'p-1', status: 'abgeschlossen' },
          { id: 'p-2', status: 'geplant' },
          { id: 'p-3', status: 'abgesagt' },
        ])
      )
      // Mock proben_teilnehmer query
      .mockReturnValueOnce(
        chainResolving([
          { person_id: 'pers-1', status: 'erschienen' },
          { person_id: 'pers-1', status: 'erschienen' },
          { person_id: 'pers-1', status: 'abgesagt' },
          { person_id: 'pers-2', status: 'erschienen' },
          { person_id: 'pers-2', status: 'abgesagt' },
          { person_id: 'pers-2', status: 'abgesagt' },
        ])
      )
      // Mock personen query
      .mockReturnValueOnce(
        chainResolving([
          { id: 'pers-1', vorname: 'Max', nachname: 'Muster' },
          { id: 'pers-2', vorname: 'Anna', nachname: 'Test' },
        ])
      )

    const result = await getProduktionDashboardData('prod-1', 'stueck-1', [], {})

    expect(result.proben.total).toBe(3)
    expect(result.proben.abgeschlossen).toBe(1)
    expect(result.proben.geplant).toBe(1)
    expect(result.proben.abgesagt).toBe(1)
    expect(result.proben.progressProzent).toBe(33) // 1/3

    expect(result.proben.anwesenheiten).toHaveLength(2)
    const max = result.proben.anwesenheiten.find((a) => a.personId === 'pers-1')
    expect(max?.eingeladen).toBe(3)
    expect(max?.erschienen).toBe(2)
    expect(max?.anwesenheitsquote).toBe(67)

    const anna = result.proben.anwesenheiten.find((a) => a.personId === 'pers-2')
    expect(anna?.eingeladen).toBe(3)
    expect(anna?.erschienen).toBe(1)
    expect(anna?.anwesenheitsquote).toBe(33)

    // Both have >= 3 invites, sorted by worst attendance first
    expect(result.proben.topAbwesende).toHaveLength(2)
    expect(result.proben.topAbwesende[0].personId).toBe('pers-2') // Anna: 33%
    expect(result.proben.topAbwesende[1].personId).toBe('pers-1') // Max: 67%
  })

  it('handles empty proben list', async () => {
    mockSupabase.from.mockReturnValueOnce(chainResolving([]))

    const result = await getProduktionDashboardData('prod-1', 'stueck-1', [], {})

    expect(result.proben.total).toBe(0)
    expect(result.proben.anwesenheiten).toEqual([])
  })
})
