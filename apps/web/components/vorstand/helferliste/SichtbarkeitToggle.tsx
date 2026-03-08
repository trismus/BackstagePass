'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleRolleSichtbarkeit } from '@/lib/actions/helferliste-management'
import type { RollenSichtbarkeit } from '@/lib/supabase/types'

interface SichtbarkeitToggleProps {
  rolleId: string
  sichtbarkeit: RollenSichtbarkeit
}

export function SichtbarkeitToggle({ rolleId, sichtbarkeit }: SichtbarkeitToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isPublic = sichtbarkeit === 'public'

  const handleToggle = async () => {
    setLoading(true)
    const result = await toggleRolleSichtbarkeit(rolleId)
    if (result.success) {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        isPublic
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      } ${loading ? 'opacity-50' : ''}`}
      title={isPublic ? 'Auf intern umschalten' : 'Auf öffentlich umschalten'}
    >
      {loading ? (
        '...'
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isPublic ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            )}
          </svg>
          {isPublic ? 'Öffentlich' : 'Intern'}
        </>
      )}
    </button>
  )
}
