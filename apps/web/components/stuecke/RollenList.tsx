'use client'

import { useState } from 'react'
import type { StueckRolle, StueckRolleInsert, RollenTyp } from '@/lib/supabase/types'
import { createRolle, updateRolle, deleteRolle } from '@/lib/actions/stuecke'
import { RollenTypBadge } from './StatusBadge'

interface RollenListProps {
  stueckId: string
  rollen: StueckRolle[]
  canEdit: boolean
}

const rollenTypOptions: { value: RollenTyp; label: string }[] = [
  { value: 'hauptrolle', label: 'Hauptrolle' },
  { value: 'nebenrolle', label: 'Nebenrolle' },
  { value: 'ensemble', label: 'Ensemble' },
  { value: 'statisterie', label: 'Statisterie' },
]

export function RollenList({ stueckId, rollen, canEdit }: RollenListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newRolle, setNewRolle] = useState<Partial<StueckRolleInsert>>({
    name: '',
    beschreibung: '',
    typ: 'nebenrolle',
  })

  const handleAdd = async () => {
    if (!newRolle.name) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await createRolle({
        stueck_id: stueckId,
        name: newRolle.name,
        beschreibung: newRolle.beschreibung || null,
        typ: newRolle.typ || 'nebenrolle',
      })
      if (result.success) {
        setIsAdding(false)
        setNewRolle({ name: '', beschreibung: '', typ: 'nebenrolle' })
      } else {
        setError(result.error || 'Fehler beim Erstellen')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (rolle: StueckRolle) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await updateRolle(rolle.id, {
        name: rolle.name,
        beschreibung: rolle.beschreibung,
        typ: rolle.typ,
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
    if (!confirm('Rolle wirklich löschen?')) return
    setIsSubmitting(true)
    try {
      await deleteRolle(id)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Gruppiere Rollen nach Typ
  const groupedRollen = rollen.reduce(
    (acc, rolle) => {
      const group = acc[rolle.typ] || []
      group.push(rolle)
      acc[rolle.typ] = group
      return acc
    },
    {} as Record<RollenTyp, StueckRolle[]>
  )

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Rollen</h2>
        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            + Rolle hinzufügen
          </button>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {rollenTypOptions.map(({ value: typ, label }) => {
          const rollenInGroup = groupedRollen[typ] || []
          if (rollenInGroup.length === 0) return null

          return (
            <div key={typ} className="px-6 py-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">{label}</h3>
              <ul className="space-y-2">
                {rollenInGroup.map((rolle) => (
                  <li key={rolle.id}>
                    {editingId === rolle.id ? (
                      <RolleEditRow
                        rolle={rolle}
                        onSave={handleUpdate}
                        onCancel={() => setEditingId(null)}
                        isSubmitting={isSubmitting}
                      />
                    ) : (
                      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{rolle.name}</span>
                          {rolle.beschreibung && (
                            <p className="text-sm text-gray-500">{rolle.beschreibung}</p>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingId(rolle.id)}
                              className="text-sm text-gray-600 hover:text-gray-900"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => handleDelete(rolle.id)}
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
              </ul>
            </div>
          )
        })}

        {isAdding && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Rollenname"
                  value={newRolle.name}
                  onChange={(e) => setNewRolle({ ...newRolle, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={newRolle.typ}
                  onChange={(e) => setNewRolle({ ...newRolle, typ: e.target.value as RollenTyp })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {rollenTypOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Beschreibung (optional)"
                value={newRolle.beschreibung ?? ''}
                onChange={(e) => setNewRolle({ ...newRolle, beschreibung: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isSubmitting || !newRolle.name}
                  className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg"
                >
                  {isSubmitting ? 'Speichern...' : 'Hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        )}

        {rollen.length === 0 && !isAdding && (
          <div className="px-6 py-8 text-center text-gray-500">
            Noch keine Rollen erstellt
          </div>
        )}
      </div>
    </div>
  )
}

interface RolleEditRowProps {
  rolle: StueckRolle
  onSave: (rolle: StueckRolle) => void
  onCancel: () => void
  isSubmitting: boolean
}

function RolleEditRow({ rolle, onSave, onCancel, isSubmitting }: RolleEditRowProps) {
  const [editData, setEditData] = useState(rolle)

  return (
    <div className="space-y-3 py-2">
      <div className="flex gap-3">
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={editData.typ}
          onChange={(e) => setEditData({ ...editData, typ: e.target.value as RollenTyp })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        >
          {rollenTypOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <input
        type="text"
        placeholder="Beschreibung"
        value={editData.beschreibung ?? ''}
        onChange={(e) => setEditData({ ...editData, beschreibung: e.target.value || null })}
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
      />
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
