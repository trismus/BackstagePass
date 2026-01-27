'use client'

import { useState } from 'react'
import type { Szene, SzeneInsert } from '@/lib/supabase/types'
import { createSzene, updateSzene, deleteSzene, getNextSzeneNummer } from '@/lib/actions/stuecke'

interface SzenenListProps {
  stueckId: string
  szenen: Szene[]
  canEdit: boolean
}

export function SzenenList({ stueckId, szenen, canEdit }: SzenenListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newSzene, setNewSzene] = useState<Partial<SzeneInsert>>({
    titel: '',
    beschreibung: '',
    dauer_minuten: null,
  })

  const handleAdd = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const nummer = await getNextSzeneNummer(stueckId)
      const result = await createSzene({
        stueck_id: stueckId,
        nummer,
        titel: newSzene.titel || `Szene ${nummer}`,
        beschreibung: newSzene.beschreibung || null,
        dauer_minuten: newSzene.dauer_minuten || null,
      })
      if (result.success) {
        setIsAdding(false)
        setNewSzene({ titel: '', beschreibung: '', dauer_minuten: null })
      } else {
        setError(result.error || 'Fehler beim Erstellen')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (szene: Szene) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await updateSzene(szene.id, {
        titel: szene.titel,
        beschreibung: szene.beschreibung,
        dauer_minuten: szene.dauer_minuten,
      })
      if (result.success) {
        setEditingId(null)
      } else {
        setError(result.error || 'Fehler beim Aktualisieren')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Szene wirklich löschen?')) return
    setIsSubmitting(true)
    try {
      await deleteSzene(id)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Szenen</h2>
        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            + Szene hinzufügen
          </button>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <ul className="divide-y divide-gray-200">
        {szenen.map((szene) => (
          <li key={szene.id} className="px-6 py-4">
            {editingId === szene.id ? (
              <SzeneEditRow
                szene={szene}
                onSave={handleUpdate}
                onCancel={() => setEditingId(null)}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 text-sm font-medium rounded-full mr-3">
                    {szene.nummer}
                  </span>
                  <span className="font-medium text-gray-900">{szene.titel}</span>
                  {szene.dauer_minuten && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({szene.dauer_minuten} Min.)
                    </span>
                  )}
                  {szene.beschreibung && (
                    <p className="text-sm text-gray-500 mt-1 ml-11">{szene.beschreibung}</p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(szene.id)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(szene.id)}
                      className="text-sm text-error-600 hover:text-error-800"
                    >
                      Löschen
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}

        {isAdding && (
          <li className="px-6 py-4 bg-gray-50">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Szenenname"
                value={newSzene.titel}
                onChange={(e) => setNewSzene({ ...newSzene, titel: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Dauer (Min.)"
                  value={newSzene.dauer_minuten ?? ''}
                  onChange={(e) =>
                    setNewSzene({
                      ...newSzene,
                      dauer_minuten: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  placeholder="Beschreibung (optional)"
                  value={newSzene.beschreibung ?? ''}
                  onChange={(e) => setNewSzene({ ...newSzene, beschreibung: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isSubmitting || !newSzene.titel}
                  className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg"
                >
                  {isSubmitting ? 'Speichern...' : 'Hinzufügen'}
                </button>
              </div>
            </div>
          </li>
        )}

        {szenen.length === 0 && !isAdding && (
          <li className="px-6 py-8 text-center text-gray-500">
            Noch keine Szenen erstellt
          </li>
        )}
      </ul>
    </div>
  )
}

interface SzeneEditRowProps {
  szene: Szene
  onSave: (szene: Szene) => void
  onCancel: () => void
  isSubmitting: boolean
}

function SzeneEditRow({ szene, onSave, onCancel, isSubmitting }: SzeneEditRowProps) {
  const [editData, setEditData] = useState(szene)

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={editData.titel}
        onChange={(e) => setEditData({ ...editData, titel: e.target.value })}
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
      />
      <div className="flex gap-3">
        <input
          type="number"
          placeholder="Dauer (Min.)"
          value={editData.dauer_minuten ?? ''}
          onChange={(e) =>
            setEditData({
              ...editData,
              dauer_minuten: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        />
        <input
          type="text"
          placeholder="Beschreibung"
          value={editData.beschreibung ?? ''}
          onChange={(e) => setEditData({ ...editData, beschreibung: e.target.value || null })}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          Abbrechen
        </button>
        <button
          onClick={() => onSave(editData)}
          disabled={isSubmitting}
          className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg"
        >
          {isSubmitting ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
