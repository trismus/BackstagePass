/**
 * Unit Tests for Persönlicher Kalender (Issue #346)
 * Tests getPersonalEvents (5 sources), getPersonVerfuegbarkeiten,
 * personId management view, and decline actions for new types.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockClient } from '@/tests/mocks/supabase'

const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getUserProfile: vi.fn(() =>
    Promise.resolve({
      id: 'profile-1',
      email: 'test@example.com',
      role: 'MITGLIED_AKTIV',
      display_name: 'Test User',
    })
  ),
}))

const mockRequirePermission = vi.fn()

vi.mock('@/lib/supabase/auth-helpers', () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}))

import {
  getPersonalEvents,
  getPersonVerfuegbarkeiten,
  declinePersonalEvent,
} from './persoenlicher-kalender'

// =============================================================================
// Helpers
// =============================================================================

function setupPersonLookup(personId = 'person-1', profileId: string | null = 'profile-1') {
  // Mock the personen lookup chain for resolvePersonIds
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: personId, profile_id: profileId },
      error: null,
    }),
  }
  return chain
}

function createEmptyChain() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
      resolve({ data: [], error: null })
      return Promise.resolve({ data: [], error: null })
    },
  }
  return chain
}

// =============================================================================
// Tests
// =============================================================================

describe('getPersonalEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty when person not found', async () => {
    // personen lookup returns null
    const personChain = createEmptyChain()
    mockSupabase.from.mockReturnValue(personChain)

    const result = await getPersonalEvents()
    expect(result).toEqual([])
  })

  it('returns events from all 5 sources', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'personen') {
        return setupPersonLookup('person-1', 'profile-1')
      }

      if (table === 'anmeldungen') {
        const chain = createEmptyChain()
        // Override the then to return anmeldungen data
        const resultData = [
          {
            id: 'anm-1',
            status: 'angemeldet',
            person_id: 'person-1',
            veranstaltung: {
              id: 'v-1',
              titel: 'GV 2026',
              beschreibung: null,
              datum: '2026-06-01',
              startzeit: '19:00:00',
              endzeit: '22:00:00',
              ort: 'Gemeindesaal',
              typ: 'vereinsevent',
              status: 'geplant',
            },
          },
        ]
        chain.then = (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: resultData, error: null })
          return Promise.resolve({ data: resultData, error: null })
        }
        return chain
      }

      if (table === 'proben_teilnehmer') {
        const chain = createEmptyChain()
        const resultData = [
          {
            id: 'pt-1',
            status: 'zugesagt',
            person_id: 'person-1',
            probe: {
              id: 'p-1',
              titel: 'Leseprobe',
              beschreibung: null,
              datum: '2026-05-15',
              startzeit: '18:00:00',
              endzeit: '20:00:00',
              ort: 'Proberaum',
              status: 'geplant',
              stueck: { id: 's-1', titel: 'Hamlet' },
            },
          },
        ]
        chain.then = (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: resultData, error: null })
          return Promise.resolve({ data: resultData, error: null })
        }
        return chain
      }

      if (table === 'auffuehrung_zuweisungen') {
        const chain = createEmptyChain()
        const resultData = [
          {
            id: 'z-1',
            status: 'zugesagt',
            person_id: 'person-1',
            notizen: null,
            schicht: {
              id: 'sch-1',
              rolle: 'Kasse',
              veranstaltung_id: 'v-2',
              zeitblock: { id: 'zb-1', name: 'Abend', startzeit: '18:00:00', endzeit: '22:00:00' },
              veranstaltung: { id: 'v-2', titel: 'Premiere', datum: '2026-07-01', ort: 'Bühne' },
            },
          },
        ]
        chain.then = (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: resultData, error: null })
          return Promise.resolve({ data: resultData, error: null })
        }
        return chain
      }

      if (table === 'helfer_anmeldungen') {
        const chain = createEmptyChain()
        const resultData = [
          {
            id: 'ha-1',
            status: 'bestaetigt',
            helfer_rollen_instanzen: {
              id: 'ri-1',
              custom_name: null,
              zeitblock_start: '08:00:00',
              zeitblock_end: '12:00:00',
              helfer_rollen_templates: { name: 'Aufbau' },
              helfer_events: {
                id: 'he-1',
                name: 'Festbetrieb',
                beschreibung: 'Dorffest',
                datum_start: '2026-08-01',
                datum_end: '2026-08-01',
                ort: 'Festplatz',
              },
            },
          },
        ]
        chain.then = (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: resultData, error: null })
          return Promise.resolve({ data: resultData, error: null })
        }
        return chain
      }

      if (table === 'helferschichten') {
        const chain = createEmptyChain()
        const resultData = [
          {
            id: 'hs-1',
            startzeit: '14:00:00',
            endzeit: '18:00:00',
            status: 'zugesagt',
            notizen: null,
            helferrolle: { id: 'hr-1', rolle: 'Service' },
            helfereinsatz: {
              id: 'hei-1',
              titel: 'Hochzeit Müller',
              beschreibung: null,
              datum: '2026-09-01',
              startzeit: '14:00:00',
              endzeit: '22:00:00',
              ort: 'Restaurant',
            },
          },
        ]
        chain.then = (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: resultData, error: null })
          return Promise.resolve({ data: resultData, error: null })
        }
        return chain
      }

      return createEmptyChain()
    })

    const result = await getPersonalEvents()

    expect(result).toHaveLength(5)

    // Check all 5 types are present
    const types = result.map((e) => e.typ)
    expect(types).toContain('veranstaltung')
    expect(types).toContain('probe')
    expect(types).toContain('schicht')
    expect(types).toContain('helfer')
    expect(types).toContain('helfereinsatz_legacy')

    // Verify sorted by date
    for (let i = 1; i < result.length; i++) {
      expect(result[i].datum >= result[i - 1].datum).toBe(true)
    }

    // Check helfer event details
    const helferEvent = result.find((e) => e.typ === 'helfer')!
    expect(helferEvent.id).toBe('ha-ha-1')
    expect(helferEvent.helfer_rolle).toBe('Aufbau')
    expect(helferEvent.helfer_event_id).toBe('he-1')

    // Check legacy event details
    const legacyEvent = result.find((e) => e.typ === 'helfereinsatz_legacy')!
    expect(legacyEvent.id).toBe('hs-hs-1')
    expect(legacyEvent.helfer_rolle).toBe('Service')
    expect(legacyEvent.helfereinsatz_id).toBe('hei-1')
  })

  it('requires mitglieder:read when personId provided', async () => {
    mockRequirePermission.mockResolvedValueOnce(undefined)

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'personen') {
        return setupPersonLookup('person-2', null)
      }
      return createEmptyChain()
    })

    await getPersonalEvents(undefined, undefined, 'person-2')

    expect(mockRequirePermission).toHaveBeenCalledWith('mitglieder:read')
  })

  it('skips helfer_anmeldungen when person has no profile_id', async () => {
    mockRequirePermission.mockResolvedValueOnce(undefined)

    const fromCalls: string[] = []
    mockSupabase.from.mockImplementation((table: string) => {
      fromCalls.push(table)
      if (table === 'personen') {
        return setupPersonLookup('person-2', null)
      }
      return createEmptyChain()
    })

    await getPersonalEvents(undefined, undefined, 'person-2')

    // helfer_anmeldungen should NOT be queried when profileId is null
    expect(fromCalls).not.toContain('helfer_anmeldungen')
    // helferschichten should still be queried
    expect(fromCalls).toContain('helferschichten')
  })
})

describe('getPersonVerfuegbarkeiten', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns verfuegbarkeiten for current user', async () => {
    const verfData = [
      {
        id: 'v-1',
        datum_von: '2026-06-01',
        datum_bis: '2026-06-15',
        zeitfenster_von: null,
        zeitfenster_bis: null,
        status: 'nicht_verfuegbar',
        grund: 'Ferien',
        notiz: null,
      },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'personen') {
        return setupPersonLookup('person-1', 'profile-1')
      }
      if (table === 'verfuegbarkeiten') {
        const chain = createEmptyChain()
        chain.then = (resolve: (r: { data: unknown[]; error: null }) => void) => {
          resolve({ data: verfData, error: null })
          return Promise.resolve({ data: verfData, error: null })
        }
        return chain
      }
      return createEmptyChain()
    })

    const result = await getPersonVerfuegbarkeiten()

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('nicht_verfuegbar')
    expect(result[0].grund).toBe('Ferien')
  })

  it('requires mitglieder:read when personId provided', async () => {
    mockRequirePermission.mockResolvedValueOnce(undefined)

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'personen') {
        return setupPersonLookup('person-2', null)
      }
      return createEmptyChain()
    })

    await getPersonVerfuegbarkeiten('person-2')

    expect(mockRequirePermission).toHaveBeenCalledWith('mitglieder:read')
  })

  it('returns empty when person not found', async () => {
    mockSupabase.from.mockReturnValue(createEmptyChain())

    const result = await getPersonVerfuegbarkeiten()
    expect(result).toEqual([])
  })
})

describe('declinePersonalEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles ha- prefix for helfer_anmeldungen', async () => {
    const innerEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({ eq: innerEq }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'personen') {
        return setupPersonLookup('person-1', 'profile-1')
      }
      if (table === 'helfer_anmeldungen') {
        return updateChain
      }
      return createEmptyChain()
    })

    const result = await declinePersonalEvent('ha-anm123')

    expect(result.success).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('helfer_anmeldungen')
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'abgelehnt' })
  })

  it('handles hs- prefix for helferschichten', async () => {
    const innerEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({ eq: innerEq }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'personen') {
        return setupPersonLookup('person-1', 'profile-1')
      }
      if (table === 'helferschichten') {
        return updateChain
      }
      return createEmptyChain()
    })

    const result = await declinePersonalEvent('hs-sch456')

    expect(result.success).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('helferschichten')
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'abgesagt' })
  })
})
