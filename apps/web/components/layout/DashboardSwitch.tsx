'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/supabase/types'

interface DashboardSwitchProps {
  userRole?: UserRole
}

type DashboardView = 'admin' | 'vorstand'

export function DashboardSwitch({ userRole }: DashboardSwitchProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Only show for ADMIN
  if (userRole !== 'ADMIN') {
    return null
  }

  // Determine current view based on pathname
  const currentView: DashboardView = pathname.startsWith('/admin')
    ? 'admin'
    : 'vorstand'

  function handleSwitch(view: DashboardView) {
    if (view === 'admin') {
      router.push('/admin' as never)
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
        onClick={() => handleSwitch('admin')}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          currentView === 'admin'
            ? 'bg-white text-neutral-900 shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        Admin
      </button>
    </div>
  )
}
