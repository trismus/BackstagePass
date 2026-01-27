'use client'

import { useState, useTransition } from 'react'
import type {
  Verfuegbarkeit,
  VerfuegbarkeitStatus,
  WiederholungTyp,
} from '@/lib/supabase/types'
import {
  VERFUEGBARKEIT_STATUS_LABELS,
  WIEDERHOLUNG_TYP_LABELS,
  VERFUEGBARKEIT_GRUND_OPTIONS,
} from '@/lib/supabase/types'
import {
  createVerfuegbarkeit,
  updateVerfuegbarkeit,
  deleteVerfuegbarkeit,
} from '@/lib/actions/verfuegbarkeiten'

interface VerfuegbarkeitFormProps {
  mitgliedId: string
  verfuegbarkeit?: Verfuegbarkeit
  onSuccess?: () => void
  onCancel?: () => void
}

export function VerfuegbarkeitForm({
  mitgliedId,
  verfuegbarkeit,
  onSuccess,
  onCancel,
}: VerfuegbarkeitFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!verfuegbarkeit

  // Form state
  const [datumVon, setDatumVon] = useState(
    verfuegbarkeit?.datum_von || new Date().toISOString().split('T')[0]
  )
  const [datumBis, setDatumBis] = useState(
    verfuegbarkeit?.datum_bis || new Date().toISOString().split('T')[0]
  )
  const [zeitfensterVon, setZeitfensterVon] = useState(
    verfuegbarkeit?.zeitfenster_von || ''
  )
  const [zeitfensterBis, setZeitfensterBis] = useState(
    verfuegbarkeit?.zeitfenster_bis || ''
  )
  const [status, setStatus] = useState<VerfuegbarkeitStatus>(
    verfuegbarkeit?.status || 'nicht_verfuegbar'
  )
  const [wiederholung, setWiederholung] = useState<WiederholungTyp>(
    verfuegbarkeit?.wiederholung || 'keine'
  )
  const [grund, setGrund] = useState(verfuegbarkeit?.grund || '')
  const [notiz, setNotiz] = useState(verfuegbarkeit?.notiz || '')
  const [ganztags, setGanztags] = useState(
    !verfuegbarkeit?.zeitfenster_von && !verfuegbarkeit?.zeitfenster_bis
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const data = {
        mitglied_id: mitgliedId,
        datum_von: datumVon,
        datum_bis: datumBis,
        zeitfenster_von: ganztags ? null : zeitfensterVon || null,
        zeitfenster_bis: ganztags ? null : zeitfensterBis || null,
        status,
        wiederholung,
        grund: grund || null,
        notiz: notiz || null,
      }

      const result = isEditing
        ? await updateVerfuegbarkeit(verfuegbarkeit.id, data)
        : await createVerfuegbarkeit(data)

      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'Ein Fehler ist aufgetreten')
      }
    })
  }

  const handleDelete = () => {
    if (!verfuegbarkeit) return
    if (!confirm('Diesen Eintrag wirklich löschen?')) return

    startTransition(async () => {
      const result = await deleteVerfuegbarkeit(verfuegbarkeit.id)
      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'Fehler beim Löschen')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="datumVon"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Von *
          </label>
          <input
            type="date"
            id="datumVon"
            value={datumVon}
            onChange={(e) => {
              setDatumVon(e.target.value)
              if (e.target.value > datumBis) {
                setDatumBis(e.target.value)
              }
            }}
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="datumBis"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Bis *
          </label>
          <input
            type="date"
            id="datumBis"
            value={datumBis}
            onChange={(e) => setDatumBis(e.target.value)}
            min={datumVon}
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Time Window */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="ganztags"
            checked={ganztags}
            onChange={(e) => setGanztags(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="ganztags" className="text-sm text-neutral-700">
            Ganztägig
          </label>
        </div>

        {!ganztags && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="zeitVon"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Zeit von
              </label>
              <input
                type="time"
                id="zeitVon"
                value={zeitfensterVon}
                onChange={(e) => setZeitfensterVon(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="zeitBis"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Zeit bis
              </label>
              <input
                type="time"
                id="zeitBis"
                value={zeitfensterBis}
                onChange={(e) => setZeitfensterBis(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Status *
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(VERFUEGBARKEIT_STATUS_LABELS) as VerfuegbarkeitStatus[]).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  status === s
                    ? s === 'verfuegbar'
                      ? 'bg-green-600 text-white'
                      : s === 'eingeschraenkt'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-red-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {VERFUEGBARKEIT_STATUS_LABELS[s]}
              </button>
            )
          )}
        </div>
      </div>

      {/* Wiederholung */}
      <div>
        <label
          htmlFor="wiederholung"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Wiederholung
        </label>
        <select
          id="wiederholung"
          value={wiederholung}
          onChange={(e) => setWiederholung(e.target.value as WiederholungTyp)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        >
          {(Object.keys(WIEDERHOLUNG_TYP_LABELS) as WiederholungTyp[]).map(
            (w) => (
              <option key={w} value={w}>
                {WIEDERHOLUNG_TYP_LABELS[w]}
              </option>
            )
          )}
        </select>
      </div>

      {/* Grund */}
      <div>
        <label
          htmlFor="grund"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Grund
        </label>
        <select
          id="grund"
          value={grund}
          onChange={(e) => setGrund(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Optional --</option>
          {VERFUEGBARKEIT_GRUND_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Notiz */}
      <div>
        <label
          htmlFor="notiz"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Notiz
        </label>
        <textarea
          id="notiz"
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          rows={2}
          placeholder="Zusätzliche Informationen..."
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
        <div>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Eintrag löschen
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Abbrechen
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isPending
              ? 'Speichert...'
              : isEditing
                ? 'Aktualisieren'
                : 'Speichern'}
          </button>
        </div>
      </div>
    </form>
  )
}
