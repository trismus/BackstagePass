'use client'

import { useState, useMemo } from 'react'
import { EventGroup } from './EventGroup'
import { OverviewRegistrationForm } from './OverviewRegistrationForm'
import { OverviewSuccessScreen } from './OverviewSuccessScreen'
import type {
  PublicOverviewData,
  MultiRegistrationResult,
} from '@/lib/actions/public-overview'

interface PublicOverviewViewProps {
  data: PublicOverviewData
}

type OverviewState =
  | { type: 'browsing' }
  | { type: 'form'; selectedSchichtIds: string[] }
  | { type: 'success'; results: MultiRegistrationResult }

export function PublicOverviewView({ data }: PublicOverviewViewProps) {
  const [state, setState] = useState<OverviewState>({ type: 'browsing' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Build a map of schichtId -> display name for the success screen
  const schichtNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const event of data.events) {
      for (const zb of event.zeitbloecke) {
        for (const s of zb.schichten) {
          map.set(s.id, `${s.rolle} (${event.veranstaltung.titel})`)
        }
      }
    }
    return map
  }, [data])

  const handleToggleSchicht = (schichtId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(schichtId)) {
        next.delete(schichtId)
      } else {
        next.add(schichtId)
      }
      return next
    })
  }

  const handleProceedToForm = () => {
    setState({
      type: 'form',
      selectedSchichtIds: Array.from(selectedIds),
    })
  }

  const handleSuccess = (results: MultiRegistrationResult) => {
    setState({ type: 'success', results })
    setSelectedIds(new Set())
  }

  const handleBackToBrowsing = () => {
    setState({ type: 'browsing' })
  }

  const handleBrowseMore = () => {
    setState({ type: 'browsing' })
    setSelectedIds(new Set())
  }

  // Success screen
  if (state.type === 'success') {
    return (
      <OverviewSuccessScreen
        results={state.results}
        schichtNames={schichtNames}
        dashboardToken={state.results.dashboardToken}
        onBrowseMore={handleBrowseMore}
      />
    )
  }

  // Form screen
  if (state.type === 'form') {
    return (
      <OverviewRegistrationForm
        selectedSchichtIds={state.selectedSchichtIds}
        data={data}
        onBack={handleBackToBrowsing}
        onSuccess={handleSuccess}
      />
    )
  }

  // Browsing screen
  return (
    <>
      {/* Info Box */}
      <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <svg
              className="h-5 w-5 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-primary-900">
              Wähle deine Schichten aus
            </h3>
            <p className="mt-1 text-sm text-primary-700">
              Du kannst mehrere Schichten aus verschiedenen Veranstaltungen
              auswählen und dich mit einem einzigen Formular für alle anmelden.
            </p>
          </div>
        </div>
      </div>

      {/* Event Cards */}
      <div className="space-y-6">
        {data.events.map((event) => (
          <EventGroup
            key={event.veranstaltung.id}
            event={event}
            selectedSchichtIds={selectedIds}
            onToggleSchicht={handleToggleSchicht}
          />
        ))}
      </div>

      {/* Sticky Footer Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {selectedIds.size}{' '}
              {selectedIds.size === 1 ? 'Schicht' : 'Schichten'} ausgewählt
            </p>
            <button
              onClick={handleProceedToForm}
              className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              Weiter zur Anmeldung
            </button>
          </div>
        </div>
      )}

      {/* Bottom spacer when footer is visible */}
      {selectedIds.size > 0 && <div className="h-20" />}
    </>
  )
}
