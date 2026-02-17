/**
 * Unit Tests for Cross-System Conflict Detection
 * Issue #343
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockClient } from '@/tests/mocks/supabase'

const mockSupabase = createMockClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

const mockRequirePermission = vi.fn()

vi.mock('@/lib/supabase/auth-helpers', () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}))

import { checkPersonConflicts } from './conflict-check'

describe('checkPersonConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns no conflicts when RPC returns empty', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { has_conflicts: false, conflicts: [] },
      error: null,
    })

    const result = await checkPersonConflicts(
      'person-1',
      '2026-03-01 10:00:00 Europe/Zurich',
      '2026-03-01 12:00:00 Europe/Zurich'
    )

    expect(result.has_conflicts).toBe(false)
    expect(result.conflicts).toEqual([])
    expect(mockSupabase.rpc).toHaveBeenCalledWith('check_person_conflicts', {
      p_person_id: 'person-1',
      p_start_zeit: '2026-03-01 10:00:00 Europe/Zurich',
      p_end_zeit: '2026-03-01 12:00:00 Europe/Zurich',
    })
  })

  it('returns conflicts from multiple sources', async () => {
    const conflicts = [
      {
        type: 'verfuegbarkeit',
        description: 'Urlaub',
        start_time: '2026-03-01T00:00:00+01:00',
        end_time: '2026-03-02T00:00:00+01:00',
        reference_id: 'verf-1',
        severity: 'nicht_verfuegbar',
      },
      {
        type: 'probe',
        description: 'Durchlaufprobe',
        start_time: '2026-03-01T10:00:00+01:00',
        end_time: '2026-03-01T12:00:00+01:00',
        reference_id: 'probe-1',
      },
    ]

    mockSupabase.rpc.mockResolvedValueOnce({
      data: { has_conflicts: true, conflicts },
      error: null,
    })

    const result = await checkPersonConflicts(
      'person-1',
      '2026-03-01 10:00:00 Europe/Zurich',
      '2026-03-01 12:00:00 Europe/Zurich'
    )

    expect(result.has_conflicts).toBe(true)
    expect(result.conflicts).toHaveLength(2)
    expect(result.conflicts[0].type).toBe('verfuegbarkeit')
    expect(result.conflicts[1].type).toBe('probe')
  })

  it('returns empty result on RPC error', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'RPC failed' },
    })

    const result = await checkPersonConflicts(
      'person-1',
      '2026-03-01 10:00:00 Europe/Zurich',
      '2026-03-01 12:00:00 Europe/Zurich'
    )

    expect(result.has_conflicts).toBe(false)
    expect(result.conflicts).toEqual([])
  })

  it('returns empty result when data is null', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const result = await checkPersonConflicts(
      'person-1',
      '2026-03-01 10:00:00 Europe/Zurich',
      '2026-03-01 12:00:00 Europe/Zurich'
    )

    expect(result.has_conflicts).toBe(false)
    expect(result.conflicts).toEqual([])
  })

  it('requires veranstaltungen:write permission', async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error('Unauthorized'))

    await expect(
      checkPersonConflicts(
        'person-1',
        '2026-03-01 10:00:00 Europe/Zurich',
        '2026-03-01 12:00:00 Europe/Zurich'
      )
    ).rejects.toThrow('Unauthorized')

    expect(mockRequirePermission).toHaveBeenCalledWith('veranstaltungen:write')
  })
})
