import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const profile = await getUserProfile()

  console.warn('[AdminLayout] user:', user?.email)
  console.warn('[AdminLayout] profile:', profile)
  console.warn('[AdminLayout] role:', profile?.role)

  if (!user) {
    redirect('/login')
  }

  // Only admins can access the admin area
  if (profile?.role !== 'ADMIN') {
    console.warn('[AdminLayout] Redirecting - role is not ADMIN:', profile?.role)
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
