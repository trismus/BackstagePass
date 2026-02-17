/**
 * Unit Tests for Proben-Teilnehmer Suggestion (Issue #345)
 * Tests for suggestProbenTeilnehmer and confirmProbenTeilnehmer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockClient,
  mockVorstandProfile,
  mockProfile,
} from '@/tests/mocks/supabase'

// Mock the Supabase client
const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getUserProfile: vi.fn(() => Promise.resolve(mockVorstandProfile)),
}))

vi.mock('./conflict-check', () => ({
  checkPersonConflicts: vi.fn().mockResolvedValue({
    has_conflicts: false,
    conflicts: [],
  }),
}))

// Import after mocking
import { suggestProbenTeilnehmer, confirmProbenTeilnehmer } from './proben'
import { checkPersonConflicts } from './conflict-check'

describe('Proben-Teilnehmer Suggestion (Issue #345)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =============================================================================
  // suggestProbenTeilnehmer
  // =============================================================================

  describe('suggestProbenTeilnehmer', () => {
    it('rejects without management permission', async () => {
      const { getUserProfile } = await import('@/lib/supabase/server')
      vi.mocked(getUserProfile).mockResolvedValueOnce(mockProfile)

      const result = await suggestProbenTeilnehmer('probe-1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Keine Berechtigung')
    })

    it('returns error when probe not found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      })

      const result = await suggestProbenTeilnehmer('nonexistent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Probe nicht gefunden.')
    })

    it('suggests from szenen when scenes are assigned', async () => {
      const fromMock = vi.fn()

      // 1. proben - load probe
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'probe-1', stueck_id: 'stueck-1', datum: '2026-03-15', startzeit: '19:00:00', endzeit: '22:00:00' },
          error: null,
        }),
      })

      // 2. proben_szenen - has scenes
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ szene_id: 'szene-1' }], error: null })
          return Promise.resolve({ data: [{ szene_id: 'szene-1' }], error: null })
        },
      })

      // 3. szenen_rollen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ rolle_id: 'rolle-1' }], error: null })
          return Promise.resolve({ data: [{ rolle_id: 'rolle-1' }], error: null })
        },
      })

      // 4. besetzungen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ person_id: 'person-1', rolle_id: 'rolle-1' }], error: null })
          return Promise.resolve({ data: [{ person_id: 'person-1', rolle_id: 'rolle-1' }], error: null })
        },
      })

      // 5. personen (names)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ id: 'person-1', vorname: 'Max', nachname: 'Mustermann' }], error: null })
          return Promise.resolve({ data: [{ id: 'person-1', vorname: 'Max', nachname: 'Mustermann' }], error: null })
        },
      })

      // 6. rollen (names)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ id: 'rolle-1', name: 'Hamlet' }], error: null })
          return Promise.resolve({ data: [{ id: 'rolle-1', name: 'Hamlet' }], error: null })
        },
      })

      // 7. proben_teilnehmer (existing)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [], error: null })
          return Promise.resolve({ data: [], error: null })
        },
      })

      mockSupabase.from = fromMock

      const result = await suggestProbenTeilnehmer('probe-1')
      expect(result.success).toBe(true)
      expect(result.data?.quelle).toBe('szenen')
      expect(result.data?.vorschlaege).toHaveLength(1)
      expect(result.data?.vorschlaege[0].person_name).toBe('Max Mustermann')
      expect(result.data?.vorschlaege[0].rollen).toEqual(['Hamlet'])
      expect(result.data?.vorschlaege[0].bereits_vorhanden).toBe(false)
    })

    it('falls back to all cast when no scenes assigned', async () => {
      const fromMock = vi.fn()

      // 1. proben - load probe
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'probe-1', stueck_id: 'stueck-1', datum: '2026-03-15', startzeit: '19:00:00', endzeit: '22:00:00' },
          error: null,
        }),
      })

      // 2. proben_szenen - empty (no scenes)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [], error: null })
          return Promise.resolve({ data: [], error: null })
        },
      })

      // 3. rollen (all for stueck - fallback)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ id: 'rolle-1' }, { id: 'rolle-2' }], error: null })
          return Promise.resolve({ data: [{ id: 'rolle-1' }, { id: 'rolle-2' }], error: null })
        },
      })

      // 4. besetzungen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [
            { person_id: 'person-1', rolle_id: 'rolle-1' },
            { person_id: 'person-2', rolle_id: 'rolle-2' },
          ], error: null })
          return Promise.resolve({ data: [
            { person_id: 'person-1', rolle_id: 'rolle-1' },
            { person_id: 'person-2', rolle_id: 'rolle-2' },
          ], error: null })
        },
      })

      // 5. personen (names)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [
            { id: 'person-1', vorname: 'Max', nachname: 'Mustermann' },
            { id: 'person-2', vorname: 'Anna', nachname: 'Schmidt' },
          ], error: null })
          return Promise.resolve({ data: [
            { id: 'person-1', vorname: 'Max', nachname: 'Mustermann' },
            { id: 'person-2', vorname: 'Anna', nachname: 'Schmidt' },
          ], error: null })
        },
      })

      // 6. rollen (names)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ id: 'rolle-1', name: 'Hamlet' }, { id: 'rolle-2', name: 'Ophelia' }], error: null })
          return Promise.resolve({ data: [{ id: 'rolle-1', name: 'Hamlet' }, { id: 'rolle-2', name: 'Ophelia' }], error: null })
        },
      })

      // 7. proben_teilnehmer (existing)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [], error: null })
          return Promise.resolve({ data: [], error: null })
        },
      })

      mockSupabase.from = fromMock

      const result = await suggestProbenTeilnehmer('probe-1')
      expect(result.success).toBe(true)
      expect(result.data?.quelle).toBe('alle_besetzungen')
      expect(result.data?.vorschlaege).toHaveLength(2)
      expect(result.data?.stats.total_vorgeschlagen).toBe(2)
    })

    it('marks already existing teilnehmer correctly', async () => {
      const fromMock = vi.fn()

      // 1. proben
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'probe-1', stueck_id: 'stueck-1', datum: '2026-03-15', startzeit: null, endzeit: null },
          error: null,
        }),
      })

      // 2. proben_szenen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ szene_id: 'szene-1' }], error: null })
          return Promise.resolve({ data: [{ szene_id: 'szene-1' }], error: null })
        },
      })

      // 3. szenen_rollen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ rolle_id: 'rolle-1' }], error: null })
          return Promise.resolve({ data: [{ rolle_id: 'rolle-1' }], error: null })
        },
      })

      // 4. besetzungen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ person_id: 'person-1', rolle_id: 'rolle-1' }], error: null })
          return Promise.resolve({ data: [{ person_id: 'person-1', rolle_id: 'rolle-1' }], error: null })
        },
      })

      // 5. personen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ id: 'person-1', vorname: 'Max', nachname: 'Mustermann' }], error: null })
          return Promise.resolve({ data: [{ id: 'person-1', vorname: 'Max', nachname: 'Mustermann' }], error: null })
        },
      })

      // 6. rollen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ id: 'rolle-1', name: 'Hamlet' }], error: null })
          return Promise.resolve({ data: [{ id: 'rolle-1', name: 'Hamlet' }], error: null })
        },
      })

      // 7. proben_teilnehmer - person-1 already exists
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ person_id: 'person-1' }], error: null })
          return Promise.resolve({ data: [{ person_id: 'person-1' }], error: null })
        },
      })

      mockSupabase.from = fromMock

      const result = await suggestProbenTeilnehmer('probe-1')
      expect(result.success).toBe(true)
      expect(result.data?.vorschlaege[0].bereits_vorhanden).toBe(true)
      expect(result.data?.stats.total_bereits_vorhanden).toBe(1)
      expect(result.data?.stats.total_vorgeschlagen).toBe(0)
    })

    it('includes conflicts per person when time info available', async () => {
      vi.mocked(checkPersonConflicts).mockResolvedValueOnce({
        has_conflicts: true,
        conflicts: [{
          type: 'probe',
          description: 'Andere Probe',
          start_time: '2026-03-15T19:00:00',
          end_time: '2026-03-15T21:00:00',
          reference_id: 'probe-2',
        }],
      })

      const fromMock = vi.fn()

      // 1. proben
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'probe-1', stueck_id: 'stueck-1', datum: '2026-03-15', startzeit: '19:00:00', endzeit: '22:00:00' },
          error: null,
        }),
      })

      // 2. proben_szenen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ szene_id: 'szene-1' }], error: null })
          return Promise.resolve({ data: [{ szene_id: 'szene-1' }], error: null })
        },
      })

      // 3. szenen_rollen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ rolle_id: 'rolle-1' }], error: null })
          return Promise.resolve({ data: [{ rolle_id: 'rolle-1' }], error: null })
        },
      })

      // 4. besetzungen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ person_id: 'person-1', rolle_id: 'rolle-1' }], error: null })
          return Promise.resolve({ data: [{ person_id: 'person-1', rolle_id: 'rolle-1' }], error: null })
        },
      })

      // 5. personen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ id: 'person-1', vorname: 'Max', nachname: 'Mustermann' }], error: null })
          return Promise.resolve({ data: [{ id: 'person-1', vorname: 'Max', nachname: 'Mustermann' }], error: null })
        },
      })

      // 6. rollen
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [{ id: 'rolle-1', name: 'Hamlet' }], error: null })
          return Promise.resolve({ data: [{ id: 'rolle-1', name: 'Hamlet' }], error: null })
        },
      })

      // 7. proben_teilnehmer
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [], error: null })
          return Promise.resolve({ data: [], error: null })
        },
      })

      mockSupabase.from = fromMock

      const result = await suggestProbenTeilnehmer('probe-1')
      expect(result.success).toBe(true)
      expect(result.data?.vorschlaege[0].konflikte).toHaveLength(1)
      expect(result.data?.vorschlaege[0].konflikte[0].type).toBe('probe')
      expect(result.data?.stats.total_mit_konflikten).toBe(1)
    })
  })

  // =============================================================================
  // confirmProbenTeilnehmer
  // =============================================================================

  describe('confirmProbenTeilnehmer', () => {
    it('rejects without management permission', async () => {
      const { getUserProfile } = await import('@/lib/supabase/server')
      vi.mocked(getUserProfile).mockResolvedValueOnce(mockProfile)

      const result = await confirmProbenTeilnehmer('probe-1', ['person-1'])
      expect(result.success).toBe(false)
      expect(result.error).toContain('Keine Berechtigung')
    })

    it('rejects empty selection', async () => {
      const result = await confirmProbenTeilnehmer('probe-1', [])
      expect(result.success).toBe(false)
      expect(result.error).toBe('Keine Teilnehmer ausgewählt.')
    })

    it('inserts teilnehmer with status eingeladen', async () => {
      mockSupabase.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await confirmProbenTeilnehmer('probe-1', ['person-1', 'person-2'])
      expect(result.success).toBe(true)
      expect(result.count).toBe(2)
      expect(mockSupabase.from).toHaveBeenCalledWith('proben_teilnehmer')
    })

    it('returns error on database failure', async () => {
      mockSupabase.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      })

      const result = await confirmProbenTeilnehmer('probe-1', ['person-1'])
      expect(result.success).toBe(false)
      expect(result.error).toBe('DB error')
    })
  })
})
