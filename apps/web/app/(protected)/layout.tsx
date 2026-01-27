import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { ProtectedLayoutClient } from '@/components/layout'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const profile = await getUserProfile()

  if (!user) {
    redirect('/login')
  }

  const userRole = profile?.role ?? 'FREUNDE'

  return (
    <ProtectedLayoutClient
      userEmail={user.email}
      userRole={userRole}
      displayName={profile?.display_name}
    >
      {children}
    </ProtectedLayoutClient>
  )
}
