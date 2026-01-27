'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { getStartPageForRole } from '@/lib/navigation'
import type { UserRole } from '@/lib/supabase/types'

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  await logAuditEvent('auth.login')

  // Get user profile to determine role-based redirect
  let startPage = '/dashboard'
  if (authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (profile?.role) {
      startPage = getStartPageForRole(profile.role as UserRole)
    }
  }

  revalidatePath('/', 'layout')
  redirect(startPage)
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
) {
  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Profile is auto-created by database trigger (on_auth_user_created)

  await logAuditEvent('auth.signup')

  // Get user profile to determine role-based redirect
  // New users default to FREUNDE, so they go to /willkommen
  let startPage = '/willkommen'
  if (authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (profile?.role) {
      startPage = getStartPageForRole(profile.role as UserRole)
    }
  }

  revalidatePath('/', 'layout')
  redirect(startPage)
}

export async function signOut() {
  const supabase = await createClient()

  await logAuditEvent('auth.logout')

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPasswordRequest(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=password-updated')
}
