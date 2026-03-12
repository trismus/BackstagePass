'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type { CheckPersonConflictsResult } from '../supabase/types'

export async function checkPersonConflicts(
  personId: string,
  startZeit: string,
  endZeit: string
): Promise<CheckPersonConflictsResult> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('check_person_conflicts', {
    p_person_id: personId,
    p_start_zeit: startZeit,
    p_end_zeit: endZeit,
  })

  if (error) {
    console.error('Error checking person conflicts:', error)
    return { has_conflicts: false, conflicts: [] }
  }

  return (data as unknown as CheckPersonConflictsResult) ?? { has_conflicts: false, conflicts: [] }
}
