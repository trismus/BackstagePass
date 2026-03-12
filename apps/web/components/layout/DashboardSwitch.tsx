'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/supabase/types'

interface DashboardSwitchProps {
  userRole?: UserRole
}

type DashboardView = 'admin' | 'vorstand' | 'mein-bereich'

export function DashboardSwitch({ userRole }: DashboardSwitchProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const isAdmin = userRole === 'ADMIN'
  const isVorstand = userRole === 'VORSTAND'

  // Only show for management roles
  if (!isAdmin && !isVorstand) {
    return null
  }

  // Determine current view based on pathname
  const isMeinBereich =
    pathname === '/dashboard' && searchParams.get('ansicht') === 'mitglied'
  const currentView: DashboardView = isMeinBereich
    ? 'mein-bereich'
    : pathname.startsWith('/admin')
      ? 'admin'
      : 'vorstand'

  function handleSwitch(view: DashboardView) {
    if (view === 'admin') {
      router.push('/admin' as never)
    } else if (view === 'mein-bereich') {
      router.push('/dashboard?ansicht=mitglied' as never)
    } else {
      router.push('/dashboard' as never)
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1">
      <button
        onClick={() => handleSwitch('vorstand')}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          currentView === 'vorstand'
            ? 'bg-white text-neutral-900 shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        Vorstand
      </button>
      <button
        onClick={() => handleSwitch('mein-bereich')}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          currentView === 'mein-bereich'
            ? 'bg-white text-neutral-900 shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        Mein Bereich
      </button>
      {isAdmin && (
        <button
          onClick={() => handleSwitch('admin')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            currentView === 'admin'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Admin
        </button>
      )}
    </div>
  )
}
