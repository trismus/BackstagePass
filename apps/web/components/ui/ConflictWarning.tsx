'use client'

import type { PersonConflict } from '@/lib/supabase/types'

const TYPE_LABELS: Record<string, string> = {
  verfuegbarkeit: 'Verfuegbarkeit',
  zuweisung: 'Schichtzuweisung',
  anmeldung: 'Veranstaltung',
  probe: 'Probe',
  helfer: 'Helfereinsatz',
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  verfuegbarkeit: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  zuweisung: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  anmeldung: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  probe: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  helfer: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
}

interface ConflictWarningProps {
  conflicts: PersonConflict[]
  isLoading?: boolean
  showOverride?: boolean
  overrideChecked?: boolean
  onOverrideChange?: (checked: boolean) => void
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return date.toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function ConflictWarning({
  conflicts,
  isLoading,
  showOverride,
  overrideChecked,
  onOverrideChange,
}: ConflictWarningProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500">
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Pruefe systemweite Konflikte...
      </div>
    )
  }

  if (conflicts.length === 0) return null

  const grouped = conflicts.reduce<Record<string, PersonConflict[]>>((acc, c) => {
    if (!acc[c.type]) acc[c.type] = []
    acc[c.type].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-red-800">
        Systemweite Konflikte erkannt
      </p>
      {Object.entries(grouped).map(([type, items]) => {
        const colors = TYPE_COLORS[type] || TYPE_COLORS.anmeldung
        const label = TYPE_LABELS[type] || type
        return (
          <div
            key={type}
            className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}
          >
            <p className={`text-sm font-medium ${colors.text}`}>
              {label} ({items.length})
            </p>
            <ul className="mt-1 space-y-1">
              {items.map((c) => (
                <li key={c.reference_id} className={`text-sm ${colors.text}`}>
                  {c.description}
                  {c.severity && (
                    <span className="ml-1 opacity-75">
                      ({c.severity === 'nicht_verfuegbar' ? 'Nicht verfuegbar' : 'Eingeschraenkt'})
                    </span>
                  )}
                  <span className="ml-1 opacity-75">
                    &mdash; {formatTime(c.start_time)} bis {formatTime(c.end_time)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {showOverride && onOverrideChange && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={overrideChecked}
            onChange={(e) => onOverrideChange(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-primary-600"
          />
          <span className="text-sm text-neutral-700">
            Trotzdem zuweisen (Admin-Override)
          </span>
        </label>
      )}
    </div>
  )
}
