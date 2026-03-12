'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type { EmailLog } from '../supabase/types'

/**
 * Fetch the last 100 email logs, newest first.
 */
export async function getEmailLogs(): Promise<EmailLog[]> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Failed to fetch email logs:', error)
    return []
  }

  return data ?? []
}
