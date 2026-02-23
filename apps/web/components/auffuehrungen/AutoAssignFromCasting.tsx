'use client'

import { useState } from 'react'
import { createAssignmentsFromCasting } from '@/lib/actions/mitglieder-integration'
import { AvailabilityConflictBanner } from '@/components/mitglieder/AvailabilityConflictBanner'
import type { ShiftAssignmentResult } from '@/lib/actions/mitglieder-integration'

interface AutoAssignFromCastingProps {
  veranstaltungId: string
}

export function AutoAssignFromCasting({ veranstaltungId }: AutoAssignFromCastingProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checkAvailability, setCheckAvailability] = useState(true)
  const [result, setResult] = useState<ShiftAssignmentResult | null>(null)

  async function handleAutoAssign() {
    setIsLoading(true)
    setResult(null)

    const res = await createAssignmentsFromCasting(veranstaltungId, {
      checkAvailability,
      skipConflicts: false,
    })

    setResult(res)
    setIsLoading(false)

    if (res.success && res.conflicts.length === 0) {
      // Auto-close after success with no conflicts
      setTimeout(() => setIsOpen(false), 2000)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
        Aus Besetzung zuweisen
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Automatisch aus Besetzung zuweisen
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Erstellt automatisch Schicht-Zuweisungen basierend auf den Besetzungen der
              aktiven Stücke. Bereits zugewiesene Personen werden übersprungen.
            </p>

            {/* Options */}
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checkAvailability}
                  onChange={(e) => setCheckAvailability(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Verfügbarkeit prüfen
              </label>
            </div>

            {/* Result */}
            {result && (
              <div className="mt-4 space-y-3">
                {result.success && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {result.created} Zuweisungen erstellt
                    {result.skipped > 0 && `, ${result.skipped} übersprungen`}
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {result.errors.join(', ')}
                  </div>
                )}
                {result.conflicts.length > 0 && (
                  <AvailabilityConflictBanner conflicts={result.conflicts} />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setResult(null)
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Schliessen
              </button>
              <button
                onClick={handleAutoAssign}
                disabled={isLoading}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Wird ausgeführt...' : 'Zuweisen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
