'use client'

import { useState } from 'react'
import type { ProbeKonflikt } from '@/lib/actions/probenplan'

interface KonfliktAnzeigeProps {
  konflikte: ProbeKonflikt[]
  showDetails?: boolean
}

export function KonfliktAnzeige({
  konflikte,
  showDetails = false,
}: KonfliktAnzeigeProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails)

  if (konflikte.length === 0) return null

  const verfuegbarkeitKonflikte = konflikte.filter(
    (k) => k.konflikt_typ === 'verfuegbarkeit'
  )
  const probeKonflikte = konflikte.filter(
    (k) => k.konflikt_typ === 'andere_probe'
  )

  return (
    <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-warning-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-sm font-medium text-warning-800">
            {konflikte.length} Konflikt{konflikte.length !== 1 && 'e'}
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-warning-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {verfuegbarkeitKonflikte.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase text-warning-700">
                Nicht verfügbar
              </div>
              <ul className="space-y-1">
                {verfuegbarkeitKonflikte.map((k, i) => (
                  <li key={i} className="text-sm text-warning-800">
                    <span className="font-medium">{k.person_name}</span>
                    <span className="text-warning-600">
                      {' '}
                      - {k.konflikt_grund}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {probeKonflikte.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase text-warning-700">
                Andere Proben
              </div>
              <ul className="space-y-1">
                {probeKonflikte.map((k, i) => (
                  <li key={i} className="text-sm text-warning-800">
                    <span className="font-medium">{k.person_name}</span>
                    <span className="text-warning-600">
                      {' '}
                      - {k.konflikt_grund}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Compact badge version for list views
 */
export function KonfliktBadge({ count }: { count: number }) {
  if (count === 0) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-800">
      <svg
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      {count}
    </span>
  )
}
