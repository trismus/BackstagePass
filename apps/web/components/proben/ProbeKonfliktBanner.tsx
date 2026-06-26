'use client'

import { useState } from 'react'
import type { ProbePersonKonflikt } from '@/lib/actions/proben'
import type { PersonConflict, PersonConflictType } from '@/lib/supabase/types'

interface ProbeKonfliktBannerProps {
  personenMitKonflikten: ProbePersonKonflikt[]
  totalGeprueft: number
  totalKonflikte: number
  zeitfensterUnklar: boolean
  isLoading?: boolean
  variant?: 'compact' | 'prominent'
  /** When the number of conflicting persons exceeds this threshold, the list
   *  starts collapsed. Default 5. */
  collapsibleAfter?: number
}

const TYPE_LABELS: Record<PersonConflictType, string> = {
  verfuegbarkeit: 'Nicht verfügbar',
  zuweisung: 'Aufführungs-Schicht',
  anmeldung: 'Veranstaltung',
  probe: 'Andere Probe',
  helfer: 'Helfereinsatz',
}

const TYPE_SHORT: Record<PersonConflictType, string> = {
  verfuegbarkeit: 'Verfügbarkeit',
  zuweisung: 'Aufführung',
  anmeldung: 'Veranstaltung',
  probe: 'Probe',
  helfer: 'Helfer',
}

function formatTimeRange(start: string, end: string): string {
  try {
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return ''

    const startStr = startDate.toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    const endStr = endDate.toLocaleString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${startStr}–${endStr}`
  } catch {
    return ''
  }
}

function ConflictLine({ conflict }: { conflict: PersonConflict }) {
  const label = TYPE_SHORT[conflict.type] ?? conflict.type
  const range = formatTimeRange(conflict.start_time, conflict.end_time)
  const isUnavailable =
    conflict.type === 'verfuegbarkeit' && conflict.severity === 'nicht_verfuegbar'
  return (
    <span className="block text-sm text-warning-800">
      <span className="font-medium">{label}:</span>{' '}
      <span>{conflict.description}</span>
      {range && <span className="ml-1 text-warning-700">({range})</span>}
      {isUnavailable && (
        <span className="ml-1 rounded bg-warning-200 px-1.5 text-xs font-medium text-warning-900">
          nicht verfügbar
        </span>
      )}
    </span>
  )
}

export function ProbeKonfliktBanner({
  personenMitKonflikten,
  totalGeprueft,
  totalKonflikte,
  zeitfensterUnklar,
  isLoading,
  variant = 'compact',
  collapsibleAfter = 5,
}: ProbeKonfliktBannerProps) {
  const personenCount = personenMitKonflikten.length
  const shouldCollapse = personenCount > collapsibleAfter
  const [expanded, setExpanded] = useState(!shouldCollapse)

  if (isLoading) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600"
        data-testid="probe-konflikt-banner-loading"
      >
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Konflikte werden geprüft…
      </div>
    )
  }

  if (personenCount === 0) {
    if (totalGeprueft === 0) return null
    return (
      <div
        className="flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-800"
        data-testid="probe-konflikt-banner-clean"
      >
        <svg
          className="h-5 w-5 text-success-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>
          Keine Konflikte für die {totalGeprueft} betroffene
          {totalGeprueft === 1 ? '' : 'n'} Person
          {totalGeprueft === 1 ? '' : 'en'}.
        </span>
      </div>
    )
  }

  const isProminent = variant === 'prominent'
  const containerClasses = isProminent
    ? 'rounded-lg border-2 border-warning-300 bg-warning-50 p-5 shadow-sm'
    : 'rounded-lg border border-warning-200 bg-warning-50 p-4'
  const titleClasses = isProminent
    ? 'text-base font-semibold text-warning-900'
    : 'text-sm font-semibold text-warning-900'

  return (
    <section
      className={containerClasses}
      data-testid="probe-konflikt-banner"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <svg
          className={`mt-0.5 shrink-0 text-warning-600 ${
            isProminent ? 'h-6 w-6' : 'h-5 w-5'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h3 className={titleClasses}>
                {personenCount} Person
                {personenCount === 1 ? '' : 'en'} mit Konflikten
              </h3>
              <p className="mt-0.5 text-xs text-warning-700">
                {totalKonflikte} Konflikt
                {totalKonflikte === 1 ? '' : 'e'} insgesamt, geprüft gegen{' '}
                {totalGeprueft} betroffene Person
                {totalGeprueft === 1 ? '' : 'en'}
                {zeitfensterUnklar && (
                  <span className="ml-1 italic">
                    · Zeit unklar — auf Tagesbasis geprüft
                  </span>
                )}
              </p>
            </div>
            {shouldCollapse && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="rounded border border-warning-300 bg-white px-2 py-1 text-xs font-medium text-warning-800 hover:bg-warning-100"
                aria-expanded={expanded}
              >
                {expanded ? 'Einklappen' : 'Alle anzeigen'}
              </button>
            )}
          </div>

          {expanded && (
            <ul className="mt-3 space-y-3" data-testid="probe-konflikt-list">
              {personenMitKonflikten.map((person) => (
                <li
                  key={person.personId}
                  className="rounded-md border border-warning-200 bg-white/60 p-3"
                >
                  <div className="font-medium text-warning-900">
                    {person.personName}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {person.conflicts.map((c) => (
                      <ConflictLine
                        key={`${c.type}-${c.reference_id}`}
                        conflict={c}
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!expanded && shouldCollapse && (
            <p className="mt-2 text-xs italic text-warning-700">
              {personenCount} Personen — klicke „Alle anzeigen“ für Details.
            </p>
          )}

          <p className="mt-3 text-xs text-warning-700">
            Hinweis: Die Probe kann trotz Konflikten gespeichert werden — die
            Warnung dient nur der Information.
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * Helper: produce a stable type list for tests / parents that want to group
 * conflicts by type rather than by person. Pure function, no React state.
 */
export function groupConflictsByType(
  personenMitKonflikten: ProbePersonKonflikt[]
): Record<PersonConflictType, { personName: string; conflict: PersonConflict }[]> {
  const out = {
    verfuegbarkeit: [],
    zuweisung: [],
    anmeldung: [],
    probe: [],
    helfer: [],
  } as Record<PersonConflictType, { personName: string; conflict: PersonConflict }[]>
  for (const p of personenMitKonflikten) {
    for (const c of p.conflicts) {
      const bucket = out[c.type]
      if (bucket) {
        bucket.push({ personName: p.personName, conflict: c })
      }
    }
  }
  return out
}

// Re-export TYPE_LABELS for tests/integrations
export { TYPE_LABELS as KONFLIKT_TYPE_LABELS }
