/**
 * Unit tests for checkProbeKonflikteFull (Issue #487)
 *
 * Verifies the aggregation logic: Cast-Set derivation, per-person fanout,
 * exclude-Probe filter, and result shaping.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockClient, mockVorstandProfile } from '@/tests/mocks/supabase'
import type { PersonConflict } from '@/lib/supabase/types'

const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getUserProfile: vi.fn(() => Promise.resolve(mockVorstandProfile)),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockCheckPersonConflicts = vi.fn()
vi.mock('./conflict-check', () => ({
  checkPersonConflicts: (...args: unknown[]) =>
    mockCheckPersonConflicts(...args),
}))

vi.mock('./verfuegbarkeiten', () => ({
  checkMultipleMembersAvailability: vi.fn(),
}))

import { checkProbeKonflikteFull } from './proben'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainResolving(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.not = vi.fn().mockReturnValue(chain)
  chain.lte = vi.fn().mockReturnValue(chain)
  chain.gte = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data, error })
  chain.then = (resolve: (v: unknown) => void) => {
    resolve({ data, error })
    return Promise.resolve({ data, error })
  }
  return chain
}

function makeConflict(overrides: Partial<PersonConflict> = {}): PersonConflict {
  return {
    type: 'anmeldung',
    description: 'Vereinsabend',
    start_time: '2026-06-25T18:00:00+02:00',
    end_time: '2026-06-25T22:00:00+02:00',
    reference_id: 'anm-1',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('checkProbeKonflikteFull (Issue #487)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty result when datum is missing', async () => {
    const result = await checkProbeKonflikteFull({
      stueckId: 'st-1',
      datum: '',
    })
    expect(result.personenMitKonflikten).toEqual([])
    expect(result.totalGeprueft).toBe(0)
    expect(result.totalKonflikte).toBe(0)
    expect(result.zeitfensterUnklar).toBe(true)
  })

  it('returns empty when no cast members are found', async () => {
    ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === 'besetzungen') return chainResolving([])
        return chainResolving([])
      }
    )

    const result = await checkProbeKonflikteFull({
      stueckId: 'st-1',
      datum: '2026-06-25',
      startzeit: '18:00',
      endzeit: '21:00',
    })

    expect(result.personenMitKonflikten).toEqual([])
    expect(result.totalGeprueft).toBe(0)
    expect(result.totalKonflikte).toBe(0)
  })

  it('returns clean result when cast exists but no conflicts', async () => {
    ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === 'besetzungen')
          return chainResolving([
            { person_id: 'p-1', rolle: { stueck_id: 'st-1' } },
            { person_id: 'p-2', rolle: { stueck_id: 'st-1' } },
          ])
        if (table === 'personen')
          return chainResolving([
            { id: 'p-1', vorname: 'Anna', nachname: 'Schmidt' },
            { id: 'p-2', vorname: 'Bert', nachname: 'Maier' },
          ])
        return chainResolving([])
      }
    )

    mockCheckPersonConflicts.mockResolvedValue({
      has_conflicts: false,
      conflicts: [],
    })

    const result = await checkProbeKonflikteFull({
      stueckId: 'st-1',
      datum: '2026-06-25',
      startzeit: '18:00',
      endzeit: '21:00',
    })

    expect(result.totalGeprueft).toBe(2)
    expect(result.personenMitKonflikten).toEqual([])
    expect(result.totalKonflikte).toBe(0)
    expect(result.zeitfensterUnklar).toBe(false)
    expect(mockCheckPersonConflicts).toHaveBeenCalledTimes(2)
  })

  it('aggregates conflicts grouped by person, sorted by name', async () => {
    ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === 'besetzungen')
          return chainResolving([
            { person_id: 'p-1', rolle: { stueck_id: 'st-1' } },
            { person_id: 'p-2', rolle: { stueck_id: 'st-1' } },
            { person_id: 'p-3', rolle: { stueck_id: 'st-1' } },
            // Cast from another play -> filtered out
            { person_id: 'p-4', rolle: { stueck_id: 'st-OTHER' } },
          ])
        if (table === 'personen')
          return chainResolving([
            { id: 'p-1', vorname: 'Zorro', nachname: 'Z' },
            { id: 'p-3', vorname: 'Anna', nachname: 'Schmidt' },
          ])
        return chainResolving([])
      }
    )

    mockCheckPersonConflicts.mockImplementation(async (personId: string) => {
      if (personId === 'p-1') {
        return {
          has_conflicts: true,
          conflicts: [
            makeConflict({ reference_id: 'c1a' }),
            makeConflict({
              type: 'verfuegbarkeit',
              description: 'Ferien',
              reference_id: 'c1b',
              severity: 'nicht_verfuegbar',
            }),
          ],
        }
      }
      if (personId === 'p-2') {
        return { has_conflicts: false, conflicts: [] }
      }
      if (personId === 'p-3') {
        return {
          has_conflicts: true,
          conflicts: [
            makeConflict({ type: 'zuweisung', reference_id: 'c3a' }),
          ],
        }
      }
      return { has_conflicts: false, conflicts: [] }
    })

    const result = await checkProbeKonflikteFull({
      stueckId: 'st-1',
      datum: '2026-06-25',
      startzeit: '18:00',
      endzeit: '21:00',
    })

    expect(result.totalGeprueft).toBe(3)
    expect(result.totalKonflikte).toBe(3)
    expect(result.personenMitKonflikten).toHaveLength(2)
    // sorted alphabetically by name
    expect(result.personenMitKonflikten[0].personName).toBe('Anna Schmidt')
    expect(result.personenMitKonflikten[1].personName).toBe('Zorro Z')
    expect(result.personenMitKonflikten[0].conflicts).toHaveLength(1)
    expect(result.personenMitKonflikten[1].conflicts).toHaveLength(2)
  })

  it('filters out the same-probe conflict when excludeProbeId is set', async () => {
    ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === 'besetzungen')
          return chainResolving([
            { person_id: 'p-1', rolle: { stueck_id: 'st-1' } },
          ])
        if (table === 'personen')
          return chainResolving([
            { id: 'p-1', vorname: 'Anna', nachname: 'Schmidt' },
          ])
        return chainResolving([])
      }
    )

    mockCheckPersonConflicts.mockResolvedValue({
      has_conflicts: true,
      conflicts: [
        makeConflict({
          type: 'probe',
          reference_id: 'probe-self',
          description: 'Die aktuelle Probe',
        }),
        makeConflict({
          type: 'probe',
          reference_id: 'probe-other',
          description: 'Andere Probe',
        }),
      ],
    })

    const result = await checkProbeKonflikteFull({
      stueckId: 'st-1',
      datum: '2026-06-25',
      startzeit: '18:00',
      endzeit: '21:00',
      excludeProbeId: 'probe-self',
    })

    expect(result.totalKonflikte).toBe(1)
    expect(result.personenMitKonflikten[0].conflicts[0].reference_id).toBe(
      'probe-other'
    )
  })

  it('unions explicit teilnehmerPersonIds with cast set', async () => {
    ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === 'besetzungen')
          return chainResolving([
            { person_id: 'p-cast', rolle: { stueck_id: 'st-1' } },
          ])
        if (table === 'personen')
          return chainResolving([
            { id: 'p-cast', vorname: 'Cast', nachname: 'Person' },
            { id: 'p-extra', vorname: 'Extra', nachname: 'Helfer' },
          ])
        return chainResolving([])
      }
    )

    mockCheckPersonConflicts.mockImplementation(async (personId: string) => {
      return {
        has_conflicts: true,
        conflicts: [makeConflict({ reference_id: `c-${personId}` })],
      }
    })

    const result = await checkProbeKonflikteFull({
      stueckId: 'st-1',
      datum: '2026-06-25',
      startzeit: '18:00',
      endzeit: '21:00',
      teilnehmerPersonIds: ['p-extra'],
    })

    expect(result.totalGeprueft).toBe(2)
    expect(result.personenMitKonflikten).toHaveLength(2)
  })

  it('reports zeitfensterUnklar when startzeit/endzeit missing', async () => {
    ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === 'besetzungen')
          return chainResolving([
            { person_id: 'p-1', rolle: { stueck_id: 'st-1' } },
          ])
        if (table === 'personen')
          return chainResolving([
            { id: 'p-1', vorname: 'Anna', nachname: 'Schmidt' },
          ])
        return chainResolving([])
      }
    )

    mockCheckPersonConflicts.mockResolvedValue({
      has_conflicts: false,
      conflicts: [],
    })

    const result = await checkProbeKonflikteFull({
      stueckId: 'st-1',
      datum: '2026-06-25',
    })

    expect(result.zeitfensterUnklar).toBe(true)
    // Still calls the conflict check with day-wide window
    expect(mockCheckPersonConflicts).toHaveBeenCalledTimes(1)
    const callArgs = mockCheckPersonConflicts.mock.calls[0]
    expect(callArgs[1]).toMatch(/^2026-06-25T00:00:00[+-]/)
    expect(callArgs[2]).toMatch(/^2026-06-25T23:59:00[+-]/)
  })
})
