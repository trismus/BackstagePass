'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  registerForSlot,
  unregisterFromSlot,
} from '@/lib/actions/helfer-anmeldung'
import type { HelferlisteData } from '@/lib/actions/helfer-anmeldung'
import { ZeitblockCard } from './ZeitblockCard'
import { InfoBlockCard } from './InfoBlockCard'

interface HelferlisteViewProps {
  data: HelferlisteData
  canRegister: boolean
  canEdit?: boolean
}

type OptimisticAction =
  | { type: 'register'; schichtId: string }
  | { type: 'unregister'; schichtId: string }

export function HelferlisteView({ data, canRegister, canEdit = false }: HelferlisteViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Optimistic state for eigeneAnmeldungen
  const [optimisticAnmeldungen, addOptimisticAction] = useOptimistic(
    data.eigeneAnmeldungen,
    (state: string[], action: OptimisticAction) => {
      if (action.type === 'register') {
        return [...state, action.schichtId]
      } else {
        return state.filter((id) => id !== action.schichtId)
      }
    }
  )

  const handleRegister = async (schichtId: string) => {
    setError(null)
    setSuccessMessage(null)

    // Find rolle name for success message
    const schicht = data.zeitbloecke
      .flatMap((zb) => zb.schichten)
      .find((s) => s.id === schichtId)

    startTransition(async () => {
      // Optimistic update
      addOptimisticAction({ type: 'register', schichtId })

      const result = await registerForSlot(schichtId)

      if (!result.success) {
        setError(result.error || 'Fehler bei der Anmeldung')
      } else {
        setSuccessMessage(`Du bist angemeldet für "${schicht?.rolle || 'Schicht'}"`)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      }

      router.refresh()
    })
  }

  const handleUnregister = async (schichtId: string) => {
    setError(null)
    setSuccessMessage(null)

    startTransition(async () => {
      // Optimistic update
      addOptimisticAction({ type: 'unregister', schichtId })

      const result = await unregisterFromSlot(schichtId)

      if (!result.success) {
        setError(result.error || 'Fehler beim Abmelden')
      } else {
        setSuccessMessage('Du hast dich erfolgreich abgemeldet')
        setTimeout(() => setSuccessMessage(null), 3000)
      }

      router.refresh()
    })
  }

  // Sort info_bloecke by startzeit
  const sortedInfoBloecke = [...data.infoBloecke].sort((a, b) =>
    a.startzeit.localeCompare(b.startzeit)
  )

  // Count total registrations
  const totalSchichten = data.zeitbloecke.reduce(
    (sum, zb) => sum + zb.schichten.length,
    0
  )
  const eigeneCount = optimisticAnmeldungen.length

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      {canRegister && (
        <div className="rounded-lg bg-primary-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-primary-900">
                Deine Anmeldungen: {eigeneCount}
              </p>
              <p className="text-sm text-primary-700">
                {totalSchichten} Schichten verfuegbar
              </p>
            </div>
            {eigeneCount > 0 && (
              <span className="rounded-full bg-success-100 px-3 py-1 text-sm font-medium text-success-700">
                {eigeneCount} Schicht{eigeneCount > 1 ? 'en' : ''} zugesagt
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-error-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-error-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-success-200 bg-success-50 p-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-success-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm text-success-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Info Bloecke */}
      {sortedInfoBloecke.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Informationen</h2>
          {sortedInfoBloecke.map((infoBlock) => (
            <InfoBlockCard key={infoBlock.id} infoBlock={infoBlock} />
          ))}
        </div>
      )}

      {/* Zeitbloecke with Schichten */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Schichten</h2>
        {data.zeitbloecke.length === 0 ? (
          <div className="rounded-lg bg-neutral-100 p-8 text-center">
            <p className="text-neutral-600">
              Fuer diese Auffuehrung wurden noch keine Schichten erstellt.
            </p>
          </div>
        ) : (
          data.zeitbloecke
            .filter((zb) => zb.schichten.length > 0 || zb.id !== 'no-zeitblock')
            .map((zeitblock) => (
              <ZeitblockCard
                key={zeitblock.id}
                zeitblock={zeitblock}
                eigeneAnmeldungen={optimisticAnmeldungen}
                isLoading={isPending}
                onRegister={canRegister ? handleRegister : () => {}}
                onUnregister={canRegister ? handleUnregister : () => {}}
                canEdit={canEdit}
              />
            ))
        )}
      </div>

      {/* Permission Notice */}
      {!canRegister && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-4">
          <p className="text-sm text-warning-700">
            Du hast keine Berechtigung, dich fuer Schichten anzumelden.
            Bitte wende dich an den Vorstand.
          </p>
        </div>
      )}
    </div>
  )
}
