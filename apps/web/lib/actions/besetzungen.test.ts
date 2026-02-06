/**
 * Unit Tests for Besetzungen Server Actions (Issue #113)
 * Tests for Künstlerische Planung - Besetzungen
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockClient,
  mockBesetzung,
  mockStueckRolle,
  mockPerson,
  mockVorstandProfile,
  mockProfile,
} from '@/tests/mocks/supabase'

// Mock the Supabase client
const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getUserProfile: vi.fn(() => Promise.resolve(mockVorstandProfile)),
}))

// Import after mocking
import {
  getBesetzungenForStueck,
  getBesetzungenForRolle,
  getRollenMitBesetzungen,
  getBesetzungenForPerson,
  getBesetzung,
  createBesetzung,
  updateBesetzung,
  deleteBesetzung,
} from './besetzungen'

describe('Besetzungen Actions (Issue #102)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =============================================================================
  // Query Operations
  // =============================================================================

  describe('getBesetzungenForStueck', () => {
    it('returns all Besetzungen for a Stück', async () => {
      const besetzungMitDetails = {
        ...mockBesetzung,
        person: mockPerson,
        rolle: {
          ...mockStueckRolle,
          stueck: { id: 'stueck-1', titel: 'Hamlet' },
        },
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [besetzungMitDetails], error: null }),
      })

      const result = await getBesetzungenForStueck('stueck-1')
      expect(result).toHaveLength(1)
      expect(result[0].rolle.name).toBe('Hamlet')
    })

    it('returns empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      })

      const result = await getBesetzungenForStueck('stueck-1')
      expect(result).toEqual([])
    })
  })

  describe('getBesetzungenForRolle', () => {
    it('returns all Besetzungen for a Rolle', async () => {
      const besetzungMitPerson = {
        ...mockBesetzung,
        person: mockPerson,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [besetzungMitPerson], error: null }),
      })

      const result = await getBesetzungenForRolle('rolle-1')
      expect(result).toHaveLength(1)
      expect(result[0].person.vorname).toBe('Max')
    })
  })

  describe('getRollenMitBesetzungen', () => {
    it('returns Rollen with their Besetzungen', async () => {
      const rolleMitBesetzungen = {
        ...mockStueckRolle,
        besetzungen: [
          {
            ...mockBesetzung,
            person: { id: 'person-1', vorname: 'Max', nachname: 'Mustermann' },
          },
        ],
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (result: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [rolleMitBesetzungen], error: null })
        },
      })

      const result = await getRollenMitBesetzungen('stueck-1')
      expect(result).toHaveLength(1)
      expect(result[0].besetzungen).toHaveLength(1)
    })
  })

  describe('getBesetzungenForPerson', () => {
    it('returns all Besetzungen for a Person', async () => {
      const besetzungMitRolle = {
        ...mockBesetzung,
        rolle: {
          id: 'rolle-1',
          name: 'Hamlet',
          typ: 'hauptrolle',
          stueck: { id: 'stueck-1', titel: 'Hamlet' },
        },
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [besetzungMitRolle], error: null }),
      })

      const result = await getBesetzungenForPerson('person-1')
      expect(result).toHaveLength(1)
    })
  })

  describe('getBesetzung', () => {
    it('returns a single Besetzung by ID', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBesetzung, error: null }),
      })

      const result = await getBesetzung('besetzung-1')
      expect(result).not.toBeNull()
      expect(result?.typ).toBe('hauptbesetzung')
    })

    it('returns null when not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      })

      const result = await getBesetzung('non-existent')
      expect(result).toBeNull()
    })
  })

  // =============================================================================
  // CRUD Operations
  // =============================================================================

  describe('createBesetzung', () => {
    it('creates a new Besetzung with VORSTAND permission', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-besetzung-1', rolle: { stueck_id: 'stueck-1' } },
          error: null,
        }),
      })

      const result = await createBesetzung({
        rolle_id: 'rolle-1',
        person_id: 'person-1',
        typ: 'hauptbesetzung',
        gueltig_von: '2026-01-01',
        gueltig_bis: null,
        notizen: null,
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('new-besetzung-1')
    })

    it('rejects creation without permission', async () => {
      const { getUserProfile } = await import('@/lib/supabase/server')
      vi.mocked(getUserProfile).mockResolvedValueOnce(mockProfile)

      const result = await createBesetzung({
        rolle_id: 'rolle-1',
        person_id: 'person-1',
        typ: 'hauptbesetzung',
        gueltig_von: null,
        gueltig_bis: null,
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

      const result = await createBesetzung({
        rolle_id: 'rolle-1',
        person_id: 'person-1',
        typ: 'hauptbesetzung',
        gueltig_von: null,
        gueltig_bis: null,
        notizen: null,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('DB Error')
    })
  })

  describe('updateBesetzung', () => {
    it('updates a Besetzung', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get besetzung
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBesetzung, error: null }),
        })
        // Update
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })
        // Get rolle for stueck_id
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { stueck_id: 'stueck-1' }, error: null }),
        })

      mockSupabase.from = fromMock

      const result = await updateBesetzung('besetzung-1', { typ: 'zweitbesetzung' })

      expect(result.success).toBe(true)
    })

    it('returns error on failure', async () => {
      const fromMock = vi.fn()
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBesetzung, error: null }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
        })

      mockSupabase.from = fromMock

      const result = await updateBesetzung('besetzung-1', { typ: 'zweitbesetzung' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('deleteBesetzung', () => {
    it('deletes a Besetzung', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get besetzung with rolle
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { rolle: { stueck_id: 'stueck-1' } },
            error: null,
          }),
        })
        // Delete
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })

      mockSupabase.from = fromMock

      const result = await deleteBesetzung('besetzung-1')

      expect(result.success).toBe(true)
    })

    it('returns error on failure', async () => {
      const fromMock = vi.fn()
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { rolle: { stueck_id: 'stueck-1' } },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        })

      mockSupabase.from = fromMock

      const result = await deleteBesetzung('besetzung-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
    })
  })
})
