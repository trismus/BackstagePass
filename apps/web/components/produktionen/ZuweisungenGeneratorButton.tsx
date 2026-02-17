'use client'

import { useState } from 'react'
import {
  generateZuweisungenPreview,
  confirmZuweisungen,
} from '@/lib/actions/zuweisungen-generator'
import type { ZuweisungenPreviewResult } from '@/lib/supabase/types'
import { ZuweisungenPreviewDialog } from './ZuweisungenPreviewDialog'

interface ZuweisungenGeneratorButtonProps {
  produktionId: string
  hasBesetzteRollen: boolean
  canEdit: boolean
}

export function ZuweisungenGeneratorButton({
  produktionId,
  hasBesetzteRollen,
  canEdit,
}: ZuweisungenGeneratorButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [preview, setPreview] = useState<ZuweisungenPreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    const result = await generateZuweisungenPreview(produktionId)
    if (result.success) {
      setPreview(result.data)
    } else {
      setError(result.error)
    }
    setIsLoading(false)
  }

  const handleConfirm = async (
    proposals: { schicht_id: string; person_id: string }[],
    status: 'vorgeschlagen' | 'zugesagt'
  ) => {
    setIsConfirming(true)
    const result = await confirmZuweisungen(produktionId, proposals, status)
    if (result.success) {
      setPreview(null)
      setSuccessMsg(
        `${result.count} Zuweisung${result.count !== 1 ? 'en' : ''} erstellt`
      )
    } else {
      setError(result.error || 'Fehler beim Speichern')
    }
    setIsConfirming(false)
  }

  const disabled = !hasBesetzteRollen || !canEdit

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={disabled || isLoading}
          title={
            !hasBesetzteRollen
              ? 'Keine besetzten Rollen vorhanden'
              : !canEdit
                ? 'Keine Berechtigung'
                : 'Zuweisungen aus Besetzung generieren'
          }
          className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Generieren...' : 'Zuweisungen generieren'}
        </button>
        {error && (
          <span className="text-sm text-error-600">{error}</span>
        )}
        {successMsg && (
          <span className="text-sm text-green-600">{successMsg}</span>
        )}
      </div>

      {preview && (
        <ZuweisungenPreviewDialog
          open={!!preview}
          onClose={() => setPreview(null)}
          produktionId={produktionId}
          preview={preview}
          onConfirm={handleConfirm}
          isConfirming={isConfirming}
        />
      )}
    </>
  )
}
