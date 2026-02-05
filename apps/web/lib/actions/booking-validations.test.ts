/**
 * Unit Tests for Booking Validations
 * Issue #210
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockClient, mockProfile } from '@/tests/mocks/supabase'

// Mock the Supabase client
const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getUserProfile: vi.fn(() => Promise.resolve(mockProfile)),
}))

// Import after mocking
import {
  checkSlotAvailability,
  checkTimeConflict,
  checkBookingLimit,
  checkDeadline,
  validateRegistration,
  getBookingStatusForUser,
} from './booking-validations'

describe('Booking Validations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkSlotAvailability', () => {
    it('returns available when slots are free', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'schicht-1',
            anzahl_benoetigt: 3,
            zuweisungen: [
              { id: 'z1', status: 'zugesagt' },
              { id: 'z2', status: 'zugesagt' },
            ],
          },
          error: null,
        }),
      })

      const result = await checkSlotAvailability('schicht-1')

      expect(result.available).toBe(true)
      expect(result.current).toBe(2)
      expect(result.required).toBe(3)
    })

    it('returns unavailable when all slots are taken', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'schicht-1',
            anzahl_benoetigt: 2,
            zuweisungen: [
              { id: 'z1', status: 'zugesagt' },
              { id: 'z2', status: 'zugesagt' },
            ],
          },
          error: null,
        }),
      })

      const result = await checkSlotAvailability('schicht-1')

      expect(result.available).toBe(false)
      expect(result.reason).toBe('Alle Plaetze sind bereits belegt')
    })

    it('ignores cancelled zuweisungen', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'schicht-1',
            anzahl_benoetigt: 2,
            zuweisungen: [
              { id: 'z1', status: 'zugesagt' },
              { id: 'z2', status: 'abgesagt' },
            ],
          },
          error: null,
        }),
      })

      const result = await checkSlotAvailability('schicht-1')

      expect(result.available).toBe(true)
      expect(result.current).toBe(1)
    })

    it('returns error when schicht not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      })

      const result = await checkSlotAvailability('non-existent')

      expect(result.available).toBe(false)
      expect(result.reason).toBe('Schicht nicht gefunden')
    })
  })

  describe('checkBookingLimit', () => {
    it('allows booking when limit is not active', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            max_schichten_pro_helfer: 3,
            helfer_buchung_limit_aktiv: false,
          },
          error: null,
        }),
      })

      const result = await checkBookingLimit('profile-1', 'veranstaltung-1')

      expect(result.canBook).toBe(true)
      expect(result.limitActive).toBe(false)
    })

    it('allows booking when under limit', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get veranstaltung
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              max_schichten_pro_helfer: 3,
              helfer_buchung_limit_aktiv: true,
            },
            error: null,
          }),
        })
        // Get profile email
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { email: 'test@example.com' },
            error: null,
          }),
        })
        // Get person
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'person-1' },
            error: null,
          }),
        })
        // Get schichten
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'schicht-1' }, { id: 'schicht-2' }],
            error: null,
          }),
        })
        // Count bookings
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ count: 1, error: null }),
        })

      mockSupabase.from = fromMock

      const result = await checkBookingLimit('profile-1', 'veranstaltung-1')

      expect(result.canBook).toBe(true)
      expect(result.current).toBe(1)
      expect(result.max).toBe(3)
    })

    it('rejects booking when limit reached', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get veranstaltung
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              max_schichten_pro_helfer: 2,
              helfer_buchung_limit_aktiv: true,
            },
            error: null,
          }),
        })
        // Get profile email
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { email: 'test@example.com' },
            error: null,
          }),
        })
        // Get person
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'person-1' },
            error: null,
          }),
        })
        // Get schichten
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'schicht-1' }, { id: 'schicht-2' }],
            error: null,
          }),
        })
        // Count bookings - at limit
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ count: 2, error: null }),
        })

      mockSupabase.from = fromMock

      const result = await checkBookingLimit('profile-1', 'veranstaltung-1')

      expect(result.canBook).toBe(false)
      expect(result.current).toBe(2)
      expect(result.max).toBe(2)
    })
  })

  describe('checkDeadline', () => {
    it('allows registration when no deadline is set', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { helfer_buchung_deadline: null },
          error: null,
        }),
      })

      const result = await checkDeadline('veranstaltung-1')

      expect(result.canRegister).toBe(true)
      expect(result.deadline).toBeNull()
    })

    it('allows registration before deadline', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { helfer_buchung_deadline: futureDate.toISOString() },
          error: null,
        }),
      })

      const result = await checkDeadline('veranstaltung-1')

      expect(result.canRegister).toBe(true)
      expect(result.deadline).toBe(futureDate.toISOString())
    })

    it('rejects registration after deadline', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { helfer_buchung_deadline: pastDate.toISOString() },
          error: null,
        }),
      })

      const result = await checkDeadline('veranstaltung-1')

      expect(result.canRegister).toBe(false)
      expect(result.reason).toContain('moeglich')
    })
  })

  describe('checkTimeConflict', () => {
    it('returns no conflict when zeitblockId is null', async () => {
      const result = await checkTimeConflict('profile-1', 'veranstaltung-1', null)

      expect(result.hasConflict).toBe(false)
      expect(result.conflictingSlots).toEqual([])
    })
  })

  describe('validateRegistration', () => {
    it('returns canRegister false when not logged in', async () => {
      // Mock getUserProfile to return null
      const { getUserProfile } = await import('@/lib/supabase/server')
      vi.mocked(getUserProfile).mockResolvedValueOnce(null)

      const result = await validateRegistration('schicht-1')

      expect(result.canRegister).toBe(false)
      expect(result.errors).toContain('Nicht eingeloggt')
    })
  })

  describe('getBookingStatusForUser', () => {
    it('returns default values when not logged in', async () => {
      // Mock getUserProfile to return null
      const { getUserProfile } = await import('@/lib/supabase/server')
      vi.mocked(getUserProfile).mockResolvedValueOnce(null)

      const result = await getBookingStatusForUser('veranstaltung-1')

      expect(result.currentBookings).toBe(0)
      expect(result.maxBookings).toBeNull()
      expect(result.limitActive).toBe(false)
    })
  })
})
