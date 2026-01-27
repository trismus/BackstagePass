import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper'

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
    <AppLayoutWrapper
      userEmail={user.email}
      userRole={userRole}
      displayName={profile?.display_name}
      onLogout={signOut}
    >
      {children}
    </AppLayoutWrapper>
  )
}
