/**
 * Unit Tests for Helferliste Public Server Actions
 * Tests for getPublicEventByToken and anmeldenPublicMulti
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockClient,
  mockHelferEvent,
  mockRollenInstanz,
  mockRollenTemplate,
} from '@/tests/mocks/supabase'

// Mock the Supabase client
const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Mock the notifications (we don't want to send actual emails in tests)
vi.mock('./helferliste-notifications', () => ({
  notifyMultiRegistrationConfirmed: vi.fn().mockResolvedValue({ success: true }),
}))

// Import after mocking
import {
  getPublicEventByToken,
  anmeldenPublicMulti,
} from './helferliste'

describe('Helferliste Public Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
        // Mock: get_externe_helfer_dashboard_token
        .mockResolvedValueOnce({
          data: 'dashboard-token-uuid',
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

      // Verify batched notification is called once (not per-slot)
      const { notifyMultiRegistrationConfirmed } = await import('./helferliste-notifications')
      expect(notifyMultiRegistrationConfirmed).toHaveBeenCalledTimes(1)
      expect(notifyMultiRegistrationConfirmed).toHaveBeenCalledWith(
        ['anmeldung-1', 'anmeldung-2'],
        'helper-uuid-1',
        'dashboard-token-uuid',
        'max@example.com',
        'Max Muster'
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
        // Mock: get_externe_helfer_dashboard_token
        .mockResolvedValueOnce({
          data: 'dashboard-token-uuid',
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
