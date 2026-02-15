'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createZeitblock,
  updateZeitblock,
  deleteZeitblock,
} from '@/lib/actions/zeitbloecke'
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

export function ZeitblockEditor({
  veranstaltungId,
  zeitbloecke,
  canEdit,
}: ZeitblockEditorProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [startzeit, setStartzeit] = useState('')
  const [endzeit, setEndzeit] = useState('')
  const [typ, setTyp] = useState<ZeitblockTyp>('standard')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editStartzeit, setEditStartzeit] = useState('')
  const [editEndzeit, setEditEndzeit] = useState('')
  const [editTyp, setEditTyp] = useState<ZeitblockTyp>('standard')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  function startEditing(zb: Zeitblock) {
    setEditingId(zb.id)
    setEditName(zb.name)
    setEditStartzeit(zb.startzeit.slice(0, 5))
    setEditEndzeit(zb.endzeit.slice(0, 5))
    setEditTyp(zb.typ)
    setEditError(null)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditError(null)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return

    setEditLoading(true)
    setEditError(null)

    const result = await updateZeitblock(editingId, {
      name: editName,
      startzeit: editStartzeit,
      endzeit: editEndzeit,
      typ: editTyp,
    })

    if (result.success) {
      setEditingId(null)
      router.refresh()
    } else {
      setEditError(result.error || 'Ein Fehler ist aufgetreten')
    }
    setEditLoading(false)
  }

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
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
        <h3 className="font-medium text-gray-900">
          Zeitblöcke ({zeitbloecke.length})
        </h3>
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
        <form onSubmit={handleSubmit} className="border-b bg-blue-50 p-4">
          {error && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <input
                type="time"
                required
                value={startzeit}
                onChange={(e) => setStartzeit(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <input
                type="time"
                required
                value={endzeit}
                onChange={(e) => setEndzeit(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <select
                value={typ}
                onChange={(e) => setTyp(e.target.value as ZeitblockTyp)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {zeitblockTypen.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:bg-blue-400"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-gray-600"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-200">
        {zeitbloecke.map((zb) =>
          editingId === zb.id ? (
            <form
              key={zb.id}
              onSubmit={handleEditSubmit}
              className="bg-blue-50 p-4"
            >
              {editError && (
                <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  {editError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Name *"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Startzeit
                  </label>
                  <input
                    type="time"
                    required
                    value={editStartzeit}
                    onChange={(e) => setEditStartzeit(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Endzeit
                  </label>
                  <input
                    type="time"
                    required
                    value={editEndzeit}
                    onChange={(e) => setEditEndzeit(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={editTyp}
                    onChange={(e) => setEditTyp(e.target.value as ZeitblockTyp)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {zeitblockTypen.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:bg-blue-400"
                >
                  {editLoading ? 'Speichern...' : 'Speichern'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-3 py-1.5 text-sm text-gray-600"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          ) : (
            <div key={zb.id} className="flex items-center justify-between p-4">
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEditing(zb)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(zb.id, zb.name)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Löschen
                  </button>
                </div>
              )}
            </div>
          )
        )}
        {zeitbloecke.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Noch keine Zeitblöcke definiert
          </div>
        )}
      </div>
    </div>
  )
}
