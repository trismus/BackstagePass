'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSchichtSichtbarkeit } from '@/lib/actions/schicht-sichtbarkeit'
import type { SchichtSichtbarkeit } from '@/lib/supabase/types'

interface SichtbarkeitToggleProps {
  schichtId: string
  currentSichtbarkeit: SchichtSichtbarkeit
  disabled?: boolean
}

export function SichtbarkeitToggle({
  schichtId,
  currentSichtbarkeit,
  disabled = false,
}: SichtbarkeitToggleProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPublic = currentSichtbarkeit === 'public'

  const handleToggle = async () => {
    setIsLoading(true)
    setError(null)

    const newSichtbarkeit: SchichtSichtbarkeit = isPublic ? 'intern' : 'public'
    const result = await updateSchichtSichtbarkeit(schichtId, newSichtbarkeit)

    if (!result.success) {
      setError(result.error || 'Fehler')
    }

    setIsLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || isLoading}
      className={`group relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
        isPublic
          ? 'bg-success-100 text-success-700 hover:bg-success-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:cursor-not-allowed disabled:opacity-50`}
      title={isPublic ? 'Öffentlich sichtbar - Klicken zum Ausblenden' : 'Intern - Klicken für öffentlich'}
    >
      {isPublic ? (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}
      <span>{isPublic ? 'Öffentlich' : 'Intern'}</span>

      {error && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-error-600 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
          {error}
        </span>
      )}
    </button>
  )
}
