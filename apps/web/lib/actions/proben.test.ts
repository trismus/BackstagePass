/**
 * Unit Tests for Proben Server Actions (Issue #113)
 * Tests for Künstlerische Planung - Proben
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockClient,
  mockProbe,
  mockSzene,
  mockVorstandProfile,
  mockProfile,
  mockPerson,
} from '@/tests/mocks/supabase'

// Mock the Supabase client
const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getUserProfile: vi.fn(() => Promise.resolve(mockVorstandProfile)),
}))

// Import after mocking
import {
  getProbenForStueck,
  getProbe,
  createProbe,
  updateProbe,
  deleteProbe,
  addSzeneToProbe,
  removeSzeneFromProbe,
  updateTeilnehmerStatus,
} from './proben'

describe('Proben Actions (Issue #103)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =============================================================================
  // Proben CRUD
  // =============================================================================

  describe('getProbenForStueck', () => {
    it('returns all Proben for a Stück', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (result: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [mockProbe], error: null })
        },
      })

      const result = await getProbenForStueck('stueck-1')
      expect(result).toHaveLength(1)
      expect(result[0].titel).toBe('Durchlaufprobe Akt 1')
    })

    it('returns empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (result: { data: null; error: { message: string } }) => void) => {
          resolve({ data: null, error: { message: 'Error' } })
        },
      })

      const result = await getProbenForStueck('stueck-1')
      expect(result).toEqual([])
    })
  })

  describe('getProbe', () => {
    it('returns a single Probe with details', async () => {
      const probeWithDetails = {
        ...mockProbe,
        stueck: { id: 'stueck-1', titel: 'Hamlet' },
        szenen: [],
        teilnehmer: [],
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: probeWithDetails, error: null }),
      })

      const result = await getProbe('probe-1')
      expect(result).not.toBeNull()
      expect(result?.titel).toBe('Durchlaufprobe Akt 1')
    })

    it('returns null when not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      })

      const result = await getProbe('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('createProbe', () => {
    it('creates a new Probe with VORSTAND permission', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-probe-1' }, error: null }),
      })

      const result = await createProbe({
        stueck_id: 'stueck-1',
        titel: 'Neue Probe',
        beschreibung: null,
        datum: '2026-04-01',
        startzeit: '19:00:00',
        endzeit: '22:00:00',
        ort: 'Proberaum',
        status: 'geplant',
        notizen: null,
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('new-probe-1')
    })

    it('rejects creation without permission', async () => {
      const { getUserProfile } = await import('@/lib/supabase/server')
      vi.mocked(getUserProfile).mockResolvedValueOnce(mockProfile)

      const result = await createProbe({
        stueck_id: 'stueck-1',
        titel: 'Unauthorized Probe',
        beschreibung: null,
        datum: '2026-04-01',
        startzeit: null,
        endzeit: null,
        ort: null,
        status: 'geplant',
        notizen: null,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Keine Berechtigung')
    })

    it('returns error on database failure', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
      })

      const result = await createProbe({
        stueck_id: 'stueck-1',
        titel: 'Test',
        beschreibung: null,
        datum: '2026-04-01',
        startzeit: null,
        endzeit: null,
        ort: null,
        status: 'geplant',
        notizen: null,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('DB Error')
    })
  })

  describe('updateProbe', () => {
    it('updates a Probe', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get probe for stueck_id
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProbe, error: null }),
        })
        // Update
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })

      mockSupabase.from = fromMock

      const result = await updateProbe('probe-1', { titel: 'Aktualisierte Probe' })

      expect(result.success).toBe(true)
    })

    it('returns error on failure', async () => {
      const fromMock = vi.fn()
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProbe, error: null }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
        })

      mockSupabase.from = fromMock

      const result = await updateProbe('probe-1', { titel: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('deleteProbe', () => {
    it('deletes a Probe', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get probe for stueck_id
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProbe, error: null }),
        })
        // Delete
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })

      mockSupabase.from = fromMock

      const result = await deleteProbe('probe-1')

      expect(result.success).toBe(true)
    })
  })

  // =============================================================================
  // Proben-Szenen
  // =============================================================================

  describe('addSzeneToProbe', () => {
    it('adds a Szene to a Probe', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await addSzeneToProbe({
        probe_id: 'probe-1',
        szene_id: 'szene-1',
        reihenfolge: 1,
        notizen: null,
      })

      expect(result.success).toBe(true)
    })

    it('returns error on failure', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
      })

      const result = await addSzeneToProbe({
        probe_id: 'probe-1',
        szene_id: 'szene-1',
        reihenfolge: 1,
        notizen: null,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Insert failed')
    })
  })

  describe('removeSzeneFromProbe', () => {
    it('removes a Szene from a Probe', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (result: { error: null }) => void) => {
          resolve({ error: null })
        },
      })

      const result = await removeSzeneFromProbe('probe-1', 'szene-1')

      expect(result.success).toBe(true)
    })
  })

  // =============================================================================
  // Teilnehmer Status
  // =============================================================================

  describe('updateTeilnehmerStatus', () => {
    it('updates status for own participation', async () => {
      // The function takes probeId, personId, status - RLS handles permission
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      })

      const result = await updateTeilnehmerStatus('probe-1', 'person-1', 'zugesagt')

      expect(result.success).toBe(true)
    })

    it('rejects when not logged in', async () => {
      const { getUserProfile } = await import('@/lib/supabase/server')
      vi.mocked(getUserProfile).mockResolvedValueOnce(null)

      const result = await updateTeilnehmerStatus('probe-1', 'person-1', 'zugesagt')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Nicht angemeldet')
    })

    it('returns error on database failure', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'RLS denied' } }),
          }),
        }),
      })

      const result = await updateTeilnehmerStatus('probe-1', 'person-1', 'zugesagt')

      expect(result.success).toBe(false)
      expect(result.error).toBe('RLS denied')
    })
  })
})
