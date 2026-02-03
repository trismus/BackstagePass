'use client'

import { useState } from 'react'
import type { ProduktionStatus } from '@/lib/supabase/types'
import { PRODUKTION_STATUS_LABELS } from '@/lib/supabase/types'
import { updateProduktionStatus } from '@/lib/actions/produktionen'
import { getAllowedTransitions } from '@/lib/produktionen-utils'

interface ProduktionStatusSelectProps {
  produktionId: string
  currentStatus: ProduktionStatus
}

export function ProduktionStatusSelect({
  produktionId,
  currentStatus,
}: ProduktionStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allowedTransitions = getAllowedTransitions(currentStatus)

  if (allowedTransitions.length === 0) {
    return null
  }

  const handleStatusChange = async (newStatus: ProduktionStatus) => {
    setIsUpdating(true)
    setError(null)

    const result = await updateProduktionStatus(produktionId, newStatus)
    if (!result.success) {
      setError(result.error || 'Fehler beim Status-Update')
    }

    setIsUpdating(false)
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {allowedTransitions.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={isUpdating}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            {isUpdating ? '...' : `→ ${PRODUKTION_STATUS_LABELS[status]}`}
          </button>
        ))}
      </div>
    </div>
  )
}
