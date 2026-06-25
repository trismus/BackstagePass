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
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  }
}

export const mockProfile = {
  id: 'user-1',
  user_id: 'auth-user-1',
  display_name: 'Test User',
  email: 'test@example.com',
  role: 'MITGLIED_AKTIV' as const,
}

export const mockVorstandProfile = {
  id: 'user-vorstand',
  user_id: 'auth-vorstand-1',
  display_name: 'Vorstand User',
  email: 'vorstand@example.com',
  role: 'VORSTAND' as const,
}

// =============================================================================
// Künstlerische Planung Mock Data (Issue #113)
// =============================================================================

export const mockStueck = {
  id: 'stueck-1',
  titel: 'Hamlet',
  beschreibung: 'Eine Tragödie von Shakespeare',
  autor: 'William Shakespeare',
  status: 'in_proben' as const,
  premiere_datum: '2026-06-15',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const mockSzene = {
  id: 'szene-1',
  stueck_id: 'stueck-1',
  nummer: 1,
  titel: 'Akt 1, Szene 1',
  beschreibung: 'Die Wache auf der Terrasse',
  text: 'Wer da? - Nein, antwortet mir!',
  dauer_minuten: 10,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const mockStueckRolle = {
  id: 'rolle-1',
  stueck_id: 'stueck-1',
  name: 'Hamlet',
  beschreibung: 'Prinz von Dänemark',
  typ: 'hauptrolle' as const,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const mockBesetzung = {
  id: 'besetzung-1',
  rolle_id: 'rolle-1',
  person_id: 'person-1',
  typ: 'hauptbesetzung' as const,
  gueltig_von: '2026-01-01',
  gueltig_bis: null,
  notizen: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const mockProbe = {
  id: 'probe-1',
  stueck_id: 'stueck-1',
  titel: 'Durchlaufprobe Akt 1',
  beschreibung: 'Kompletter erster Akt',
  datum: '2026-03-15',
  startzeit: '19:00:00',
  endzeit: '22:00:00',
  ort: 'Proberaum',
  status: 'geplant' as const,
  notizen: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const mockPerson = {
  id: 'person-1',
  vorname: 'Max',
  nachname: 'Mustermann',
  email: 'max@example.com',
  telefon: '+41 79 123 45 67',
  strasse: null,
  plz: null,
  ort: null,
  geburtstag: null,
  rolle: 'mitglied' as const,
  aktiv: true,
  notizen: null,
  notfallkontakt_name: null,
  notfallkontakt_telefon: null,
  notfallkontakt_beziehung: null,
  profilbild_url: null,
  biografie: null,
  mitglied_seit: null,
  austrittsdatum: null,
  austrittsgrund: null,
  skills: [],
  telefon_nummern: [],
  bevorzugte_kontaktart: null,
  social_media: null,
  kontakt_notizen: null,
  archiviert_am: null,
  archiviert_von: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
