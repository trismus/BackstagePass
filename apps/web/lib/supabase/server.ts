import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from './admin'
import type { Profile } from './types'

type CookieToSet = {
  name: string
  value: string
  options?: CookieOptions
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, onboarding_completed, created_at, updated_at')
    .eq('id', user.id)
    .single()

  // Auto-link profile to personen on first login
  // The DB trigger link_profile_to_person() is a no-op due to nested trigger
  // chain issues with the audit system. We handle linking in app code instead.
  // Uses admin client for both lookup and update because RLS on personen
  // requires profile_id = auth.uid(), which is NULL for unlinked persons.
  if (data && user.email) {
    try {
      const adminClient = createAdminClient()
      const { data: unlinkedPerson } = await adminClient
        .from('personen')
        .select('id')
        .eq('email', user.email)
        .is('profile_id', null)
        .maybeSingle()

      if (unlinkedPerson) {
        await adminClient
          .from('personen')
          .update({
            profile_id: user.id,
            invitation_accepted_at: new Date().toISOString(),
          } as never)
          .eq('id', unlinkedPerson.id)
          .is('profile_id', null)
      }
    } catch {
      // Non-critical: linking will retry on next page load
      console.warn('Failed to auto-link profile to person')
    }
  }

  return data as Profile | null
}
