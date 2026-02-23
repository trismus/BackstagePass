'use client'

import type { AvailabilityConflict } from '@/lib/actions/mitglieder-integration'

interface AvailabilityConflictBannerProps {
  conflicts: AvailabilityConflict[]
  onDismiss?: () => void
}

const statusLabels: Record<string, string> = {
  nicht_verfuegbar: 'Nicht verfügbar',
  eingeschraenkt: 'Eingeschränkt',
}

const statusColors: Record<string, string> = {
  nicht_verfuegbar: 'bg-red-50 border-red-200 text-red-800',
  eingeschraenkt: 'bg-amber-50 border-amber-200 text-amber-800',
}

export function AvailabilityConflictBanner({
  conflicts,
  onDismiss,
}: AvailabilityConflictBannerProps) {
  if (conflicts.length === 0) return null

  const hasHardConflict = conflicts.some((c) => c.status === 'nicht_verfuegbar')
  const bannerClass = hasHardConflict
    ? 'border-red-200 bg-red-50'
    : 'border-amber-200 bg-amber-50'
  const iconColor = hasHardConflict ? 'text-red-600' : 'text-amber-600'
  const textColor = hasHardConflict ? 'text-red-800' : 'text-amber-800'

  return (
    <div className={`rounded-lg border p-4 ${bannerClass}`}>
      <div className="flex items-start gap-3">
        <svg
          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${iconColor}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <div className="flex-1">
          <h4 className={`text-sm font-semibold ${textColor}`}>
            {hasHardConflict ? 'Verfügbarkeitskonflikt' : 'Eingeschränkte Verfügbarkeit'}
          </h4>
          <ul className="mt-2 space-y-1">
            {conflicts.map((conflict, idx) => (
              <li key={idx} className={`text-sm ${textColor}`}>
                <span className="font-medium">
                  {conflict.vorname} {conflict.nachname}
                </span>
                {' - '}
                <span
                  className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${statusColors[conflict.status] || ''}`}
                >
                  {statusLabels[conflict.status] || conflict.status}
                </span>
                {conflict.grund && (
                  <span className="ml-1 text-xs opacity-75">({conflict.grund})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${textColor} opacity-70 hover:opacity-100`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
