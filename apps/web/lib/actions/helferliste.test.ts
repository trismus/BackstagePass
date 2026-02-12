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
  anmeldenPublicMulti,
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
            abmeldung_token: 'abmeldung-token-new',
          },
          error: null,
        })

      const result = await anmelden('instanz-1')

      expect(result.success).toBe(true)
      expect(result.id).toBe('new-anmeldung-1')
      expect(result.isWaitlist).toBe(false)
      expect(result.abmeldungToken).toBe('abmeldung-token-new')
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
    it('returns public event with public roles and empty infoBloecke', async () => {
      const fromMock = vi.fn()
      fromMock
        // Get event (no veranstaltung_id → no info_bloecke query)
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
      expect(result?.infoBloecke).toEqual([])
    })

    it('returns infoBloecke when event has veranstaltung_id', async () => {
      const mockInfoBlock = {
        id: 'info-1',
        veranstaltung_id: 'veranstaltung-1',
        titel: 'Helferessen',
        beschreibung: 'Spaghetti für alle',
        startzeit: '16:30:00',
        endzeit: '17:15:00',
        sortierung: 1,
        created_at: '2026-01-01T00:00:00Z',
      }

      const fromMock = vi.fn()
      fromMock
        // Get event (with veranstaltung_id)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockHelferEvent, veranstaltung_id: 'veranstaltung-1', veranstaltung: { id: 'veranstaltung-1', titel: 'Test' } },
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
        // Get info_bloecke
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [mockInfoBlock],
            error: null,
          }),
        })

      mockSupabase.from = fromMock

      const result = await getPublicEventByToken('abc123')

      expect(result).not.toBeNull()
      expect(result?.infoBloecke).toHaveLength(1)
      expect(result?.infoBloecke[0].titel).toBe('Helferessen')
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
            abmeldung_token: 'abmeldung-token-ext',
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
      expect(result.abmeldungToken).toBe('abmeldung-token-ext')
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
            abmeldung_token: 'abmeldung-token-wl',
          },
          error: null,
        })

      const result = await anmeldenPublic('instanz-1', {
        name: 'External Helper',
        email: 'helper@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.isWaitlist).toBe(true)
      expect(result.abmeldungToken).toBe('abmeldung-token-wl')
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

  describe('anmeldenPublicMulti', () => {
    const validContactData = {
      vorname: 'Max',
      nachname: 'Muster',
      email: 'max@example.com',
      datenschutz: true,
    }

    it('books multiple slots atomically via book_helfer_slots', async () => {
      const fromMock = vi.fn()
      fromMock
        // Query helfer_rollen_instanzen (for max limit check)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ helfer_event_id: 'event-1' }],
            error: null,
          }),
        })
        // Query helfer_events (for max_anmeldungen_pro_helfer)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { max_anmeldungen_pro_helfer: null },
            error: null,
          }),
        })
      mockSupabase.from = fromMock

      mockSupabase.rpc
        // Mock: find_or_create_external_helper
        .mockResolvedValueOnce({
          data: 'helper-uuid-1',
          error: null,
        })
        // Mock: check_helfer_time_conflicts (no conflicts)
        .mockResolvedValueOnce({
          data: { has_conflicts: false, conflicts: [] },
          error: null,
        })
        // Mock: book_helfer_slots (success)
        .mockResolvedValueOnce({
          data: {
            success: true,
            results: [
              {
                success: true,
                anmeldung_id: 'anmeldung-1',
                status: 'angemeldet',
                is_waitlist: false,
                abmeldung_token: 'token-1',
              },
              {
                success: true,
                anmeldung_id: 'anmeldung-2',
                status: 'angemeldet',
                is_waitlist: false,
                abmeldung_token: 'token-2',
              },
            ],
          },
          error: null,
        })

      const result = await anmeldenPublicMulti(
        ['instanz-1', 'instanz-2'],
        validContactData
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.results?.[0].anmeldung_id).toBe('anmeldung-1')
      expect(result.results?.[1].anmeldung_id).toBe('anmeldung-2')
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'book_helfer_slots',
        expect.objectContaining({
          p_rollen_instanz_ids: ['instanz-1', 'instanz-2'],
          p_external_helper_id: 'helper-uuid-1',
        })
      )
    })

    it('returns conflicts when time overlap with existing registrations', async () => {
      const fromMock = vi.fn()
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ helfer_event_id: 'event-1' }],
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { max_anmeldungen_pro_helfer: null },
            error: null,
          }),
        })
      mockSupabase.from = fromMock

      mockSupabase.rpc
        // Mock: find_or_create_external_helper
        .mockResolvedValueOnce({
          data: 'helper-uuid-1',
          error: null,
        })
        // Mock: check_helfer_time_conflicts (conflicts with existing)
        .mockResolvedValueOnce({
          data: {
            has_conflicts: true,
            conflicts: [
              {
                instanz_a: 'instanz-1',
                rolle_a: 'Einlass',
                event_a: 'Event A',
                instanz_b: 'existing-instanz',
                rolle_b: 'Kasse',
                event_b: 'Event A',
              },
            ],
          },
          error: null,
        })

      const result = await anmeldenPublicMulti(
        ['instanz-1', 'instanz-2'],
        validContactData
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Zeitüberschneidung mit bestehenden Anmeldungen')
      expect(result.conflicts).toHaveLength(1)
    })

    it('rolls back all bookings when one fails', async () => {
      const fromMock = vi.fn()
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ helfer_event_id: 'event-1' }],
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { max_anmeldungen_pro_helfer: null },
            error: null,
          }),
        })
      mockSupabase.from = fromMock

      mockSupabase.rpc
        // Mock: find_or_create_external_helper
        .mockResolvedValueOnce({
          data: 'helper-uuid-1',
          error: null,
        })
        // Mock: check_helfer_time_conflicts (no conflicts)
        .mockResolvedValueOnce({
          data: { has_conflicts: false, conflicts: [] },
          error: null,
        })
        // Mock: book_helfer_slots (failure)
        .mockResolvedValueOnce({
          data: {
            success: false,
            error: 'Einige Anmeldungen sind fehlgeschlagen',
            results: [
              { success: true, anmeldung_id: 'a1', status: 'angemeldet', is_waitlist: false },
              { success: false, error: 'Bereits für diese Rolle angemeldet' },
            ],
          },
          error: null,
        })

      const result = await anmeldenPublicMulti(
        ['instanz-1', 'instanz-2'],
        validContactData
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Einige Anmeldungen sind fehlgeschlagen')
    })

    it('passes datenschutz_akzeptiert timestamp to RPC', async () => {
      const fromMock = vi.fn()
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ helfer_event_id: 'event-1' }],
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { max_anmeldungen_pro_helfer: null },
            error: null,
          }),
        })
      mockSupabase.from = fromMock

      mockSupabase.rpc
        // Mock: find_or_create_external_helper
        .mockResolvedValueOnce({
          data: 'helper-uuid-1',
          error: null,
        })
        // Mock: check_helfer_time_conflicts (no conflicts)
        .mockResolvedValueOnce({
          data: { has_conflicts: false, conflicts: [] },
          error: null,
        })
        // Mock: book_helfer_slots (success)
        .mockResolvedValueOnce({
          data: {
            success: true,
            results: [
              {
                success: true,
                anmeldung_id: 'anmeldung-1',
                status: 'angemeldet',
                is_waitlist: false,
                abmeldung_token: 'token-1',
              },
            ],
          },
          error: null,
        })

      await anmeldenPublicMulti(
        ['instanz-1'],
        validContactData
      )

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'book_helfer_slots',
        expect.objectContaining({
          p_datenschutz_akzeptiert: expect.any(String),
        })
      )
    })

    it('respects max_anmeldungen_pro_helfer limit', async () => {
      const fromMock = vi.fn()
      fromMock
        // Query helfer_rollen_instanzen
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ helfer_event_id: 'event-1' }],
            error: null,
          }),
        })
        // Query helfer_events (max limit = 2)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { max_anmeldungen_pro_helfer: 2 },
            error: null,
          }),
        })
        // Query existing anmeldungen (1 existing)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          neq: vi.fn().mockResolvedValue({
            count: 1,
            data: null,
            error: null,
          }),
        })
        // Query helfer_rollen_instanzen for event IDs
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'instanz-existing' }, { id: 'instanz-1' }, { id: 'instanz-2' }],
            error: null,
          }),
        })
      mockSupabase.from = fromMock

      mockSupabase.rpc
        // Mock: find_or_create_external_helper
        .mockResolvedValueOnce({
          data: 'helper-uuid-1',
          error: null,
        })

      const result = await anmeldenPublicMulti(
        ['instanz-1', 'instanz-2'],
        { ...validContactData, email: 'limit@example.com' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Maximal 2 Anmeldungen pro Helfer erlaubt')
    })

    it('rejects empty role selection', async () => {
      const result = await anmeldenPublicMulti(
        [],
        validContactData
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Mindestens eine Rolle muss ausgewählt werden')
    })

    it('rejects when datenschutz is false', async () => {
      const result = await anmeldenPublicMulti(
        ['instanz-1'],
        { ...validContactData, datenschutz: false }
      )

      expect(result.success).toBe(false)
      expect(result.fieldErrors).toBeDefined()
      expect(result.fieldErrors?.datenschutz).toBeDefined()
    })

    it('rejects invalid email format', async () => {
      const result = await anmeldenPublicMulti(
        ['instanz-1'],
        { ...validContactData, email: 'not-an-email' }
      )

      expect(result.success).toBe(false)
      expect(result.fieldErrors).toBeDefined()
      expect(result.fieldErrors?.email).toBeDefined()
    })

    it('rejects empty vorname', async () => {
      const result = await anmeldenPublicMulti(
        ['instanz-1'],
        { ...validContactData, vorname: '' }
      )

      expect(result.success).toBe(false)
      expect(result.fieldErrors).toBeDefined()
      expect(result.fieldErrors?.vorname).toBeDefined()
    })
  })
})
