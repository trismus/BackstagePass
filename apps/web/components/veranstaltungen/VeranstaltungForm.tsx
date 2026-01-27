'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createVeranstaltung,
  updateVeranstaltung,
  deleteVeranstaltung,
} from '@/lib/actions/veranstaltungen'
import type {
  Veranstaltung,
  VeranstaltungTyp,
  VeranstaltungStatus,
} from '@/lib/supabase/types'

interface VeranstaltungFormProps {
  veranstaltung?: Veranstaltung
  mode: 'create' | 'edit'
  fixedTyp?: VeranstaltungTyp
  returnUrl?: string
}

const typOptions: { value: VeranstaltungTyp; label: string }[] = [
  { value: 'vereinsevent', label: 'Vereinsevent' },
  { value: 'probe', label: 'Probe' },
  { value: 'auffuehrung', label: 'Aufführung' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

const statusOptions: { value: VeranstaltungStatus; label: string }[] = [
  { value: 'geplant', label: 'Geplant' },
  { value: 'bestaetigt', label: 'Bestätigt' },
  { value: 'abgesagt', label: 'Abgesagt' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
]

export function VeranstaltungForm({
  veranstaltung,
  mode,
  fixedTyp,
  returnUrl = '/veranstaltungen',
}: VeranstaltungFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [titel, setTitel] = useState(veranstaltung?.titel || '')
  const [beschreibung, setBeschreibung] = useState(
    veranstaltung?.beschreibung || ''
  )
  const [datum, setDatum] = useState(veranstaltung?.datum || '')
  const [startzeit, setStartzeit] = useState(veranstaltung?.startzeit || '')
  const [endzeit, setEndzeit] = useState(veranstaltung?.endzeit || '')
  const [ort, setOrt] = useState(veranstaltung?.ort || '')
  const [maxTeilnehmer, setMaxTeilnehmer] = useState(
    veranstaltung?.max_teilnehmer?.toString() || ''
  )
  const [wartelisteAktiv, setWartelisteAktiv] = useState(
    veranstaltung?.warteliste_aktiv ?? true
  )
  const [typ, setTyp] = useState<VeranstaltungTyp>(
    fixedTyp || veranstaltung?.typ || 'vereinsevent'
  )
  const [status, setStatus] = useState<VeranstaltungStatus>(
    veranstaltung?.status || 'geplant'
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      titel,
      beschreibung: beschreibung || null,
      datum,
      startzeit: startzeit || null,
      endzeit: endzeit || null,
      ort: ort || null,
      max_teilnehmer: maxTeilnehmer ? parseInt(maxTeilnehmer, 10) : null,
      warteliste_aktiv: wartelisteAktiv,
      organisator_id: null,
      typ,
      status,
    }

    const result =
      mode === 'create'
        ? await createVeranstaltung(data)
        : await updateVeranstaltung(veranstaltung!.id, data)

    if (result.success) {
      router.push(returnUrl as never)
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!veranstaltung) return
    if (!confirm(`"${veranstaltung.titel}" wirklich löschen?`)) return

    setLoading(true)
    const result = await deleteVeranstaltung(veranstaltung.id)

    if (result.success) {
      router.push(returnUrl as never)
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Grunddaten */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Grunddaten</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Titel */}
          <div className="md:col-span-2">
            <label
              htmlFor="titel"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Titel *
            </label>
            <input
              id="titel"
              type="text"
              required
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. Generalversammlung 2026"
            />
          </div>

          {/* Typ */}
          {!fixedTyp && (
            <div>
              <label
                htmlFor="typ"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Typ
              </label>
              <select
                id="typ"
                value={typ}
                onChange={(e) => setTyp(e.target.value as VeranstaltungTyp)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {typOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as VeranstaltungStatus)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Beschreibung */}
          <div className="md:col-span-2">
            <label
              htmlFor="beschreibung"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Beschreibung
            </label>
            <textarea
              id="beschreibung"
              rows={3}
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Datum & Zeit */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Datum & Zeit</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Datum */}
          <div>
            <label
              htmlFor="datum"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Datum *
            </label>
            <input
              id="datum"
              type="date"
              required
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Startzeit */}
          <div>
            <label
              htmlFor="startzeit"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Startzeit
            </label>
            <input
              id="startzeit"
              type="time"
              value={startzeit}
              onChange={(e) => setStartzeit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Endzeit */}
          <div>
            <label
              htmlFor="endzeit"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Endzeit
            </label>
            <input
              id="endzeit"
              type="time"
              value={endzeit}
              onChange={(e) => setEndzeit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ort & Kapazität */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Ort & Kapazität
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Ort */}
          <div>
            <label
              htmlFor="ort"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Ort
            </label>
            <input
              id="ort"
              type="text"
              value={ort}
              onChange={(e) => setOrt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. Vereinslokal"
            />
          </div>

          {/* Max Teilnehmer */}
          <div>
            <label
              htmlFor="maxTeilnehmer"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Max. Teilnehmer
            </label>
            <input
              id="maxTeilnehmer"
              type="number"
              min="1"
              value={maxTeilnehmer}
              onChange={(e) => setMaxTeilnehmer(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Leer = unbegrenzt"
            />
          </div>

          {/* Warteliste */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wartelisteAktiv}
                onChange={(e) => setWartelisteAktiv(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Warteliste aktivieren (wenn max. Teilnehmer erreicht)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Löschen
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(returnUrl as never)}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </form>
  )
}
