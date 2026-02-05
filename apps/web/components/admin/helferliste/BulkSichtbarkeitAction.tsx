'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setAllSchichtenSichtbarkeit } from '@/lib/actions/schicht-sichtbarkeit'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { SchichtSichtbarkeit } from '@/lib/supabase/types'

interface BulkSichtbarkeitActionProps {
  veranstaltungId: string
  stats: {
    intern: number
    public: number
    total: number
  }
  disabled?: boolean
}

export function BulkSichtbarkeitAction({
  veranstaltungId,
  stats,
  disabled = false,
}: BulkSichtbarkeitActionProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState<SchichtSichtbarkeit | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBulkUpdate = async (sichtbarkeit: SchichtSichtbarkeit) => {
    setIsLoading(true)
    setError(null)

    const result = await setAllSchichtenSichtbarkeit(veranstaltungId, sichtbarkeit)

    if (!result.success) {
      setError(result.error || 'Fehler beim Aktualisieren')
    }

    setShowDialog(null)
    setIsLoading(false)
    router.refresh()
  }

  if (stats.total === 0) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Sichtbarkeit aller Schichten
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {stats.public} öffentlich, {stats.intern} intern von {stats.total} gesamt
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowDialog('public')}
            disabled={disabled || isLoading || stats.public === stats.total}
            className="inline-flex items-center gap-1 rounded-lg border border-success-300 bg-white px-3 py-1.5 text-xs font-medium text-success-700 transition-colors hover:bg-success-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Alle öffentlich
          </button>
          <button
            onClick={() => setShowDialog('intern')}
            disabled={disabled || isLoading || stats.intern === stats.total}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Alle intern
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-xs text-error-700">
          {error}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showDialog !== null}
        title={
          showDialog === 'public'
            ? 'Alle Schichten öffentlich machen?'
            : 'Alle Schichten intern machen?'
        }
        description={
          showDialog === 'public'
            ? `${stats.total} Schichten werden für externe Helfer sichtbar.`
            : `${stats.total} Schichten werden nur für Mitglieder sichtbar. Bereits angemeldete externe Helfer bleiben angemeldet.`
        }
        confirmLabel={isLoading ? 'Wird aktualisiert...' : 'Anwenden'}
        onConfirm={() => showDialog && handleBulkUpdate(showDialog)}
        onCancel={() => setShowDialog(null)}
      />
    </div>
  )
}
