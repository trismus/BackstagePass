'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

export async function updateProfile(displayName: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht angemeldet' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  await logAuditEvent('profile.updated', 'profile', user.id, {
    display_name: displayName,
  })

  revalidatePath('/profile')
  return { success: true }
}

export async function getProfile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// Admin functions
export async function getAllUsers() {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch users:', error)
    return []
  }

  return profiles || []
}

export async function updateUserRole(userId: string, role: 'ADMIN' | 'EDITOR' | 'VIEWER') {
  const supabase = await createClient()

  // Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht angemeldet' }
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'ADMIN') {
    return { error: 'Keine Berechtigung' }
  }

  // Get old role for audit
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', userId)
    .single()

  const oldRole = targetProfile?.role

  // Update role
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  await logAuditEvent('role.assigned', 'profile', userId, {
    old_role: oldRole,
    new_role: role,
    target_email: targetProfile?.email,
  })

  revalidatePath('/admin/users')
  return { success: true }
}
