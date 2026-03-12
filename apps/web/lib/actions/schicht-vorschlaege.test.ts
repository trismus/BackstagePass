/**
 * Unit Tests for Skills-based Shift Suggestions
 * Issue #347
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockClient } from '@/tests/mocks/supabase'

const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

const mockRequirePermission = vi.fn()

vi.mock('@/lib/supabase/auth-helpers', () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}))

const mockCheckPersonConflicts = vi.fn()

vi.mock('./conflict-check', () => ({
  checkPersonConflicts: (...args: unknown[]) => mockCheckPersonConflicts(...args),
}))

import { suggestPersonenForSchicht } from './schicht-vorschlaege'

describe('suggestPersonenForSchicht', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSchicht = {
    id: 'schicht-1',
    benoetigte_skills: ['Licht', 'Ton', 'Kasse'],
    zeitblock_id: 'zb-1',
    veranstaltung_id: 'v-1',
  }

  const mockPersonen = [
    { id: 'p-1', vorname: 'Anna', nachname: 'Meier', email: 'anna@test.ch', skills: ['Licht', 'Ton', 'Kasse'] },
    { id: 'p-2', vorname: 'Beat', nachname: 'Keller', email: 'beat@test.ch', skills: ['Licht'] },
    { id: 'p-3', vorname: 'Clara', nachname: 'Brunner', email: 'clara@test.ch', skills: ['Ton', 'Kasse'] },
    { id: 'p-4', vorname: 'Daniel', nachname: 'Aebischer', email: 'daniel@test.ch', skills: [] },
  ]

  function setupMocks(opts?: {
    schicht?: typeof mockSchicht | null
    personen?: typeof mockPersonen
    zuweisungen?: { person_id: string }[]
    veranstaltung?: { datum: string } | null
    zeitblock?: { startzeit: string; endzeit: string } | null
  }) {
    const schicht = opts?.schicht !== undefined ? opts.schicht : mockSchicht
    const personen = opts?.personen ?? mockPersonen
    const zuweisungen = opts?.zuweisungen ?? []
    const veranstaltung = opts?.veranstaltung !== undefined ? opts.veranstaltung : { datum: '2026-06-15' }
    const zeitblock = opts?.zeitblock !== undefined ? opts.zeitblock : { startzeit: '18:00:00', endzeit: '22:00:00' }

    // Mock the chained Supabase calls
    // Call 1: schicht fetch
    const schichtChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: schicht,
        error: schicht ? null : { message: 'Not found' },
      }),
    }

    // Call 2: veranstaltung fetch
    const veranstaltungChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: veranstaltung,
        error: null,
      }),
    }

    // Call 3: zeitblock fetch
    const zeitblockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: zeitblock,
        error: null,
      }),
    }

    // Call 4: personen fetch
    const personenChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: personen,
        error: null,
      }),
    }

    // Call 5: zuweisungen fetch
    const zuweisungenChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: zuweisungen,
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'auffuehrung_schichten') {
        return schichtChain
      }
      if (table === 'veranstaltungen') {
        return veranstaltungChain
      }
      if (table === 'zeitbloecke') {
        return zeitblockChain
      }
      if (table === 'personen') {
        return personenChain
      }
      if (table === 'auffuehrung_zuweisungen') {
        return zuweisungenChain
      }
      return zuweisungenChain
    })
  }

  it('returns candidates sorted by match_count DESC', async () => {
    setupMocks()
    mockCheckPersonConflicts.mockResolvedValue({ has_conflicts: false, conflicts: [] })

    const result = await suggestPersonenForSchicht('schicht-1')

    expect(result).toHaveLength(4)
    // Anna has 3/3 matches → first
    expect(result[0].person_id).toBe('p-1')
    expect(result[0].match_count).toBe(3)
    expect(result[0].matching_skills).toEqual(['Licht', 'Ton', 'Kasse'])
    // Clara has 2/3 matches → second
    expect(result[1].person_id).toBe('p-3')
    expect(result[1].match_count).toBe(2)
    // Beat has 1/3 → third
    expect(result[2].person_id).toBe('p-2')
    expect(result[2].match_count).toBe(1)
    // Daniel has 0/3, nachname Aebischer → fourth (sorted after Beat Keller by match, then nachname)
    expect(result[3].person_id).toBe('p-4')
    expect(result[3].match_count).toBe(0)
  })

  it('filters out already-assigned persons', async () => {
    setupMocks({
      zuweisungen: [{ person_id: 'p-1' }], // Anna already assigned
    })
    mockCheckPersonConflicts.mockResolvedValue({ has_conflicts: false, conflicts: [] })

    const result = await suggestPersonenForSchicht('schicht-1')

    expect(result).toHaveLength(3)
    expect(result.find((c) => c.person_id === 'p-1')).toBeUndefined()
  })

  it('returns all persons when benoetigte_skills is empty', async () => {
    setupMocks({
      schicht: { ...mockSchicht, benoetigte_skills: [] },
    })
    mockCheckPersonConflicts.mockResolvedValue({ has_conflicts: false, conflicts: [] })

    const result = await suggestPersonenForSchicht('schicht-1')

    expect(result).toHaveLength(4)
    // All should have match_count 0 and total_required 0
    result.forEach((c) => {
      expect(c.match_count).toBe(0)
      expect(c.total_required).toBe(0)
    })
  })

  it('includes conflict info for candidates', async () => {
    setupMocks()
    // First call: Anna has conflict
    mockCheckPersonConflicts
      .mockResolvedValueOnce({
        has_conflicts: true,
        conflicts: [{ type: 'zuweisung', description: 'Einlass', start_time: '2026-06-15T18:00:00', end_time: '2026-06-15T20:00:00', reference_id: 'ref-1' }],
      })
      // Remaining calls: no conflicts
      .mockResolvedValue({ has_conflicts: false, conflicts: [] })

    const result = await suggestPersonenForSchicht('schicht-1')

    // Anna (first by skill match) should have conflicts
    expect(result[0].person_id).toBe('p-1')
    expect(result[0].has_conflicts).toBe(true)
    expect(result[0].conflicts).toHaveLength(1)

    // Clara should have no conflicts
    expect(result[1].has_conflicts).toBe(false)
    expect(result[1].conflicts).toEqual([])
  })

  it('requires veranstaltungen:write permission', async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error('Unauthorized'))

    await expect(
      suggestPersonenForSchicht('schicht-1')
    ).rejects.toThrow('Unauthorized')

    expect(mockRequirePermission).toHaveBeenCalledWith('veranstaltungen:write')
  })

  it('returns empty array when schicht not found', async () => {
    setupMocks({ schicht: null })

    const result = await suggestPersonenForSchicht('nonexistent')

    expect(result).toEqual([])
  })
})
