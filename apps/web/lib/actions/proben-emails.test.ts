/**
 * Unit tests for Proben Sofort-Mail helpers (Issue #489)
 *
 * Verifies that:
 *  - invitation / change / cancellation emails are dispatched via the SMTP layer
 *  - opt-out flags in `benachrichtigungs_einstellungen` are honored
 *  - persons without email or without profile are handled gracefully
 *
 * The SMTP layer (`sendEmailWithRetry`) is mocked at the module boundary so
 * no real email is sent.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// -----------------------------------------------------------------------------
// Mock SMTP layer — must be hoisted BEFORE importing the SUT
// -----------------------------------------------------------------------------

const { sendEmailWithRetryMock } = vi.hoisted(() => ({
  sendEmailWithRetryMock: vi.fn(async () => ({ success: true, messageId: 'mock-1' })),
}))

vi.mock('../email/client', () => ({
  sendEmailWithRetry: sendEmailWithRetryMock,
  sendEmail: vi.fn(async () => ({ success: true, messageId: 'mock-1' })),
}))

// -----------------------------------------------------------------------------
// Mock the admin Supabase client — chainable `from(...).select().eq()...` builder
// -----------------------------------------------------------------------------

type Row = Record<string, unknown>

const { tableState, mockAdminClient } = vi.hoisted(() => {
  const tableState: Record<string, { rows: Record<string, unknown>[]; error: { message: string } | null }> = {}

  function makeBuilder(table: string) {
    const filters: Array<(r: Record<string, unknown>) => boolean> = []

    const exec = () => {
      const t = tableState[table]
      if (!t) return { data: [], error: null }
      if (t.error) return { data: null, error: t.error }
      const rows = t.rows.filter((r) => filters.every((f) => f(r)))
      return { data: rows, error: null }
    }

    const builder: Record<string, unknown> = {
      select: vi.fn(() => builder),
      eq: vi.fn((col: string, value: unknown) => {
        filters.push((r) => r[col] === value)
        return builder
      }),
      in: vi.fn((col: string, values: unknown[]) => {
        filters.push((r) => values.includes(r[col]))
        return builder
      }),
      insert: vi.fn(async () => ({ error: null })),
      update: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      single: vi.fn(async () => {
        const r = exec()
        if (r.error) return { data: null, error: r.error }
        return { data: r.data?.[0] ?? null, error: null }
      }),
      maybeSingle: vi.fn(async () => {
        const r = exec()
        if (r.error) return { data: null, error: r.error }
        return { data: r.data?.[0] ?? null, error: null }
      }),
      then: (resolve: (result: { data: unknown[]; error: unknown }) => void) => {
        const r = exec()
        resolve({ data: r.data ?? [], error: r.error })
        return Promise.resolve(r)
      },
    }
    return builder
  }

  const mockAdminClient = {
    from: vi.fn((table: string) => makeBuilder(table)),
  }

  return { tableState, mockAdminClient }
})

function setTable(table: string, rows: Row[], error: { message: string } | null = null) {
  tableState[table] = { rows, error }
}

function resetTables() {
  for (const key of Object.keys(tableState)) delete tableState[key]
}

vi.mock('../supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}))

// -----------------------------------------------------------------------------
// Import the SUT after the mocks are wired up
// -----------------------------------------------------------------------------

import {
  sendProbeEinladungEmails,
  sendProbeAenderungEmails,
  sendProbeAbsageEmails,
  getExistingTeilnehmerPersonIds,
} from './proben-emails'

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

const PROBE_ID = 'probe-123'
const STUECK_ID = 'stueck-1'

function seedProbe(overrides: Partial<Row> = {}) {
  setTable('proben', [
    {
      id: PROBE_ID,
      titel: 'Durchlaufprobe Akt 1',
      datum: '2026-07-15',
      startzeit: '19:30:00',
      endzeit: '22:00:00',
      ort: 'Probebühne',
      stueck_id: STUECK_ID,
      status: 'geplant',
      notizen: null,
      stueck: { titel: 'Hamlet' },
      ...overrides,
    },
  ])
}

function seedPerson(
  id: string,
  email: string | null,
  opts: { profileId?: string | null; vorname?: string; nachname?: string } = {}
) {
  const existing = tableState['personen']?.rows ?? []
  setTable('personen', [
    ...existing,
    {
      id,
      vorname: opts.vorname ?? 'Anna',
      nachname: opts.nachname ?? 'Beispiel',
      email,
    },
  ])

  const existingProfiles = tableState['profiles']?.rows ?? []
  if (opts.profileId !== undefined && opts.profileId !== null && email) {
    setTable('profiles', [
      ...existingProfiles,
      { id: opts.profileId, email },
    ])
  } else {
    setTable('profiles', existingProfiles)
  }
}

function seedSettings(profileId: string, settings: Record<string, boolean>) {
  const existing = tableState['benachrichtigungs_einstellungen']?.rows ?? []
  setTable('benachrichtigungs_einstellungen', [
    ...existing,
    { profile_id: profileId, ...settings },
  ])
}

function seedTeilnehmer(personIds: string[], status = 'eingeladen') {
  setTable(
    'proben_teilnehmer',
    personIds.map((pid) => ({ probe_id: PROBE_ID, person_id: pid, status }))
  )
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('proben-emails (Issue #489)', () => {
  beforeEach(() => {
    sendEmailWithRetryMock.mockClear()
    sendEmailWithRetryMock.mockImplementation(async () => ({ success: true, messageId: 'mock-1' }))
    resetTables()
  })

  // -----------------------------
  // sendProbeEinladungEmails
  // -----------------------------

  describe('sendProbeEinladungEmails', () => {
    it('sends an invitation to a teilnehmer with email and no opt-out', async () => {
      seedProbe()
      seedPerson('person-1', 'anna@example.com', { profileId: 'profile-1' })

      const result = await sendProbeEinladungEmails(PROBE_ID, ['person-1'])

      expect(result.sent).toBe(1)
      expect(result.failed).toBe(0)
      expect(result.skipped).toBe(0)
      expect(sendEmailWithRetryMock).toHaveBeenCalledTimes(1)

      const call = sendEmailWithRetryMock.mock.calls[0][0] as { to: string; subject: string }
      expect(call.to).toBe('anna@example.com')
      expect(call.subject).toContain('Probeneinladung')
      expect(call.subject).toContain('Hamlet')
    })

    it('skips a teilnehmer who has opted out (email_neue_einladung = false)', async () => {
      seedProbe()
      seedPerson('person-1', 'opt-out@example.com', { profileId: 'profile-1' })
      seedSettings('profile-1', { email_neue_einladung: false })

      const result = await sendProbeEinladungEmails(PROBE_ID, ['person-1'])

      expect(result.sent).toBe(0)
      expect(result.skipped).toBe(1)
      expect(sendEmailWithRetryMock).not.toHaveBeenCalled()
    })

    it('still sends to a teilnehmer with a settings row but the flag set to true', async () => {
      seedProbe()
      seedPerson('person-1', 'opt-in@example.com', { profileId: 'profile-1' })
      seedSettings('profile-1', { email_neue_einladung: true })

      const result = await sendProbeEinladungEmails(PROBE_ID, ['person-1'])

      expect(result.sent).toBe(1)
      expect(result.skipped).toBe(0)
    })

    it('skips persons without an email address', async () => {
      seedProbe()
      seedPerson('person-1', null)

      const result = await sendProbeEinladungEmails(PROBE_ID, ['person-1'])

      expect(result.sent).toBe(0)
      expect(result.skipped).toBe(1)
      expect(sendEmailWithRetryMock).not.toHaveBeenCalled()
    })

    it('treats a person without a linked profile as "no opt-out" and sends', async () => {
      seedProbe()
      seedPerson('person-1', 'no-profile@example.com') // no profileId

      const result = await sendProbeEinladungEmails(PROBE_ID, ['person-1'])

      expect(result.sent).toBe(1)
      expect(result.skipped).toBe(0)
    })

    it('returns zeros when personIds is empty', async () => {
      seedProbe()

      const result = await sendProbeEinladungEmails(PROBE_ID, [])

      expect(result).toEqual({ sent: 0, skipped: 0, failed: 0 })
      expect(sendEmailWithRetryMock).not.toHaveBeenCalled()
    })

    it('counts a failed send as failed (not sent)', async () => {
      seedProbe()
      seedPerson('person-1', 'fail@example.com', { profileId: 'profile-1' })
      sendEmailWithRetryMock.mockImplementationOnce(async () => ({ success: false, error: 'SMTP down' }))

      const result = await sendProbeEinladungEmails(PROBE_ID, ['person-1'])

      expect(result.sent).toBe(0)
      expect(result.failed).toBe(1)
    })

    it('returns zeros if the probe does not exist', async () => {
      // no seedProbe()

      const result = await sendProbeEinladungEmails('non-existent', ['person-1'])

      expect(result).toEqual({ sent: 0, skipped: 0, failed: 0 })
      expect(sendEmailWithRetryMock).not.toHaveBeenCalled()
    })
  })

  // -----------------------------
  // sendProbeAenderungEmails
  // -----------------------------

  describe('sendProbeAenderungEmails', () => {
    it('mails all current teilnehmer (eingeladen / zugesagt / vielleicht)', async () => {
      seedProbe()
      seedPerson('person-1', 'a@example.com', { profileId: 'profile-a' })
      seedPerson('person-2', 'b@example.com', { profileId: 'profile-b' })
      seedTeilnehmer(['person-1', 'person-2'])

      const result = await sendProbeAenderungEmails(PROBE_ID, [
        { field: 'datum', vorher: '15.07.2026', nachher: '22.07.2026' },
      ])

      expect(result.sent).toBe(2)
      expect(sendEmailWithRetryMock).toHaveBeenCalledTimes(2)
      const subjects = sendEmailWithRetryMock.mock.calls.map((c) => (c[0] as { subject: string }).subject)
      expect(subjects.every((s) => s.includes('Probe geändert'))).toBe(true)
    })

    it('respects the Änderungsbenachrichtigung opt-out flag', async () => {
      seedProbe()
      seedPerson('person-1', 'opt-out@example.com', { profileId: 'profile-1' })
      seedSettings('profile-1', { email_aenderungsbenachrichtigung: false })
      seedTeilnehmer(['person-1'])

      const result = await sendProbeAenderungEmails(PROBE_ID, [
        { field: 'ort', vorher: 'A', nachher: 'B' },
      ])

      expect(result.sent).toBe(0)
      expect(result.skipped).toBe(1)
    })

    it('returns zero when there are no changes', async () => {
      seedProbe()
      seedTeilnehmer(['person-1'])

      const result = await sendProbeAenderungEmails(PROBE_ID, [])

      expect(result).toEqual({ sent: 0, skipped: 0, failed: 0 })
      expect(sendEmailWithRetryMock).not.toHaveBeenCalled()
    })

    it('returns zero when no teilnehmer exist', async () => {
      seedProbe()
      // no teilnehmer rows

      const result = await sendProbeAenderungEmails(PROBE_ID, [
        { field: 'datum', vorher: 'A', nachher: 'B' },
      ])

      expect(result).toEqual({ sent: 0, skipped: 0, failed: 0 })
    })
  })

  // -----------------------------
  // sendProbeAbsageEmails
  // -----------------------------

  describe('sendProbeAbsageEmails', () => {
    it('sends an Absage to all teilnehmer including the Grund text', async () => {
      seedProbe()
      seedPerson('person-1', 'a@example.com', { profileId: 'profile-a' })
      seedTeilnehmer(['person-1'])

      const result = await sendProbeAbsageEmails(PROBE_ID, 'Krankheit Regie')

      expect(result.sent).toBe(1)
      const call = sendEmailWithRetryMock.mock.calls[0][0] as {
        subject: string
        text: string
        html: string
      }
      expect(call.subject).toContain('Probe abgesagt')
      expect(call.text).toContain('Krankheit Regie')
    })

    it('respects the Änderungsbenachrichtigung opt-out flag (same flag as Änderung)', async () => {
      seedProbe()
      seedPerson('person-1', 'opt-out@example.com', { profileId: 'profile-1' })
      seedSettings('profile-1', { email_aenderungsbenachrichtigung: false })
      seedTeilnehmer(['person-1'])

      const result = await sendProbeAbsageEmails(PROBE_ID)

      expect(result.sent).toBe(0)
      expect(result.skipped).toBe(1)
    })

    it('skips when there are no teilnehmer', async () => {
      seedProbe()

      const result = await sendProbeAbsageEmails(PROBE_ID)

      expect(result).toEqual({ sent: 0, skipped: 0, failed: 0 })
    })
  })

  // -----------------------------
  // getExistingTeilnehmerPersonIds
  // -----------------------------

  describe('getExistingTeilnehmerPersonIds', () => {
    it('returns the set of person_ids currently in proben_teilnehmer', async () => {
      seedTeilnehmer(['person-1', 'person-2'])

      const ids = await getExistingTeilnehmerPersonIds(PROBE_ID)

      expect(ids.has('person-1')).toBe(true)
      expect(ids.has('person-2')).toBe(true)
      expect(ids.size).toBe(2)
    })

    it('returns an empty set when no teilnehmer exist', async () => {
      const ids = await getExistingTeilnehmerPersonIds(PROBE_ID)
      expect(ids.size).toBe(0)
    })
  })
})
