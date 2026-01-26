import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/auth/LogoutButton'

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

  const isAdmin = profile?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
                BackstagePass
              </span>
            </Link>
            <nav className="hidden items-center gap-6 sm:flex">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                Dashboard
              </Link>
              <Link
                href="/mitglieder"
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                Mitglieder
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/admin/users"
                    className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    Benutzer
                  </Link>
                  <Link
                    href="/admin/audit"
                    className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    Audit Log
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="hidden text-sm text-neutral-600 hover:text-neutral-900 sm:inline"
            >
              {user.email}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
