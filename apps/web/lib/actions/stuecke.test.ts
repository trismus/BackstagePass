/**
 * Unit Tests for Stuecke Server Actions (Issue #113)
 * Tests for Künstlerische Planung - Stücke, Szenen, Rollen
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockClient,
  mockStueck,
  mockSzene,
  mockStueckRolle,
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
  getStuecke,
  getStueck,
  createStueck,
  updateStueck,
  deleteStueck,
  getSzenen,
  createSzene,
  updateSzene,
  deleteSzene,
  getRollen,
  createRolle,
  updateRolle,
  deleteRolle,
  downloadStueck,
  downloadSzene,
} from './stuecke'

describe('Stuecke Actions (Issue #101)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =============================================================================
  // Stücke CRUD
  // =============================================================================

  describe('getStuecke', () => {
    it('returns all Stücke', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockStueck], error: null }),
      })

      const result = await getStuecke()
      expect(result).toHaveLength(1)
      expect(result[0].titel).toBe('Hamlet')
    })

    it('returns empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      })

      const result = await getStuecke()
      expect(result).toEqual([])
    })
  })

  describe('getStueck', () => {
    it('returns a single Stück by ID', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockStueck, error: null }),
      })

      const result = await getStueck('stueck-1')
      expect(result).not.toBeNull()
      expect(result?.titel).toBe('Hamlet')
    })

    it('returns null when not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      })

      const result = await getStueck('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('createStueck', () => {
    it('creates a new Stück with VORSTAND permission', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-stueck-1' }, error: null }),
      })

      const result = await createStueck({
        titel: 'Romeo und Julia',
        beschreibung: 'Eine Liebesgeschichte',
        autor: 'William Shakespeare',
        status: 'in_planung',
        premiere_datum: null,
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('new-stueck-1')
    })

    it('rejects creation without permission', async () => {
      const { getUserProfile } = await import('@/lib/supabase/server')
      vi.mocked(getUserProfile).mockResolvedValueOnce(mockProfile)

      const result = await createStueck({
        titel: 'Unauthorized Stück',
        beschreibung: null,
        autor: null,
        status: 'in_planung',
        premiere_datum: null,
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

      const result = await createStueck({
        titel: 'Test',
        beschreibung: null,
        autor: null,
        status: 'in_planung',
        premiere_datum: null,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('DB Error')
    })
  })

  describe('updateStueck', () => {
    it('updates a Stück', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await updateStueck('stueck-1', { titel: 'Hamlet - Überarbeitet' })

      expect(result.success).toBe(true)
    })

    it('returns error on failure', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      })

      const result = await updateStueck('stueck-1', { titel: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('deleteStueck', () => {
    it('deletes a Stück with admin permission', async () => {
      const { getUserProfile } = await import('@/lib/supabase/server')
      vi.mocked(getUserProfile).mockResolvedValueOnce({
        ...mockVorstandProfile,
        role: 'ADMIN',
      })

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await deleteStueck('stueck-1')

      expect(result.success).toBe(true)
    })
  })

  // =============================================================================
  // Szenen CRUD
  // =============================================================================

  describe('getSzenen', () => {
    it('returns all Szenen for a Stück', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockSzene], error: null }),
      })

      const result = await getSzenen('stueck-1')
      expect(result).toHaveLength(1)
      expect(result[0].titel).toBe('Akt 1, Szene 1')
    })
  })

  describe('createSzene', () => {
    it('creates a new Szene', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-szene-1' }, error: null }),
      })

      const result = await createSzene({
        stueck_id: 'stueck-1',
        nummer: 2,
        titel: 'Akt 1, Szene 2',
        beschreibung: null,
        text: null,
        dauer_minuten: 15,
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('new-szene-1')
    })
  })

  describe('updateSzene', () => {
    it('updates a Szene', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get szene for stueck_id
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSzene, error: null }),
        })
        // Update
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })

      mockSupabase.from = fromMock

      const result = await updateSzene('szene-1', { titel: 'Neuer Titel' })

      expect(result.success).toBe(true)
    })
  })

  describe('deleteSzene', () => {
    it('deletes a Szene', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get szene for stueck_id
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSzene, error: null }),
        })
        // Delete
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })

      mockSupabase.from = fromMock

      const result = await deleteSzene('szene-1')

      expect(result.success).toBe(true)
    })
  })

  // =============================================================================
  // Rollen CRUD
  // =============================================================================

  describe('getRollen', () => {
    it('returns all Rollen for a Stück', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (result: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [mockStueckRolle], error: null })
        },
      })

      const result = await getRollen('stueck-1')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Hamlet')
    })
  })

  describe('createRolle', () => {
    it('creates a new Rolle', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-rolle-1' }, error: null }),
      })

      const result = await createRolle({
        stueck_id: 'stueck-1',
        name: 'Ophelia',
        beschreibung: 'Hamlet\'s Geliebte',
        typ: 'hauptrolle',
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('new-rolle-1')
    })
  })

  describe('updateRolle', () => {
    it('updates a Rolle', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get rolle for stueck_id
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockStueckRolle, error: null }),
        })
        // Update
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })

      mockSupabase.from = fromMock

      const result = await updateRolle('rolle-1', { beschreibung: 'Neue Beschreibung' })

      expect(result.success).toBe(true)
    })
  })

  describe('deleteRolle', () => {
    it('deletes a Rolle', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get rolle for stueck_id
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockStueckRolle, error: null }),
        })
        // Delete
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })

      mockSupabase.from = fromMock

      const result = await deleteRolle('rolle-1')

      expect(result.success).toBe(true)
    })
  })

  // =============================================================================
  // Downloads (Issue #193)
  // =============================================================================

  describe('downloadStueck', () => {
    it('generates text content for complete Stück', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get stueck
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockStueck, error: null }),
        })
        // Get szenen
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [mockSzene], error: null }),
        })

      mockSupabase.from = fromMock

      const result = await downloadStueck('stueck-1')

      expect(result.success).toBe(true)
      expect(result.content).toContain('Hamlet')
      expect(result.content).toContain('William Shakespeare')
      expect(result.content).toContain('Akt 1, Szene 1')
      expect(result.filename).toContain('Hamlet')
    })

    it('returns error when Stück not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      })

      const result = await downloadStueck('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Stück nicht gefunden')
    })
  })

  describe('downloadSzene', () => {
    it('generates text content for single Szene', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get szene
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSzene, error: null }),
        })
        // Get stueck
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockStueck, error: null }),
        })

      mockSupabase.from = fromMock

      const result = await downloadSzene('szene-1')

      expect(result.success).toBe(true)
      expect(result.content).toContain('Hamlet')
      expect(result.content).toContain('Akt 1, Szene 1')
      expect(result.content).toContain('Wer da?')
      expect(result.filename).toContain('Szene_1')
    })
  })
})
