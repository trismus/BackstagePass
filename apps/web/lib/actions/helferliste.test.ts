/**
 * Unit Tests for Helferliste Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockClient,
  mockHelferEvent,
  mockRollenInstanz,
  mockAnmeldung,
  mockProfile,
  mockRollenTemplate,
} from '@/tests/mocks/supabase'

// Mock the Supabase client
const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getUserProfile: vi.fn(() => Promise.resolve(mockProfile)),
}))

// Mock the notifications (we don't want to send actual emails in tests)
vi.mock('./helferliste-notifications', () => ({
  notifyRegistrationConfirmed: vi.fn().mockResolvedValue({ success: true }),
  notifyStatusChange: vi.fn().mockResolvedValue({ success: true }),
}))

// Import after mocking
import {
  getHelferEvents,
  getHelferEvent,
  createHelferEvent,
  updateHelferEvent,
  deleteHelferEvent,
  getRollenInstanzen,
  createRollenInstanz,
  anmelden,
  abmelden,
  updateAnmeldungStatus,
  getPublicEventByToken,
  anmeldenPublic,
} from './helferliste'

describe('Helferliste Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHelferEvents', () => {
    it('returns empty array when no events exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      const result = await getHelferEvents()
      expect(result).toEqual([])
    })

    it('returns events with role counts', async () => {
      const eventsWithRoles = [{
        ...mockHelferEvent,
        veranstaltung: null,
        rollen: [{ id: 'role-1' }, { id: 'role-2' }],
      }]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: eventsWithRoles, error: null }),
      })

      const result = await getHelferEvents()
      expect(result).toHaveLength(1)
      expect(result[0].rollen_count).toBe(2)
    })

    it('handles errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })

      const result = await getHelferEvents()
      expect(result).toEqual([])
    })
  })

  describe('getHelferEvent', () => {
    it('returns a single event by ID', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockHelferEvent,
          error: null,
        }),
      })

      const result = await getHelferEvent('event-1')
      expect(result).toEqual(mockHelferEvent)
    })

    it('returns null when event not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      })

      const result = await getHelferEvent('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('createHelferEvent', () => {
    it('creates a new event and returns success', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-event-1' },
          error: null,
        }),
      })

      const result = await createHelferEvent({
        name: 'New Event',
        typ: 'auffuehrung',
        datum_start: '2026-04-01T18:00:00Z',
        datum_end: '2026-04-01T22:00:00Z',
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('new-event-1')
    })

    it('returns error on failure', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      })

      const result = await createHelferEvent({
        name: 'New Event',
        typ: 'auffuehrung',
        datum_start: '2026-04-01T18:00:00Z',
        datum_end: '2026-04-01T22:00:00Z',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Insert failed')
    })
  })

  describe('updateHelferEvent', () => {
    it('updates an event and returns success', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await updateHelferEvent('event-1', { name: 'Updated Name' })

      expect(result.success).toBe(true)
    })

    it('returns error on failure', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      })

      const result = await updateHelferEvent('event-1', { name: 'Updated Name' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('deleteHelferEvent', () => {
    it('deletes an event and returns success', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await deleteHelferEvent('event-1')

      expect(result.success).toBe(true)
    })
  })

  describe('getRollenInstanzen', () => {
    it('returns role instances for an event', async () => {
      const instanzMitAnmeldungen = {
        ...mockRollenInstanz,
        template: mockRollenTemplate,
        anmeldungen: [mockAnmeldung],
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [instanzMitAnmeldungen],
          error: null,
        }),
      })

      const result = await getRollenInstanzen('event-1')
      expect(result).toHaveLength(1)
      expect(result[0].angemeldet_count).toBe(1)
    })
  })

  describe('createRollenInstanz', () => {
    it('creates a role instance and returns success', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-instanz-1' },
          error: null,
        }),
      })

      const result = await createRollenInstanz({
        helfer_event_id: 'event-1',
        anzahl_benoetigt: 2,
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('new-instanz-1')
    })
  })

  describe('anmelden', () => {
    it('registers user for a role via atomic booking', async () => {
      mockSupabase.rpc
        // Mock: check_helfer_time_conflicts (no conflicts)
        .mockResolvedValueOnce({
          data: { has_conflicts: false, conflicts: [] },
          error: null,
        })
        // Mock: book_helfer_slot (success)
        .mockResolvedValueOnce({
          data: {
            success: true,
            anmeldung_id: 'new-anmeldung-1',
            status: 'angemeldet',
            is_waitlist: false,
          },
          error: null,
        })

      const result = await anmelden('instanz-1')

      expect(result.success).toBe(true)
      expect(result.id).toBe('new-anmeldung-1')
      expect(result.isWaitlist).toBe(false)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_helfer_time_conflicts', {
        p_rollen_instanz_ids: ['instanz-1'],
        p_profile_id: 'user-1',
      })
      expect(mockSupabase.rpc).toHaveBeenCalledWith('book_helfer_slot', {
        p_rollen_instanz_id: 'instanz-1',
        p_profile_id: 'user-1',
      })
    })

    it('prevents double registration via atomic booking', async () => {
      mockSupabase.rpc
        // Mock: check_helfer_time_conflicts (no conflicts)
        .mockResolvedValueOnce({
          data: { has_conflicts: false, conflicts: [] },
          error: null,
        })
        // Mock: book_helfer_slot (duplicate)
        .mockResolvedValueOnce({
          data: {
            success: false,
            error: 'Bereits für diese Rolle angemeldet',
          },
          error: null,
        })

      const result = await anmelden('instanz-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bereits für diese Rolle angemeldet')
    })
  })

  describe('abmelden', () => {
    it('cancels own registration', async () => {
      const fromMock = vi.fn()
      fromMock
        // Check ownership
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { profile_id: mockProfile.id },
            error: null,
          }),
        })
        // Delete
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })

      mockSupabase.from = fromMock

      const result = await abmelden('anmeldung-1')

      expect(result.success).toBe(true)
    })

    it('rejects cancellation by other users', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { profile_id: 'other-user' },
          error: null,
        }),
      })

      // Mock getUserProfile to return a non-management user
      const { getUserProfile } = await import('@/lib/supabase/server')
      vi.mocked(getUserProfile).mockResolvedValueOnce({
        ...mockProfile,
        role: 'MITGLIED_AKTIV',
      })

      const result = await abmelden('anmeldung-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Keine Berechtigung')
    })
  })

  describe('updateAnmeldungStatus', () => {
    it('updates registration status', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await updateAnmeldungStatus('anmeldung-1', 'bestaetigt')

      expect(result.success).toBe(true)
    })
  })

  describe('getPublicEventByToken', () => {
    it('returns public event with public roles only', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get event
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockHelferEvent, veranstaltung: null },
            error: null,
          }),
        })
        // Get public roles
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [{
              ...mockRollenInstanz,
              template: mockRollenTemplate,
              anmeldungen: [],
            }],
            error: null,
          }),
        })

      mockSupabase.from = fromMock

      const result = await getPublicEventByToken('abc123')

      expect(result).not.toBeNull()
      expect(result?.rollen).toHaveLength(1)
    })

    it('returns null for invalid token', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      })

      const result = await getPublicEventByToken('invalid')

      expect(result).toBeNull()
    })
  })

  describe('anmeldenPublic', () => {
    it('registers external helper via atomic booking', async () => {
      mockSupabase.rpc
        // Mock: find_or_create_external_helper
        .mockResolvedValueOnce({
          data: 'helper-uuid-1',
          error: null,
        })
        // Mock: book_helfer_slot (success)
        .mockResolvedValueOnce({
          data: {
            success: true,
            anmeldung_id: 'new-anmeldung',
            status: 'angemeldet',
            is_waitlist: false,
          },
          error: null,
        })

      const result = await anmeldenPublic('instanz-1', {
        name: 'External Helper',
        email: 'helper@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('new-anmeldung')
      expect(result.isWaitlist).toBe(false)
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'find_or_create_external_helper',
        expect.objectContaining({ p_email: 'helper@example.com' })
      )
    })

    it('adds to waitlist when full via atomic booking', async () => {
      mockSupabase.rpc
        // Mock: find_or_create_external_helper
        .mockResolvedValueOnce({
          data: 'helper-uuid-1',
          error: null,
        })
        // Mock: book_helfer_slot (waitlist)
        .mockResolvedValueOnce({
          data: {
            success: true,
            anmeldung_id: 'waitlist-anmeldung',
            status: 'warteliste',
            is_waitlist: true,
          },
          error: null,
        })

      const result = await anmeldenPublic('instanz-1', {
        name: 'External Helper',
        email: 'helper@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.isWaitlist).toBe(true)
    })

    it('rejects registration for non-public roles via atomic booking', async () => {
      mockSupabase.rpc
        // Mock: book_helfer_slot (role not public)
        .mockResolvedValueOnce({
          data: {
            success: false,
            error: 'Rolle nicht öffentlich zugänglich',
          },
          error: null,
        })

      const result = await anmeldenPublic('instanz-1', {
        name: 'External Helper',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rolle nicht öffentlich zugänglich')
    })
  })
})
