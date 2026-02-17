/**
 * Unit Tests for Probenplan-Generator Status Filtering (Issues #361-365)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockClient,
  mockVorstandProfile,
  mockProfile,
} from '@/tests/mocks/supabase'
import {
  STUECK_STATUS_LABELS,
  PROBENPLAN_ELIGIBLE_STATUS,
  type StueckStatus,
} from '@/lib/supabase/types'

// Mock the Supabase client
const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getUserProfile: vi.fn(() => Promise.resolve(mockVorstandProfile)),
}))

// Import after mocking
import {
  getStueckeMitSzenen,
  previewGeneratedProben,
  generateProben,
  createProbenplanTemplate,
  deleteProbenplanTemplate,
} from './probenplan'
import { getUserProfile } from '@/lib/supabase/server'

// Valid UUID for test data (custom uuid() regex accepts this format)
const STUECK_UUID = 'a0000000-0000-0000-0000-000000000001'

describe('Probenplan-Generator Status Filtering (Issues #361-365)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset getUserProfile to return Vorstand by default
    vi.mocked(getUserProfile).mockResolvedValue(mockVorstandProfile)
  })

  // ===========================================================================
  // Constants Tests (#361)
  // ===========================================================================

  describe('PROBENPLAN_ELIGIBLE_STATUS', () => {
    it('includes in_planung, in_proben, and aktiv', () => {
      expect(PROBENPLAN_ELIGIBLE_STATUS).toContain('in_planung')
      expect(PROBENPLAN_ELIGIBLE_STATUS).toContain('in_proben')
      expect(PROBENPLAN_ELIGIBLE_STATUS).toContain('aktiv')
    })

    it('does not include abgeschlossen or archiviert', () => {
      expect(PROBENPLAN_ELIGIBLE_STATUS).not.toContain('abgeschlossen')
      expect(PROBENPLAN_ELIGIBLE_STATUS).not.toContain('archiviert')
    })
  })

  describe('STUECK_STATUS_LABELS', () => {
    it('covers all StueckStatus values (5 keys)', () => {
      const allStatuses: StueckStatus[] = [
        'in_planung',
        'in_proben',
        'aktiv',
        'abgeschlossen',
        'archiviert',
      ]
      expect(Object.keys(STUECK_STATUS_LABELS)).toHaveLength(5)
      for (const status of allStatuses) {
        expect(STUECK_STATUS_LABELS[status]).toBeDefined()
        expect(typeof STUECK_STATUS_LABELS[status]).toBe('string')
      }
    })
  })

  // ===========================================================================
  // getStueckeMitSzenen (#362, #365)
  // ===========================================================================

  describe('getStueckeMitSzenen', () => {
    it('calls .in() with PROBENPLAN_ELIGIBLE_STATUS values', async () => {
      const mockIn = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnValue(
        Promise.resolve({ data: [], error: null })
      )

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: mockIn.mockReturnValue({
            order: mockOrder,
          }),
        }),
      })

      await getStueckeMitSzenen()

      expect(mockSupabase.from).toHaveBeenCalledWith('stuecke')
      expect(mockIn).toHaveBeenCalledWith(
        'status',
        expect.arrayContaining(['in_planung', 'in_proben', 'aktiv'])
      )
    })
  })

  // ===========================================================================
  // previewGeneratedProben (#364)
  // ===========================================================================

  describe('previewGeneratedProben', () => {
    it('returns error for non-management role', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile)

      const result = await previewGeneratedProben({
        stueck_id: STUECK_UUID,
        titel_prefix: 'Probe',
        wiederholung_typ: 'woechentlich',
        wochentag: 1,
        startzeit: '19:00',
        endzeit: '22:00',
        start_datum: '2026-03-01',
        end_datum: '2026-03-31',
        auto_einladen: false,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('returns generated proben for valid input', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      const result = await previewGeneratedProben({
        stueck_id: STUECK_UUID,
        titel_prefix: 'Probe',
        wiederholung_typ: 'woechentlich',
        wochentag: 1, // Monday
        startzeit: '19:00',
        endzeit: '22:00',
        start_datum: '2026-03-02', // Monday
        end_datum: '2026-03-16', // Two Mondays
        auto_einladen: false,
      })

      expect(result.success).toBe(true)
      expect(result.proben).toBeDefined()
      expect(result.proben!.length).toBeGreaterThanOrEqual(2)
      expect(result.proben![0].titel).toBe('Probe 1')
    })
  })

  // ===========================================================================
  // generateProben (#364)
  // ===========================================================================

  describe('generateProben', () => {
    it('creates proben and returns count', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'probe-new-1' },
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'probe-new-1' },
          error: null,
        }),
      })

      const result = await generateProben({
        stueck_id: STUECK_UUID,
        titel_prefix: 'Probe',
        wiederholung_typ: 'woechentlich',
        wochentag: 1,
        startzeit: '19:00',
        endzeit: '22:00',
        start_datum: '2026-03-02',
        end_datum: '2026-03-09',
        auto_einladen: false,
      })

      expect(result.success).toBe(true)
      expect(result.created_count).toBeGreaterThanOrEqual(1)
    })

    it('returns error for empty date range', async () => {
      const result = await generateProben({
        stueck_id: STUECK_UUID,
        titel_prefix: 'Probe',
        wiederholung_typ: 'woechentlich',
        wochentag: 1, // Monday
        startzeit: '19:00',
        endzeit: '22:00',
        start_datum: '2026-03-03', // Tuesday
        end_datum: '2026-03-03', // Same day, no Monday in range
        auto_einladen: false,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // ===========================================================================
  // Template CRUD Permission (#364)
  // ===========================================================================

  describe('createProbenplanTemplate', () => {
    it('returns error for non-management role', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile)

      const result = await createProbenplanTemplate({
        stueck_id: STUECK_UUID,
        name: 'Test Template',
        wiederholung_typ: 'woechentlich',
        wochentag: 1,
        startzeit: '19:00',
        endzeit: '22:00',
        dauer_wochen: 4,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Keine Berechtigung')
    })
  })

  describe('deleteProbenplanTemplate', () => {
    it('returns error for non-management role', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile)

      const result = await deleteProbenplanTemplate('template-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Keine Berechtigung')
    })
  })
})
