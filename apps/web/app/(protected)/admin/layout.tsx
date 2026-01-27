import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const profile = await getUserProfile()

  if (!user) {
    redirect('/login')
  }

  // Only admins can access the admin area
  if (profile?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
