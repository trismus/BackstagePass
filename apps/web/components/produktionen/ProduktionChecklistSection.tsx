'use client'

import { useState } from 'react'
import type {
  ProduktionsChecklistItem,
  ProduktionStatus,
} from '@/lib/supabase/types'
import { PRODUKTION_STATUS_LABELS } from '@/lib/supabase/types'
import {
  initChecklistForProduktion,
  toggleChecklistItem,
  CHECKLIST_PHASES,
} from '@/lib/actions/produktions-checklisten'

interface ProduktionChecklistSectionProps {
  produktionId: string
  currentStatus: ProduktionStatus
  items: ProduktionsChecklistItem[]
  canEdit: boolean
}

function PhaseProgress({
  items,
}: {
  items: ProduktionsChecklistItem[]
}) {
  const total = items.length
  const done = items.filter((i) => i.erledigt).length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  const pflichtTotal = items.filter((i) => i.pflicht).length
  const pflichtDone = items.filter((i) => i.pflicht && i.erledigt).length
  const allPflichtDone = pflichtTotal === pflichtDone

  return (
    <div className="mt-1 flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${
            allPflichtDone ? 'bg-green-500' : 'bg-primary-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-gray-500">
        {done}/{total}
      </span>
    </div>
  )
}

export function ProduktionChecklistSection({
  produktionId,
  currentStatus,
  items,
  canEdit,
}: ProduktionChecklistSectionProps) {
  const [isInitializing, setIsInitializing] = useState(false)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    () => new Set([currentStatus])
  )

  const hasItems = items.length > 0

  // Group by phase
  const grouped = CHECKLIST_PHASES.map((phase) => ({
    phase,
    label: PRODUKTION_STATUS_LABELS[phase],
    items: items.filter((i) => i.phase === phase),
  })).filter((g) => g.items.length > 0)

  // Overall progress
  const totalItems = items.length
  const doneItems = items.filter((i) => i.erledigt).length
  const overallPercent =
    totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  const togglePhase = (phase: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phase)) {
        next.delete(phase)
      } else {
        next.add(phase)
      }
      return next
    })
  }

  const handleInit = async () => {
    if (!confirm('Standard-Checkliste für alle Phasen erstellen?')) return
    setIsInitializing(true)
    setError(null)
    const result = await initChecklistForProduktion(produktionId)
    if (!result.success) {
      setError(result.error || 'Fehler beim Erstellen')
    }
    setIsInitializing(false)
  }

  const handleToggle = async (id: string) => {
    setTogglingIds((prev) => new Set(prev).add(id))
    setError(null)
    const result = await toggleChecklistItem(id)
    if (!result.success) {
      setError(result.error || 'Fehler beim Aktualisieren')
    }
    setTogglingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  // Phase status indicator
  const getPhaseIndicator = (phase: string) => {
    const phaseItems = items.filter((i) => i.phase === phase)
    const pflichtItems = phaseItems.filter((i) => i.pflicht)
    const allDone = phaseItems.every((i) => i.erledigt)
    const allPflichtDone = pflichtItems.every((i) => i.erledigt)
    const noneDone = phaseItems.every((i) => !i.erledigt)

    if (allDone) {
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )
    }
    if (allPflichtDone && !noneDone) {
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )
    }
    if (!noneDone) {
      return (
        <span className="h-2 w-2 rounded-full bg-primary-400" />
      )
    }
    return <span className="h-2 w-2 rounded-full bg-gray-300" />
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Checkliste
            </h2>
            {hasItems && (
              <p className="mt-1 text-sm text-gray-500">
                {doneItems} von {totalItems} Punkten erledigt ({overallPercent}%)
              </p>
            )}
          </div>
          {canEdit && !hasItems && (
            <button
              onClick={handleInit}
              disabled={isInitializing}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
            >
              {isInitializing ? 'Wird erstellt...' : 'Checkliste erstellen'}
            </button>
          )}
        </div>

        {/* Overall Progress */}
        {hasItems && (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Schliessen
          </button>
        </div>
      )}

      {/* Empty */}
      {!hasItems && (
        <div className="px-6 py-8 text-center text-gray-500">
          Noch keine Checkliste vorhanden.
        </div>
      )}

      {/* Phase Groups */}
      {hasItems && (
        <div className="divide-y divide-gray-200">
          {grouped.map((group) => {
            const isExpanded = expandedPhases.has(group.phase)
            const isCurrent = group.phase === currentStatus

            return (
              <div key={group.phase}>
                {/* Phase Header */}
                <button
                  onClick={() => togglePhase(group.phase)}
                  className={`flex w-full items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-gray-50 ${
                    isCurrent ? 'bg-primary-50/50' : ''
                  }`}
                >
                  {getPhaseIndicator(group.phase)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-700">
                        {group.label}
                      </h3>
                      {isCurrent && (
                        <span className="rounded bg-primary-100 px-1.5 py-0.5 text-xs font-medium text-primary-700">
                          Aktuelle Phase
                        </span>
                      )}
                    </div>
                    <PhaseProgress items={group.items} />
                  </div>
                  <svg
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Checklist Items */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-2">
                    {group.items.map((item) => {
                      const isToggling = togglingIds.has(item.id)

                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 rounded-lg px-2 py-2 ${
                            canEdit
                              ? 'cursor-pointer hover:bg-white'
                              : ''
                          } ${isToggling ? 'opacity-50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={item.erledigt}
                            disabled={!canEdit || isToggling}
                            onChange={() => handleToggle(item.id)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
                          />
                          <div className="flex-1">
                            <span
                              className={`text-sm ${
                                item.erledigt
                                  ? 'text-gray-400 line-through'
                                  : 'text-gray-700'
                              }`}
                            >
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                              {item.pflicht && (
                                <span className="text-xs font-medium text-error-600">
                                  Pflicht
                                </span>
                              )}
                              {item.erledigt && item.erledigt_am && (
                                <span className="text-xs text-gray-400">
                                  {new Date(item.erledigt_am).toLocaleDateString(
                                    'de-CH'
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
