/**
 * Supabase Mock for Testing
 */

import { vi } from 'vitest'

export interface MockQueryResult {
  data: unknown
  error: { message: string } | null
  count?: number
}

/**
 * Create a chainable mock query builder
 */
export function createMockQueryBuilder(result: MockQueryResult) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (result: MockQueryResult) => void) => {
      resolve(result)
      return Promise.resolve(result)
    },
  }
  return builder
}

/**
 * Create a mock Supabase client
 */
export function createMockClient(overrides?: {
  fromResults?: Record<string, MockQueryResult>
}) {
  const defaultResult: MockQueryResult = { data: [], error: null }

  return {
    from: vi.fn((table: string) => {
      const result = overrides?.fromResults?.[table] || defaultResult
      return createMockQueryBuilder(result)
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  }
}

// Sample test data
export const mockHelferEvent = {
  id: 'event-1',
  name: 'Test Event',
  beschreibung: 'Test Description',
  typ: 'auffuehrung' as const,
  datum_start: '2026-03-01T18:00:00Z',
  datum_end: '2026-03-01T22:00:00Z',
  ort: 'Gemeindesaal',
  status: 'aktiv' as const,
  public_token: 'abc123',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const mockRollenTemplate = {
  id: 'template-1',
  name: 'Einlass',
  beschreibung: 'Einlasskontrolle',
  default_anzahl: 2,
  created_at: '2026-01-01T00:00:00Z',
}

export const mockRollenInstanz = {
  id: 'instanz-1',
  helfer_event_id: 'event-1',
  template_id: 'template-1',
  anzahl_benoetigt: 2,
  zeitblock_start: '2026-03-01T17:00:00Z',
  zeitblock_end: '2026-03-01T19:00:00Z',
  sichtbarkeit: 'public' as const,
  notiz: null,
  created_at: '2026-01-01T00:00:00Z',
}

export const mockAnmeldung = {
  id: 'anmeldung-1',
  rollen_instanz_id: 'instanz-1',
  profile_id: 'user-1',
  external_name: null,
  external_email: null,
  external_telefon: null,
  status: 'angemeldet' as const,
  created_at: '2026-01-01T00:00:00Z',
}

export const mockProfile = {
  id: 'user-1',
  user_id: 'auth-user-1',
  display_name: 'Test User',
  email: 'test@example.com',
  role: 'MITGLIED_AKTIV' as const,
}
