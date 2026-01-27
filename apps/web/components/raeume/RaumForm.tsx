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
  const [kapazitaet, setKapazitaet] = useState(raum?.kapazitaet?.toString() || '')
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
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Typ */}
      <div>
        <label htmlFor="typ" className="block text-sm font-medium text-gray-700 mb-1">
          Typ
        </label>
        <select
          id="typ"
          value={typ}
          onChange={(e) => setTyp(e.target.value as RaumTyp | '')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <label htmlFor="kapazitaet" className="block text-sm font-medium text-gray-700 mb-1">
          Kapazität (Personen)
        </label>
        <input
          id="kapazitaet"
          type="number"
          min="0"
          value={kapazitaet}
          onChange={(e) => setKapazitaet(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Beschreibung */}
      <div>
        <label htmlFor="beschreibung" className="block text-sm font-medium text-gray-700 mb-1">
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          rows={2}
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-1.5 text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
            >
              Löschen
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors text-sm"
        >
          {loading ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </form>
  )
}
