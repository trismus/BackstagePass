'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createRessource,
  updateRessource,
  deleteRessource,
} from '@/lib/actions/ressourcen'
import type { Ressource, RessourceKategorie } from '@/lib/supabase/types'

interface RessourceFormProps {
  ressource?: Ressource
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

const kategorien: { value: RessourceKategorie; label: string }[] = [
  { value: 'licht', label: 'Licht' },
  { value: 'ton', label: 'Ton' },
  { value: 'requisite', label: 'Requisite' },
  { value: 'kostuem', label: 'Kostüm' },
  { value: 'buehne', label: 'Bühne' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

export function RessourceForm({
  ressource,
  mode,
  onSuccess,
}: RessourceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(ressource?.name || '')
  const [kategorie, setKategorie] = useState<RessourceKategorie | ''>(
    ressource?.kategorie || ''
  )
  const [menge, setMenge] = useState(ressource?.menge?.toString() || '1')
  const [beschreibung, setBeschreibung] = useState(
    ressource?.beschreibung || ''
  )
  const [aktiv, setAktiv] = useState(ressource?.aktiv ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      name,
      kategorie: kategorie || null,
      menge: parseInt(menge, 10) || 1,
      beschreibung: beschreibung || null,
      aktiv,
    }

    const result =
      mode === 'create'
        ? await createRessource(data)
        : await updateRessource(ressource!.id, data)

    if (result.success) {
      if (mode === 'create') {
        setName('')
        setKategorie('')
        setMenge('1')
        setBeschreibung('')
      }
      if (onSuccess) {
        onSuccess()
      }
      router.push('/ressourcen')
      router.refresh()
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!ressource) return
    if (!confirm(`"${ressource.name}" wirklich löschen?`)) return

    setLoading(true)
    const result = await deleteRessource(ressource.id)

    if (result.success) {
      router.push('/ressourcen')
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

      {/* Kategorie */}
      <div>
        <label
          htmlFor="kategorie"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Kategorie
        </label>
        <select
          id="kategorie"
          value={kategorie}
          onChange={(e) =>
            setKategorie(e.target.value as RessourceKategorie | '')
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Auswählen --</option>
          {kategorien.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>

      {/* Menge */}
      <div>
        <label
          htmlFor="menge"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Menge (Stück)
        </label>
        <input
          id="menge"
          type="number"
          min="1"
          value={menge}
          onChange={(e) => setMenge(e.target.value)}
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
