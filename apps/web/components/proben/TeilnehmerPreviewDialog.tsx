'use client'

import { useState, useMemo, useCallback } from 'react'
import type { TeilnehmerSuggestionResult } from '@/lib/supabase/types'
import { ConflictWarning } from '@/components/ui/ConflictWarning'

interface TeilnehmerPreviewDialogProps {
  open: boolean
  onClose: () => void
  preview: TeilnehmerSuggestionResult
  onConfirm: (personIds: string[]) => void
  isConfirming: boolean
}

export function TeilnehmerPreviewDialog({
  open,
  onClose,
  preview,
  onConfirm,
  isConfirming,
}: TeilnehmerPreviewDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const v of preview.vorschlaege) {
      if (!v.bereits_vorhanden) {
        initial.add(v.person_id)
      }
    }
    return initial
  })

  const selectableVorschlaege = useMemo(
    () => preview.vorschlaege.filter((v) => !v.bereits_vorhanden),
    [preview.vorschlaege]
  )

  const toggleAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const all = new Set<string>()
        for (const v of selectableVorschlaege) {
          all.add(v.person_id)
        }
        setSelected(all)
      } else {
        setSelected(new Set())
      }
    },
    [selectableVorschlaege]
  )

  const toggleOne = useCallback((personId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(personId)) {
        next.delete(personId)
      } else {
        next.add(personId)
      }
      return next
    })
  }, [])

  const handleConfirm = () => {
    onConfirm([...selected])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Teilnehmer aus Besetzung vorschlagen
          </h2>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>{preview.stats.total_vorgeschlagen} Vorschläge</span>
            {preview.stats.total_bereits_vorhanden > 0 && (
              <span className="text-gray-400">
                {preview.stats.total_bereits_vorhanden} bereits vorhanden
              </span>
            )}
            {preview.stats.total_mit_konflikten > 0 && (
              <span className="text-warning-600">
                {preview.stats.total_mit_konflikten} mit Konflikten
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {preview.quelle === 'szenen'
              ? 'Basierend auf zugewiesenen Szenen'
              : 'Basierend auf allen Besetzungen (keine Szenen zugewiesen)'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {preview.vorschlaege.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              Keine Vorschläge gefunden. Prüfe ob Besetzungen für dieses Stück
              existieren.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Select all */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    selectableVorschlaege.length > 0 &&
                    selected.size === selectableVorschlaege.length
                  }
                  onChange={(e) => toggleAll(e.target.checked)}
                  disabled={selectableVorschlaege.length === 0}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Alle auswählen ({selected.size} / {selectableVorschlaege.length})
                </span>
              </label>

              {/* Person list */}
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {preview.vorschlaege.map((v) => (
                  <div
                    key={v.person_id}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      v.bereits_vorhanden ? 'opacity-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(v.person_id)}
                      disabled={v.bereits_vorhanden}
                      onChange={() => toggleOne(v.person_id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {v.person_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {v.rollen.join(', ')}
                        </span>
                        {v.bereits_vorhanden && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                            Bereits vorhanden
                          </span>
                        )}
                      </div>
                      {v.konflikte.length > 0 && (
                        <div className="mt-1">
                          <ConflictWarning conflicts={v.konflikte} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming || selected.size === 0}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
          >
            {isConfirming
              ? 'Einladen...'
              : `Einladen (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}
