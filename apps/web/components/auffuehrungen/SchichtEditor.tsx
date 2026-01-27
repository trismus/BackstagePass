'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSchicht, deleteSchicht } from '@/lib/actions/auffuehrung-schichten'
import type { SchichtMitZeitblock, Zeitblock } from '@/lib/supabase/types'

interface SchichtEditorProps {
  veranstaltungId: string
  schichten: SchichtMitZeitblock[]
  zeitbloecke: Zeitblock[]
  canEdit: boolean
}

export function SchichtEditor({
  veranstaltungId,
  schichten,
  zeitbloecke,
  canEdit,
}: SchichtEditorProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rolle, setRolle] = useState('')
  const [zeitblockId, setZeitblockId] = useState('')
  const [anzahlBenoetigt, setAnzahlBenoetigt] = useState('1')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createSchicht({
      veranstaltung_id: veranstaltungId,
      zeitblock_id: zeitblockId || null,
      rolle,
      anzahl_benoetigt: parseInt(anzahlBenoetigt, 10) || 1,
    })

    if (result.success) {
      setRolle('')
      setZeitblockId('')
      setAnzahlBenoetigt('1')
      setShowForm(false)
      router.refresh()
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
    }
    setLoading(false)
  }

  async function handleDelete(id: string, rolle: string) {
    if (!confirm(`Schicht "${rolle}" wirklich löschen?`)) return

    const result = await deleteSchicht(id)
    if (result.success) {
      router.refresh()
    }
  }

  // Group schichten by zeitblock
  const groupedSchichten = schichten.reduce(
    (acc, s) => {
      const key = s.zeitblock_id || 'no-zeitblock'
      if (!acc[key]) acc[key] = []
      acc[key].push(s)
      return acc
    },
    {} as Record<string, SchichtMitZeitblock[]>
  )

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Schichten ({schichten.length})</h3>
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
                placeholder="Rolle (z.B. Kasse, Einlass, Technik) *"
                required
                value={rolle}
                onChange={(e) => setRolle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <select
                value={zeitblockId}
                onChange={(e) => setZeitblockId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Kein Zeitblock</option>
                {zeitbloecke.map((zb) => (
                  <option key={zb.id} value={zb.id}>
                    {zb.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="number"
                min="1"
                placeholder="Anzahl benötigt"
                value={anzahlBenoetigt}
                onChange={(e) => setAnzahlBenoetigt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
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

      <div>
        {/* Schichten without zeitblock */}
        {groupedSchichten['no-zeitblock'] && (
          <div className="border-b">
            <div className="px-4 py-2 bg-gray-100 text-sm text-gray-600">
              Ohne Zeitblock
            </div>
            <div className="divide-y divide-gray-100">
              {groupedSchichten['no-zeitblock'].map((s) => (
                <div key={s.id} className="p-4 flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-900">{s.rolle}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({s.anzahl_benoetigt} benötigt)
                    </span>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(s.id, s.rolle)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schichten grouped by zeitblock */}
        {zeitbloecke.map((zb) => {
          const zbSchichten = groupedSchichten[zb.id]
          if (!zbSchichten || zbSchichten.length === 0) return null

          return (
            <div key={zb.id} className="border-b last:border-b-0">
              <div className="px-4 py-2 bg-gray-100 text-sm text-gray-600">
                {zb.name} ({zb.startzeit.slice(0, 5)} - {zb.endzeit.slice(0, 5)})
              </div>
              <div className="divide-y divide-gray-100">
                {zbSchichten.map((s) => (
                  <div key={s.id} className="p-4 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900">{s.rolle}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({s.anzahl_benoetigt} benötigt)
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(s.id, s.rolle)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {schichten.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Noch keine Schichten definiert
          </div>
        )}
      </div>
    </div>
  )
}
