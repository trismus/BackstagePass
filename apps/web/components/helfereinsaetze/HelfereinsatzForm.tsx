'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createHelfereinsatz,
  updateHelfereinsatz,
  deleteHelfereinsatz,
} from '@/lib/actions/helfereinsaetze'
import type {
  Helfereinsatz,
  HelfereinsatzStatus,
  Partner,
} from '@/lib/supabase/types'

interface HelfereinsatzFormProps {
  helfereinsatz?: Helfereinsatz
  partner: Partner[]
  mode: 'create' | 'edit'
}

const statusOptions: { value: HelfereinsatzStatus; label: string }[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'bestaetigt', label: 'Bestätigt' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
  { value: 'abgesagt', label: 'Abgesagt' },
]

export function HelfereinsatzForm({
  helfereinsatz,
  partner,
  mode,
}: HelfereinsatzFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [titel, setTitel] = useState(helfereinsatz?.titel || '')
  const [beschreibung, setBeschreibung] = useState(
    helfereinsatz?.beschreibung || ''
  )
  const [partnerId, setPartnerId] = useState(helfereinsatz?.partner_id || '')
  const [datum, setDatum] = useState(helfereinsatz?.datum || '')
  const [startzeit, setStartzeit] = useState(helfereinsatz?.startzeit || '')
  const [endzeit, setEndzeit] = useState(helfereinsatz?.endzeit || '')
  const [ort, setOrt] = useState(helfereinsatz?.ort || '')
  const [stundenlohnVerein, setStundenlohnVerein] = useState(
    helfereinsatz?.stundenlohn_verein?.toString() || ''
  )
  const [status, setStatus] = useState<HelfereinsatzStatus>(
    helfereinsatz?.status || 'offen'
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      titel,
      beschreibung: beschreibung || null,
      partner_id: partnerId || null,
      datum,
      startzeit: startzeit || null,
      endzeit: endzeit || null,
      ort: ort || null,
      stundenlohn_verein: stundenlohnVerein
        ? parseFloat(stundenlohnVerein)
        : null,
      status,
    }

    const result =
      mode === 'create'
        ? await createHelfereinsatz(data)
        : await updateHelfereinsatz(helfereinsatz!.id, data)

    if (result.success) {
      router.push('/helfereinsaetze')
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!helfereinsatz) return
    if (!confirm(`"${helfereinsatz.titel}" wirklich löschen?`)) return

    setLoading(true)
    const result = await deleteHelfereinsatz(helfereinsatz.id)

    if (result.success) {
      router.push('/helfereinsaetze')
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
              placeholder="z.B. Helferteam Dorffest"
            />
          </div>

          {/* Partner */}
          <div>
            <label
              htmlFor="partner"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Partner
            </label>
            <select
              id="partner"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Kein Partner</option>
              {partner.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

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
              onChange={(e) => setStatus(e.target.value as HelfereinsatzStatus)}
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

      {/* Ort & Vergütung */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Ort & Vergütung
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
            />
          </div>

          {/* Stundenlohn Verein */}
          <div>
            <label
              htmlFor="stundenlohn"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Stundenlohn Verein (CHF)
            </label>
            <input
              id="stundenlohn"
              type="number"
              step="0.01"
              min="0"
              value={stundenlohnVerein}
              onChange={(e) => setStundenlohnVerein(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. 25.00"
            />
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
            onClick={() => router.push('/helfereinsaetze')}
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
