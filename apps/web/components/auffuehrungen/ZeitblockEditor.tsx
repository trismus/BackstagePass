'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createZeitblock, deleteZeitblock } from '@/lib/actions/zeitbloecke'
import type { Zeitblock, ZeitblockTyp } from '@/lib/supabase/types'
import { ZeitblockTypBadge } from './ZeitblockTypBadge'

interface ZeitblockEditorProps {
  veranstaltungId: string
  zeitbloecke: Zeitblock[]
  canEdit: boolean
}

const zeitblockTypen: { value: ZeitblockTyp; label: string }[] = [
  { value: 'aufbau', label: 'Aufbau' },
  { value: 'einlass', label: 'Einlass' },
  { value: 'vorfuehrung', label: 'Vorführung' },
  { value: 'pause', label: 'Pause' },
  { value: 'abbau', label: 'Abbau' },
  { value: 'standard', label: 'Standard' },
]

export function ZeitblockEditor({ veranstaltungId, zeitbloecke, canEdit }: ZeitblockEditorProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [startzeit, setStartzeit] = useState('')
  const [endzeit, setEndzeit] = useState('')
  const [typ, setTyp] = useState<ZeitblockTyp>('standard')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createZeitblock({
      veranstaltung_id: veranstaltungId,
      name,
      startzeit,
      endzeit,
      typ,
      sortierung: zeitbloecke.length,
    })

    if (result.success) {
      setName('')
      setStartzeit('')
      setEndzeit('')
      setTyp('standard')
      setShowForm(false)
      router.refresh()
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
    }
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Zeitblock "${name}" wirklich löschen?`)) return

    const result = await deleteZeitblock(id)
    if (result.success) {
      router.refresh()
    }
  }

  const formatTime = (timeStr: string) => timeStr.slice(0, 5)

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Zeitblöcke ({zeitbloecke.length})</h3>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Hinzufügen
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="p-4 border-b bg-blue-50">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Name *"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <input
                type="time"
                required
                value={startzeit}
                onChange={(e) => setStartzeit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <input
                type="time"
                required
                value={endzeit}
                onChange={(e) => setEndzeit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="col-span-2">
              <select
                value={typ}
                onChange={(e) => setTyp(e.target.value as ZeitblockTyp)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {zeitblockTypen.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:bg-blue-400"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-gray-600 text-sm"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-200">
        {zeitbloecke.map((zb) => (
          <div key={zb.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{zb.name}</span>
                <ZeitblockTypBadge typ={zb.typ} />
              </div>
              <span className="text-sm text-gray-500">
                {formatTime(zb.startzeit)} - {formatTime(zb.endzeit)}
              </span>
            </div>
            {canEdit && (
              <button
                onClick={() => handleDelete(zb.id, zb.name)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Löschen
              </button>
            )}
          </div>
        ))}
        {zeitbloecke.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Noch keine Zeitblöcke definiert
          </div>
        )}
      </div>
    </div>
  )
}
