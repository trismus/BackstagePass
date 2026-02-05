'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetSchichten } from '@/lib/actions/schicht-generator'
import { Button, ConfirmDialog } from '@/components/ui'

interface SchichtenStatus {
  hasSchichten: boolean
  zeitbloeckeCount: number
  schichtenCount: number
  slotsCount: number
  zugewiesenCount: number
  templateId: string | null
  status: string | null
}

interface SchichtenStatusBannerProps {
  status: SchichtenStatus
  veranstaltungId: string
  isAdmin: boolean
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  entwurf: { label: 'Entwurf', color: 'bg-yellow-100 text-yellow-800' },
  veroeffentlicht: { label: 'Veroeffentlicht', color: 'bg-green-100 text-green-800' },
  abgeschlossen: { label: 'Abgeschlossen', color: 'bg-neutral-200 text-neutral-700' },
}

export function SchichtenStatusBanner({ status, veranstaltungId, isAdmin }: SchichtenStatusBannerProps) {
  const router = useRouter()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    setIsResetting(true)
    setError(null)

    try {
      const result = await resetSchichten(veranstaltungId)

      if (!result.success) {
        setError(result.error ?? 'Fehler beim Zuruecksetzen')
        setShowResetConfirm(false)
        return
      }

      setShowResetConfirm(false)
      router.refresh()
    } catch (err) {
      console.error('Error resetting schichten:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
      setShowResetConfirm(false)
    } finally {
      setIsResetting(false)
    }
  }

  if (!status.hasSchichten) {
    return (
      <div className="rounded-lg bg-neutral-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200">
            <svg
              className="h-5 w-5 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-neutral-900">Noch keine Schichten</p>
            <p className="text-sm text-neutral-500">
              Waehlen Sie unten ein Template aus, um Schichten zu generieren.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const statusInfo = status.status ? STATUS_LABELS[status.status] : null
  const filledPercentage = status.slotsCount > 0
    ? Math.round((status.zugewiesenCount / status.slotsCount) * 100)
    : 0

  return (
    <>
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        {error && (
          <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-5 w-5 text-green-600"
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
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-neutral-900">Schichten generiert</p>
                {statusInfo && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500">
                {status.zeitbloeckeCount} Zeitbloecke, {status.schichtenCount} Schichten,{' '}
                {status.zugewiesenCount}/{status.slotsCount} Slots besetzt ({filledPercentage}%)
              </p>
            </div>
          </div>

          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-error-600 hover:text-error-700"
              onClick={() => setShowResetConfirm(true)}
            >
              Zuruecksetzen
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Besetzungsfortschritt</span>
            <span>{filledPercentage}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${filledPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Schichten zuruecksetzen"
        message={`Sind Sie sicher, dass Sie alle ${status.schichtenCount} Schichten und ${status.zugewiesenCount} Zuweisungen loeschen moechten? Diese Aktion kann nicht rueckgaengig gemacht werden.`}
        confirmLabel={isResetting ? 'Zuruecksetzen...' : 'Zuruecksetzen'}
        variant="danger"
      />
    </>
  )
}
