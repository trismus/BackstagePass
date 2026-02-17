/**
 * Unit Tests for Zuweisungen Generator
 * Issue #344
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
  checkPersonConflicts: (...args: unknown[]) =>
    mockCheckPersonConflicts(...args),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import {
  generateZuweisungenPreview,
  confirmZuweisungen,
} from './zuweisungen-generator'

// Helper to create a chainable mock that resolves
function chainResolving(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.neq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.not = vi.fn().mockReturnValue(chain)
  chain.then = (resolve: (v: unknown) => void) => {
    resolve({ data, error })
    return Promise.resolve({ data, error })
  }
  return chain
}

function chainUpsert(count: number | null, error: unknown = null) {
  return {
    data: error ? null : [],
    error,
    count,
  }
}

describe('generateZuweisungenPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequirePermission.mockResolvedValue({
      id: 'user-1',
      display_name: 'Test User',
      role: 'ADMIN',
    })
    mockCheckPersonConflicts.mockResolvedValue({
      has_conflicts: false,
      conflicts: [],
    })
  })

  it('returns empty result when no besetzt entries', async () => {
    mockSupabase.from.mockReturnValueOnce(chainResolving([]))

    const result = await generateZuweisungenPreview('prod-1')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.vorschlaege).toEqual([])
      expect(result.data.stats.total_besetzt).toBe(0)
    }
  })

  it('returns auffuehrungen_ohne_veranstaltung correctly', async () => {
    // besetzungen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'b-1', person_id: 'p-1', rolle_id: 'r-1' }])
    )
    // personen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'p-1', vorname: 'Max', nachname: 'Muster' }])
    )
    // serien
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 's-1', name: 'Frühling 2026' }])
    )
    // serienauffuehrungen - no veranstaltung_id
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([
        {
          id: 'sa-1',
          serie_id: 's-1',
          veranstaltung_id: null,
          datum: '2026-06-15',
        },
      ])
    )

    const result = await generateZuweisungenPreview('prod-1')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.auffuehrungen_ohne_veranstaltung).toHaveLength(1)
      expect(result.data.auffuehrungen_ohne_veranstaltung[0]).toEqual({
        id: 'sa-1',
        datum: '2026-06-15',
        serie_name: 'Frühling 2026',
      })
    }
  })

  it('returns veranstaltungen_ohne_vorfuehrung correctly', async () => {
    // besetzungen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'b-1', person_id: 'p-1', rolle_id: 'r-1' }])
    )
    // personen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'p-1', vorname: 'Max', nachname: 'Muster' }])
    )
    // serien
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 's-1', name: 'Serie 1' }])
    )
    // serienauffuehrungen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([
        {
          id: 'sa-1',
          serie_id: 's-1',
          veranstaltung_id: 'v-1',
          datum: '2026-06-15',
        },
      ])
    )
    // veranstaltungen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'v-1', titel: 'Premiere', datum: '2026-06-15' }])
    )
    // zeitbloecke - empty (no vorfuehrung blocks)
    mockSupabase.from.mockReturnValueOnce(chainResolving([]))

    const result = await generateZuweisungenPreview('prod-1')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.veranstaltungen_ohne_vorfuehrung).toHaveLength(1)
      expect(
        result.data.veranstaltungen_ohne_vorfuehrung[0].veranstaltung_id
      ).toBe('v-1')
    }
  })

  it('generates correct proposals for simple case', async () => {
    // besetzungen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'b-1', person_id: 'p-1', rolle_id: 'r-1' }])
    )
    // personen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'p-1', vorname: 'Max', nachname: 'Muster' }])
    )
    // serien
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 's-1', name: 'Serie 1' }])
    )
    // serienauffuehrungen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([
        {
          id: 'sa-1',
          serie_id: 's-1',
          veranstaltung_id: 'v-1',
          datum: '2026-06-15',
        },
      ])
    )
    // veranstaltungen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'v-1', titel: 'Premiere', datum: '2026-06-15' }])
    )
    // zeitbloecke
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([
        {
          id: 'zb-1',
          veranstaltung_id: 'v-1',
          name: 'Vorführung',
          startzeit: '2026-06-15T19:00:00+02:00',
          endzeit: '2026-06-15T21:00:00+02:00',
          typ: 'vorfuehrung',
        },
      ])
    )
    // schichten
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([
        {
          id: 'sch-1',
          veranstaltung_id: 'v-1',
          zeitblock_id: 'zb-1',
          rolle: 'Darsteller',
        },
      ])
    )
    // existing zuweisungen - none
    mockSupabase.from.mockReturnValueOnce(chainResolving([]))

    const result = await generateZuweisungenPreview('prod-1')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.vorschlaege).toHaveLength(1)
      expect(result.data.vorschlaege[0].person_id).toBe('p-1')
      expect(result.data.vorschlaege[0].person_name).toBe('Max Muster')
      expect(result.data.vorschlaege[0].schicht_id).toBe('sch-1')
      expect(result.data.vorschlaege[0].schicht_rolle).toBe('Darsteller')
      expect(result.data.vorschlaege[0].bereits_vorhanden).toBe(false)
      expect(result.data.stats.total_besetzt).toBe(1)
      expect(result.data.stats.total_auffuehrungen).toBe(1)
      expect(result.data.stats.total_vorschlaege).toBe(1)
    }
  })

  it('marks bereits_vorhanden correctly', async () => {
    // besetzungen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'b-1', person_id: 'p-1', rolle_id: 'r-1' }])
    )
    // personen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'p-1', vorname: 'Max', nachname: 'Muster' }])
    )
    // serien
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 's-1', name: 'Serie 1' }])
    )
    // serienauffuehrungen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([
        {
          id: 'sa-1',
          serie_id: 's-1',
          veranstaltung_id: 'v-1',
          datum: '2026-06-15',
        },
      ])
    )
    // veranstaltungen
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ id: 'v-1', titel: 'Premiere', datum: '2026-06-15' }])
    )
    // zeitbloecke
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([
        {
          id: 'zb-1',
          veranstaltung_id: 'v-1',
          name: 'Vorführung',
          startzeit: '2026-06-15T19:00:00+02:00',
          endzeit: '2026-06-15T21:00:00+02:00',
          typ: 'vorfuehrung',
        },
      ])
    )
    // schichten
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([
        {
          id: 'sch-1',
          veranstaltung_id: 'v-1',
          zeitblock_id: 'zb-1',
          rolle: 'Darsteller',
        },
      ])
    )
    // existing zuweisungen - already has one
    mockSupabase.from.mockReturnValueOnce(
      chainResolving([{ schicht_id: 'sch-1', person_id: 'p-1' }])
    )

    const result = await generateZuweisungenPreview('prod-1')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.vorschlaege[0].bereits_vorhanden).toBe(true)
      expect(result.data.stats.total_bereits_vorhanden).toBe(1)
    }
  })

  it('rejects when permission is missing', async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error('Unauthorized'))

    await expect(generateZuweisungenPreview('prod-1')).rejects.toThrow(
      'Unauthorized'
    )

    expect(mockRequirePermission).toHaveBeenCalledWith('produktionen:write')
  })
})

describe('confirmZuweisungen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequirePermission.mockResolvedValue({
      id: 'user-1',
      display_name: 'Test User',
      role: 'ADMIN',
    })
  })

  it('inserts zuweisungen with correct status', async () => {
    mockSupabase.from.mockReturnValueOnce({
      upsert: vi.fn().mockResolvedValue(chainUpsert(2)),
    })

    const result = await confirmZuweisungen(
      'prod-1',
      [
        { schicht_id: 'sch-1', person_id: 'p-1' },
        { schicht_id: 'sch-2', person_id: 'p-1' },
      ],
      'vorgeschlagen'
    )

    expect(result.success).toBe(true)
    expect(result.count).toBe(2)
  })

  it('inserts with zugesagt status when specified', async () => {
    const mockUpsert = vi.fn().mockResolvedValue(chainUpsert(1))
    mockSupabase.from.mockReturnValueOnce({ upsert: mockUpsert })

    const result = await confirmZuweisungen(
      'prod-1',
      [{ schicht_id: 'sch-1', person_id: 'p-1' }],
      'zugesagt'
    )

    expect(result.success).toBe(true)
    expect(mockUpsert).toHaveBeenCalledWith(
      [
        {
          schicht_id: 'sch-1',
          person_id: 'p-1',
          status: 'zugesagt',
          notizen: 'Auto-generiert aus Besetzung von Test User',
        },
      ],
      expect.objectContaining({ ignoreDuplicates: true })
    )
  })

  it('returns error for empty proposals', async () => {
    const result = await confirmZuweisungen('prod-1', [])

    expect(result.success).toBe(false)
    expect(result.error).toBe('Keine Vorschläge ausgewählt')
  })

  it('returns count on success', async () => {
    mockSupabase.from.mockReturnValueOnce({
      upsert: vi.fn().mockResolvedValue(chainUpsert(3)),
    })

    const result = await confirmZuweisungen('prod-1', [
      { schicht_id: 'sch-1', person_id: 'p-1' },
      { schicht_id: 'sch-2', person_id: 'p-1' },
      { schicht_id: 'sch-3', person_id: 'p-1' },
    ])

    expect(result.success).toBe(true)
    expect(result.count).toBe(3)
  })
})
