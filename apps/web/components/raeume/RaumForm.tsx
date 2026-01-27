'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRaum, updateRaum, deleteRaum } from '@/lib/actions/raeume'
import type { Raum, RaumTyp } from '@/lib/supabase/types'

interface RaumFormProps {
  raum?: Raum
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

const raumTypen: { value: RaumTyp; label: string }[] = [
  { value: 'buehne', label: 'Bühne' },
  { value: 'foyer', label: 'Foyer' },
  { value: 'lager', label: 'Lager' },
  { value: 'garderobe', label: 'Garderobe' },
  { value: 'technik', label: 'Technik' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

export function RaumForm({ raum, mode, onSuccess }: RaumFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(raum?.name || '')
  const [typ, setTyp] = useState<RaumTyp | ''>(raum?.typ || '')
  const [kapazitaet, setKapazitaet] = useState(
    raum?.kapazitaet?.toString() || ''
  )
  const [beschreibung, setBeschreibung] = useState(raum?.beschreibung || '')
  const [aktiv, setAktiv] = useState(raum?.aktiv ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      name,
      typ: typ || null,
      kapazitaet: kapazitaet ? parseInt(kapazitaet, 10) : null,
      beschreibung: beschreibung || null,
      aktiv,
    }

    const result =
      mode === 'create'
        ? await createRaum(data)
        : await updateRaum(raum!.id, data)

    if (result.success) {
      if (mode === 'create') {
        setName('')
        setTyp('')
        setKapazitaet('')
        setBeschreibung('')
      }
      if (onSuccess) {
        onSuccess()
      }
      router.push('/raeume')
      router.refresh()
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!raum) return
    if (!confirm(`"${raum.name}" wirklich löschen?`)) return

    setLoading(true)
    const result = await deleteRaum(raum.id)

    if (result.success) {
      router.push('/raeume')
      router.refresh()
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Typ */}
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
          onChange={(e) => setTyp(e.target.value as RaumTyp | '')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Auswählen --</option>
          {raumTypen.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Kapazität */}
      <div>
        <label
          htmlFor="kapazitaet"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Kapazität (Personen)
        </label>
        <input
          id="kapazitaet"
          type="number"
          min="0"
          value={kapazitaet}
          onChange={(e) => setKapazitaet(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Beschreibung */}
      <div>
        <label
          htmlFor="beschreibung"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          rows={2}
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Aktiv */}
      {mode === 'edit' && (
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={aktiv}
              onChange={(e) => setAktiv(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Aktiv</span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Löschen
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </form>
  )
}
