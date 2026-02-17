'use client'

import { useState, useMemo, useCallback } from 'react'
import type {
  ZuweisungenPreviewResult,
  ZuweisungVorschlag,
} from '@/lib/supabase/types'
import { ConflictWarning } from '@/components/ui/ConflictWarning'

interface ZuweisungenPreviewDialogProps {
  open: boolean
  onClose: () => void
  produktionId: string
  preview: ZuweisungenPreviewResult
  onConfirm: (
    proposals: { schicht_id: string; person_id: string }[],
    status: 'vorgeschlagen' | 'zugesagt'
  ) => void
  isConfirming: boolean
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return date.toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

type GroupedVorschlaege = {
  veranstaltung_id: string
  titel: string
  datum: string
  vorschlaege: ZuweisungVorschlag[]
}

export function ZuweisungenPreviewDialog({
  open,
  onClose,
  preview,
  onConfirm,
  isConfirming,
}: ZuweisungenPreviewDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const v of preview.vorschlaege) {
      if (!v.bereits_vorhanden) {
        initial.add(v.key)
      }
    }
    return initial
  })

  // Group by veranstaltung
  const grouped = useMemo<GroupedVorschlaege[]>(() => {
    const map = new Map<string, GroupedVorschlaege>()
    for (const v of preview.vorschlaege) {
      if (!map.has(v.veranstaltung_id)) {
        map.set(v.veranstaltung_id, {
          veranstaltung_id: v.veranstaltung_id,
          titel: v.veranstaltung_titel,
          datum: v.veranstaltung_datum,
          vorschlaege: [],
        })
      }
      map.get(v.veranstaltung_id)!.vorschlaege.push(v)
    }
    // Sort by date
    return [...map.values()].sort(
      (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()
    )
  }, [preview.vorschlaege])

  const selectableCount = preview.vorschlaege.filter(
    (v) => !v.bereits_vorhanden
  ).length

  const toggleAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const all = new Set<string>()
        for (const v of preview.vorschlaege) {
          if (!v.bereits_vorhanden) all.add(v.key)
        }
        setSelected(all)
      } else {
        setSelected(new Set())
      }
    },
    [preview.vorschlaege]
  )

  const toggleGroup = useCallback(
    (groupVorschlaege: ZuweisungVorschlag[], checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const v of groupVorschlaege) {
          if (v.bereits_vorhanden) continue
          if (checked) {
            next.add(v.key)
          } else {
            next.delete(v.key)
          }
        }
        return next
      })
    },
    []
  )

  const toggleOne = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const handleConfirm = (status: 'vorgeschlagen' | 'zugesagt') => {
    const proposals = preview.vorschlaege
      .filter((v) => selected.has(v.key))
      .map((v) => ({ schicht_id: v.schicht_id, person_id: v.person_id }))
    onConfirm(proposals, status)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Zuweisungen aus Besetzung generieren
          </h2>
          <div className="mt-2 flex gap-4 text-sm text-gray-600">
            <span>{preview.stats.total_besetzt} Darsteller</span>
            <span>{preview.stats.total_auffuehrungen} Aufführungen</span>
            <span>{preview.stats.total_vorschlaege} Vorschläge</span>
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
        </div>

        {/* Warnings */}
        {(preview.auffuehrungen_ohne_veranstaltung.length > 0 ||
          preview.veranstaltungen_ohne_vorfuehrung.length > 0) && (
          <div className="space-y-2 border-b border-gray-200 px-6 py-3">
            {preview.auffuehrungen_ohne_veranstaltung.length > 0 && (
              <div className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700">
                <strong>
                  {preview.auffuehrungen_ohne_veranstaltung.length} Aufführung
                  {preview.auffuehrungen_ohne_veranstaltung.length !== 1 &&
                    'en'}{' '}
                  ohne Veranstaltung:
                </strong>{' '}
                {preview.auffuehrungen_ohne_veranstaltung
                  .map((a) => `${a.serie_name} (${formatDate(a.datum)})`)
                  .join(', ')}
              </div>
            )}
            {preview.veranstaltungen_ohne_vorfuehrung.length > 0 && (
              <div className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700">
                <strong>
                  {preview.veranstaltungen_ohne_vorfuehrung.length}{' '}
                  Veranstaltung
                  {preview.veranstaltungen_ohne_vorfuehrung.length !== 1 &&
                    'en'}{' '}
                  ohne Vorführungs-Zeitblöcke:
                </strong>{' '}
                {preview.veranstaltungen_ohne_vorfuehrung
                  .map((v) => `${v.titel} (${formatDate(v.datum)})`)
                  .join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {preview.vorschlaege.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              Keine Vorschläge generiert. Prüfe ob Aufführungen mit
              Vorführungs-Zeitblöcken und Schichten existieren.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Global select all */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.size === selectableCount}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Alle auswählen ({selected.size} / {selectableCount})
                </span>
              </label>

              {/* Grouped by veranstaltung */}
              {grouped.map((group) => {
                const selectable = group.vorschlaege.filter(
                  (v) => !v.bereits_vorhanden
                )
                const groupSelected = selectable.filter((v) =>
                  selected.has(v.key)
                ).length

                return (
                  <div
                    key={group.veranstaltung_id}
                    className="rounded-lg border border-gray-200"
                  >
                    {/* Group header */}
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2">
                      <input
                        type="checkbox"
                        checked={
                          selectable.length > 0 &&
                          groupSelected === selectable.length
                        }
                        disabled={selectable.length === 0}
                        onChange={(e) =>
                          toggleGroup(group.vorschlaege, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary-600"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          {group.titel}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {formatDate(group.datum)}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          ({groupSelected}/{selectable.length})
                        </span>
                      </div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-100">
                      {group.vorschlaege.map((v) => (
                        <div
                          key={v.key}
                          className={`flex items-start gap-3 px-4 py-2 ${
                            v.bereits_vorhanden ? 'opacity-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(v.key)}
                            disabled={v.bereits_vorhanden}
                            onChange={() => toggleOne(v.key)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {v.person_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {v.schicht_rolle}
                              </span>
                              {v.zeitblock_name && (
                                <span className="text-xs text-gray-400">
                                  {v.zeitblock_name}
                                </span>
                              )}
                              {v.zeitblock_startzeit && v.zeitblock_endzeit && (
                                <span className="text-xs text-gray-400">
                                  {formatTime(v.zeitblock_startzeit)} –{' '}
                                  {formatTime(v.zeitblock_endzeit)}
                                </span>
                              )}
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
                )
              })}
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
          <div className="flex gap-2">
            <button
              onClick={() => handleConfirm('vorgeschlagen')}
              disabled={isConfirming || selected.size === 0}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isConfirming
                ? 'Speichern...'
                : `Als Vorschlag speichern (${selected.size})`}
            </button>
            <button
              onClick={() => handleConfirm('zugesagt')}
              disabled={isConfirming || selected.size === 0}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
            >
              {isConfirming
                ? 'Speichern...'
                : `Direkt zusagen (${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
