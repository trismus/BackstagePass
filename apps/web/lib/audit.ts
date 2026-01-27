'use server'

import { createClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.signup'
  | 'profile.updated'
  | 'role.assigned'
  | 'role.removed'
  | 'user.disabled'
  | 'user.enabled'

export interface AuditLogEntry {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export async function logAuditEvent(
  action: AuditAction,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('audit_logs').insert({
    user_id: user?.id,
    user_email: user?.email,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details || {},
  })

  if (error) {
    console.error('Failed to log audit event:', error)
  }
}

export async function getAuditLogs(options?: {
  userId?: string
  action?: string
  entityType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}): Promise<{ data: AuditLogEntry[]; count: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options?.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (options?.action) {
    query = query.eq('action', options.action)
  }

  if (options?.entityType) {
    query = query.eq('entity_type', options.entityType)
  }

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 50) - 1
    )
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Failed to fetch audit logs:', error)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}
