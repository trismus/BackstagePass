/**
 * Unit Tests for Person Engagements
 * Issue #349
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockClient, mockVorstandProfile } from '@/tests/mocks/supabase'

const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getUserProfile: vi.fn(() => Promise.resolve(mockVorstandProfile)),
}))

vi.mock('@/lib/supabase/auth-helpers', () => ({
  requirePermission: vi.fn(() => Promise.resolve(mockVorstandProfile)),
}))

vi.mock('@/lib/supabase/permissions', () => ({
  isManagement: vi.fn((role: string) => role === 'ADMIN' || role === 'VORSTAND'),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { getPersonEngagements } from './person-engagements'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainResolving(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.not = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data, error })
  chain.then = (resolve: (v: unknown) => void) => {
    resolve({ data, error })
    return Promise.resolve({ data, error })
  }
  return chain
}

describe('Person Engagements (Issue #349)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // getPersonEngagements
  // =========================================================================

  describe('getPersonEngagements', () => {
    it('returns empty result for non-management role', async () => {
      const { requirePermission } = await import('@/lib/supabase/auth-helpers')
      vi.mocked(requirePermission).mockResolvedValueOnce({
        ...mockVorstandProfile,
        role: 'MITGLIED_AKTIV',
      } as never)

      const result = await getPersonEngagements('person-1')

      expect(result.stueckBesetzungen).toHaveLength(0)
      expect(result.produktionsBesetzungen).toHaveLength(0)
      expect(result.statistik.totalProduktionen).toBe(0)
    })

    it('fetches all 6 engagement types in parallel', async () => {
      // First call: personen (for profile_id)
      // Then 6 parallel calls for each engagement type
      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'personen') {
          return chainResolving({ profile_id: 'profile-1' })
        }
        // Return empty arrays for all other tables
        return chainResolving([])
      })

      const result = await getPersonEngagements('person-1')

      // Should have called `from` for: personen + besetzungen + produktions_besetzungen + produktions_stab + auffuehrung_zuweisungen + proben_teilnehmer + helfer_anmeldungen
      expect(callCount).toBeGreaterThanOrEqual(7)
      expect(result.stueckBesetzungen).toEqual([])
      expect(result.produktionsBesetzungen).toEqual([])
      expect(result.produktionsStab).toEqual([])
      expect(result.auffuehrungsZuweisungen).toEqual([])
      expect(result.probenTeilnahmen).toEqual([])
      expect(result.helferAnmeldungen).toEqual([])
    })

    it('calculates statistik correctly', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'personen') {
          return chainResolving({ profile_id: 'profile-1' })
        }
        if (table === 'besetzungen') {
          return chainResolving([
            {
              id: 'b1',
              typ: 'hauptbesetzung',
              gueltig_von: null,
              gueltig_bis: null,
              rolle: { name: 'Hamlet', typ: 'hauptrolle', stueck: { id: 's1', titel: 'Hamlet' } },
            },
          ])
        }
        if (table === 'produktions_besetzungen') {
          return chainResolving([
            {
              id: 'pb1',
              typ: 'hauptbesetzung',
              status: 'besetzt',
              rolle: { name: 'Hamlet', typ: 'hauptrolle' },
              produktion: { id: 'prod-1', titel: 'Hamlet 2026', status: 'proben' },
            },
          ])
        }
        if (table === 'produktions_stab') {
          return chainResolving([
            {
              id: 'ps1',
              funktion: 'Regisseur',
              ist_leitung: true,
              von: '2026-01-01',
              bis: null,
              produktion: { id: 'prod-1', titel: 'Hamlet 2026', status: 'proben' },
            },
          ])
        }
        if (table === 'auffuehrung_zuweisungen') {
          return chainResolving([
            {
              id: 'z1',
              status: 'zugesagt',
              checked_in_at: null,
              schicht: {
                rolle: 'Darsteller',
                zeitblock: {
                  name: 'Aufführung',
                  startzeit: '19:30',
                  endzeit: '22:00',
                  veranstaltung: { id: 'v1', titel: 'Premiere', datum: '2026-06-15' },
                },
              },
            },
            {
              id: 'z2',
              status: 'abgesagt',
              checked_in_at: null,
              schicht: {
                rolle: 'Darsteller',
                zeitblock: {
                  name: 'Aufführung',
                  startzeit: '19:30',
                  endzeit: '22:00',
                  veranstaltung: { id: 'v2', titel: 'Zweite Vorstellung', datum: '2026-06-16' },
                },
              },
            },
          ])
        }
        if (table === 'proben_teilnehmer') {
          return chainResolving([
            {
              id: 't1',
              status: 'erschienen',
              probe: { id: 'p1', titel: 'Probe 1', datum: '2026-03-01', stueck: { id: 's1', titel: 'Hamlet' } },
            },
            {
              id: 't2',
              status: 'abgesagt',
              probe: { id: 'p2', titel: 'Probe 2', datum: '2026-03-08', stueck: { id: 's1', titel: 'Hamlet' } },
            },
            {
              id: 't3',
              status: 'erschienen',
              probe: { id: 'p3', titel: 'Probe 3', datum: '2026-03-15', stueck: { id: 's1', titel: 'Hamlet' } },
            },
          ])
        }
        if (table === 'helfer_anmeldungen') {
          return chainResolving([
            {
              id: 'ha1',
              status: 'bestaetigt',
              rollen_instanz: {
                zeitblock_start: '2026-06-15T17:00:00Z',
                zeitblock_end: '2026-06-15T19:00:00Z',
                template: { name: 'Einlass' },
                helfer_event: { id: 'he1', name: 'Premiere Helfer', datum_start: '2026-06-15' },
              },
            },
          ])
        }
        return chainResolving([])
      })

      const result = await getPersonEngagements('person-1')

      // Stueck besetzungen
      expect(result.stueckBesetzungen).toHaveLength(1)
      expect(result.stueckBesetzungen[0].rolleName).toBe('Hamlet')

      // Produktions besetzungen
      expect(result.produktionsBesetzungen).toHaveLength(1)
      expect(result.produktionsBesetzungen[0].produktionTitel).toBe('Hamlet 2026')

      // Stab
      expect(result.produktionsStab).toHaveLength(1)
      expect(result.produktionsStab[0].funktion).toBe('Regisseur')

      // Zuweisungen
      expect(result.auffuehrungsZuweisungen).toHaveLength(2)

      // Proben
      expect(result.probenTeilnahmen).toHaveLength(3)

      // Helfer
      expect(result.helferAnmeldungen).toHaveLength(1)

      // Statistik
      expect(result.statistik.totalProduktionen).toBe(1) // Only 1 unique produktion
      expect(result.statistik.totalStueckBesetzungen).toBe(1)
      expect(result.statistik.totalAuffuehrungen).toBe(1) // Only zugesagt/erschienen
      expect(result.statistik.totalProben).toBe(3)
      expect(result.statistik.probenAnwesenheitsquote).toBe(67) // 2/3 = 67%
      expect(result.statistik.totalHelferEinsaetze).toBe(1)
    })

    it('handles person with no engagements', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'personen') {
          return chainResolving({ profile_id: null })
        }
        return chainResolving([])
      })

      const result = await getPersonEngagements('person-empty')

      expect(result.stueckBesetzungen).toEqual([])
      expect(result.produktionsBesetzungen).toEqual([])
      expect(result.produktionsStab).toEqual([])
      expect(result.auffuehrungsZuweisungen).toEqual([])
      expect(result.probenTeilnahmen).toEqual([])
      expect(result.helferAnmeldungen).toEqual([])
      expect(result.statistik.totalProduktionen).toBe(0)
      expect(result.statistik.probenAnwesenheitsquote).toBe(0)
    })

    it('handles missing profile_id gracefully for helfer_anmeldungen', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'personen') {
          return chainResolving({ profile_id: null })
        }
        return chainResolving([])
      })

      const result = await getPersonEngagements('person-no-profile')

      // All should be empty — helfer_anmeldungen requires profile_id
      expect(result.helferAnmeldungen).toEqual([])
    })
  })
})
