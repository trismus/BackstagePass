/**
 * Unit Tests for Proben Verfügbarkeit (Issue #350)
 * Tests for checkProbeVerfuegbarkeit and suggestOptimalProbeTermin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockClient, mockVorstandProfile } from '@/tests/mocks/supabase'

const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getUserProfile: vi.fn(() => Promise.resolve(mockVorstandProfile)),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockCheckMultipleMembersAvailability = vi.fn()

vi.mock('./verfuegbarkeiten', () => ({
  checkMultipleMembersAvailability: (...args: unknown[]) =>
    mockCheckMultipleMembersAvailability(...args),
}))

import {
  checkProbeVerfuegbarkeit,
  suggestOptimalProbeTermin,
} from './proben'

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

describe('Proben Verfügbarkeit (Issue #350)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // checkProbeVerfuegbarkeit
  // =========================================================================

  describe('checkProbeVerfuegbarkeit', () => {
    it('returns warnings for unavailable cast members', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'besetzungen') {
          return chainResolving([
            { person_id: 'p1', rolle: { stueck_id: 'stueck-1' } },
            { person_id: 'p2', rolle: { stueck_id: 'stueck-1' } },
            { person_id: 'p3', rolle: { stueck_id: 'stueck-1' } },
          ])
        }
        if (table === 'personen') {
          return chainResolving([
            { id: 'p2', vorname: 'Anna', nachname: 'Müller' },
          ])
        }
        if (table === 'verfuegbarkeiten') {
          return chainResolving([
            { mitglied_id: 'p2', status: 'nicht_verfuegbar', grund: 'Urlaub' },
          ])
        }
        return chainResolving([])
      })

      // p1: verfuegbar, p2: nicht_verfuegbar, p3: verfuegbar
      mockCheckMultipleMembersAvailability.mockResolvedValue(
        new Map([
          ['p1', 'verfuegbar'],
          ['p2', 'nicht_verfuegbar'],
          ['p3', 'verfuegbar'],
        ])
      )

      const result = await checkProbeVerfuegbarkeit('stueck-1', '2026-03-15')

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].personName).toBe('Anna Müller')
      expect(result.warnings[0].status).toBe('nicht_verfuegbar')
      expect(result.warnings[0].grund).toBe('Urlaub')
    })

    it('returns empty warnings when all cast is available', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'besetzungen') {
          return chainResolving([
            { person_id: 'p1', rolle: { stueck_id: 'stueck-1' } },
          ])
        }
        return chainResolving([])
      })

      mockCheckMultipleMembersAvailability.mockResolvedValue(
        new Map([['p1', 'verfuegbar']])
      )

      const result = await checkProbeVerfuegbarkeit('stueck-1', '2026-03-15')

      expect(result.warnings).toHaveLength(0)
    })

    it('returns empty warnings when no besetzungen exist', async () => {
      mockSupabase.from.mockImplementation(() => {
        return chainResolving([])
      })

      const result = await checkProbeVerfuegbarkeit('stueck-1', '2026-03-15')

      expect(result.warnings).toHaveLength(0)
      expect(mockCheckMultipleMembersAvailability).not.toHaveBeenCalled()
    })

    it('filters by szenen when szenenIds provided', async () => {
      let besetzungenCallCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'szenen_rollen') {
          return chainResolving([{ rolle_id: 'rolle-1' }])
        }
        if (table === 'besetzungen') {
          besetzungenCallCount++
          return chainResolving([
            { person_id: 'p1', rolle: { stueck_id: 'stueck-1' } },
          ])
        }
        return chainResolving([])
      })

      mockCheckMultipleMembersAvailability.mockResolvedValue(
        new Map([['p1', 'verfuegbar']])
      )

      await checkProbeVerfuegbarkeit('stueck-1', '2026-03-15', ['szene-1'])

      // Should have queried szenen_rollen first
      expect(mockSupabase.from).toHaveBeenCalledWith('szenen_rollen')
      expect(besetzungenCallCount).toBe(1)
    })
  })

  // =========================================================================
  // suggestOptimalProbeTermin
  // =========================================================================

  describe('suggestOptimalProbeTermin', () => {
    it('returns sorted dates with highest availability first', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'besetzungen') {
          return chainResolving([
            { person_id: 'p1', rolle: { stueck_id: 'stueck-1', name: 'Hamlet' } },
            { person_id: 'p2', rolle: { stueck_id: 'stueck-1', name: 'Ophelia' } },
          ])
        }
        if (table === 'personen') {
          return chainResolving([
            { id: 'p1', vorname: 'Max', nachname: 'Muster' },
            { id: 'p2', vorname: 'Anna', nachname: 'Müller' },
          ])
        }
        return chainResolving([])
      })

      // 3 candidate dates: Mon, Tue, Wed
      // Mon: both available (100%)
      // Tue: p2 unavailable (50%)
      // Wed: both available (100%)
      let callIndex = 0
      mockCheckMultipleMembersAvailability.mockImplementation(() => {
        callIndex++
        if (callIndex === 2) {
          // Tuesday — p2 unavailable
          return Promise.resolve(
            new Map([
              ['p1', 'verfuegbar'],
              ['p2', 'nicht_verfuegbar'],
            ])
          )
        }
        return Promise.resolve(
          new Map([
            ['p1', 'verfuegbar'],
            ['p2', 'verfuegbar'],
          ])
        )
      })

      const result = await suggestOptimalProbeTermin(
        'stueck-1',
        [],
        '2026-03-02', // Monday
        '2026-03-04'  // Wednesday
      )

      expect(result.length).toBe(3)
      // First two should be 100% available
      expect(result[0].verfuegbarkeitsProzent).toBe(100)
      // Last should be 50% (Tuesday)
      expect(result[2].verfuegbarkeitsProzent).toBe(50)
      expect(result[2].nichtVerfuegbar).toHaveLength(1)
      expect(result[2].nichtVerfuegbar[0].personName).toBe('Anna Müller')
    })

    it('returns empty array when no cast members', async () => {
      mockSupabase.from.mockImplementation(() => {
        return chainResolving([])
      })

      const result = await suggestOptimalProbeTermin(
        'stueck-1',
        [],
        '2026-03-01',
        '2026-03-07'
      )

      expect(result).toEqual([])
      expect(mockCheckMultipleMembersAvailability).not.toHaveBeenCalled()
    })

    it('limits results to 10 dates', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'besetzungen') {
          return chainResolving([
            { person_id: 'p1', rolle: { stueck_id: 'stueck-1', name: 'Hamlet' } },
          ])
        }
        if (table === 'personen') {
          return chainResolving([
            { id: 'p1', vorname: 'Max', nachname: 'Muster' },
          ])
        }
        return chainResolving([])
      })

      mockCheckMultipleMembersAvailability.mockResolvedValue(
        new Map([['p1', 'verfuegbar']])
      )

      // 14-day range = 15 candidate dates
      const result = await suggestOptimalProbeTermin(
        'stueck-1',
        [],
        '2026-03-01',
        '2026-03-15'
      )

      expect(result.length).toBeLessThanOrEqual(10)
    })
  })
})
