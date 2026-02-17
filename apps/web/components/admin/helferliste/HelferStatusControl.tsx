'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  publishHelferliste,
  closeHelferliste,
  regeneratePublicToken,
} from '@/lib/actions/helfer-status'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CopyLinkButton } from './CopyLinkButton'
import type { HelferStatus } from '@/lib/supabase/types'

interface HelferStatusControlProps {
  veranstaltungId: string
  currentStatus: HelferStatus | null
  publicToken: string | null
  canEdit: boolean
  isAdmin: boolean
}

export function HelferStatusControl({
  veranstaltungId,
  currentStatus,
  publicToken,
  canEdit,
  isAdmin,
}: HelferStatusControlProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const publicLink = publicToken ? `${baseUrl}/helfer/anmeldung/${publicToken}` : null

  const handlePublish = async () => {
    setIsLoading(true)
    setError(null)

    const result = await publishHelferliste(veranstaltungId)
    if (!result.success) {
      setError(result.error || 'Fehler beim Veröffentlichen')
    }

    setShowPublishDialog(false)
    setIsLoading(false)
    router.refresh()
  }

  const handleClose = async () => {
    setIsLoading(true)
    setError(null)

    const result = await closeHelferliste(veranstaltungId)
    if (!result.success) {
      setError(result.error || 'Fehler beim Abschliessen')
    }

    setShowCloseDialog(false)
    setIsLoading(false)
    router.refresh()
  }

  const handleRegenerate = async () => {
    setIsLoading(true)
    setError(null)

    const result = await regeneratePublicToken(veranstaltungId)
    if (!result.success) {
      setError(result.error || 'Fehler beim Generieren')
    }

    setShowRegenerateDialog(false)
    setIsLoading(false)
    router.refresh()
  }

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'entwurf':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            Entwurf
          </span>
        )
      case 'veroeffentlicht':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-3 py-1 text-sm font-medium text-success-700">
            <span className="h-2 w-2 rounded-full bg-success-500" />
            Veröffentlicht
          </span>
        )
      case 'abgeschlossen':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
            <span className="h-2 w-2 rounded-full bg-primary-500" />
            Abgeschlossen
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500">
            <span className="h-2 w-2 rounded-full bg-gray-300" />
            Nicht gestartet
          </span>
        )
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Helferliste-Status</h3>
          <div className="mt-2">{getStatusBadge()}</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {/* Public Link Section */}
      {currentStatus === 'veroeffentlicht' && publicLink && (
        <div className="mt-4 rounded-lg border border-success-200 bg-success-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-success-800">
                Öffentlicher Anmelde-Link
              </p>
              <p className="mt-1 truncate text-xs text-success-600">{publicLink}</p>
            </div>
            <CopyLinkButton link={publicLink} />
          </div>
          {canEdit && (
            <button
              onClick={() => setShowRegenerateDialog(true)}
              className="mt-3 text-xs text-success-700 underline hover:no-underline"
            >
              Neuen Link generieren (alter wird ungültig)
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {canEdit && (
        <div className="mt-6 flex flex-wrap gap-3">
          {/* Publish Button */}
          {(!currentStatus || currentStatus === 'entwurf') && (
            <button
              onClick={() => setShowPublishDialog(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success-700 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Helferliste veröffentlichen
            </button>
          )}

          {/* Close Button */}
          {currentStatus === 'veroeffentlicht' && (
            <button
              onClick={() => setShowCloseDialog(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Helferliste abschliessen
            </button>
          )}

          {/* Status Info for Closed */}
          {currentStatus === 'abgeschlossen' && (
            <p className="text-sm text-gray-500">
              Die Helferliste ist abgeschlossen. Keine neuen Anmeldungen möglich.
              {isAdmin && ' (Admin: Status kann zurückgesetzt werden)'}
            </p>
          )}
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showPublishDialog}
        title="Helferliste veröffentlichen?"
        description="Der öffentliche Anmelde-Link wird aktiviert. Externe Helfer können sich dann für öffentlich sichtbare Schichten anmelden."
        confirmLabel={isLoading ? 'Wird veröffentlicht...' : 'Veröffentlichen'}
        onConfirm={handlePublish}
        onCancel={() => setShowPublishDialog(false)}
      />

      <ConfirmDialog
        open={showCloseDialog}
        title="Helferliste abschliessen?"
        description="Es sind keine weiteren Anmeldungen möglich (weder intern noch extern). Bestehende Anmeldungen bleiben sichtbar. Dieser Schritt kann nicht rückgängig gemacht werden."
        confirmLabel={isLoading ? 'Wird abgeschlossen...' : 'Abschliessen'}
        variant="danger"
        onConfirm={handleClose}
        onCancel={() => setShowCloseDialog(false)}
      />

      <ConfirmDialog
        open={showRegenerateDialog}
        title="Neuen Link generieren?"
        description="Der alte Link wird ungültig und funktioniert nicht mehr. Personen mit dem alten Link können sich nicht mehr anmelden."
        confirmLabel={isLoading ? 'Wird generiert...' : 'Neuen Link generieren'}
        variant="warning"
        onConfirm={handleRegenerate}
        onCancel={() => setShowRegenerateDialog(false)}
      />
    </div>
  )
}
