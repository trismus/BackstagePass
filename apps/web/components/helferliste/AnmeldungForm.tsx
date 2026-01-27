'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { anmelden } from '@/lib/actions/helferliste'

interface AnmeldungFormProps {
  rollenInstanzId: string
}

export function AnmeldungForm({ rollenInstanzId }: AnmeldungFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    const result = await anmelden(rollenInstanzId)
    if (!result.success) {
      setError(result.error || 'Fehler bei der Anmeldung')
      setIsSubmitting(false)
      return
    }

    router.refresh()
    setIsSubmitting(false)
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-error-600">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Anmelden...' : 'Für diese Rolle anmelden'}
      </button>
    </div>
  )
}
