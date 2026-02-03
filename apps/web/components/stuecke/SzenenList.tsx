'use client'

import { useState } from 'react'
import type { Szene, SzeneInsert } from '@/lib/supabase/types'
import {
  createSzene,
  updateSzene,
  deleteSzene,
  getNextSzeneNummer,
  downloadSzene,
} from '@/lib/actions/stuecke'

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
    text: '',
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
        text: newSzene.text || null,
        dauer_minuten: newSzene.dauer_minuten || null,
      })
      if (result.success) {
        setIsAdding(false)
        setNewSzene({ titel: '', beschreibung: '', text: '', dauer_minuten: null })
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
        text: szene.text,
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

  const handleDownload = async (id: string) => {
    try {
      const result = await downloadSzene(id)
      if (result.success && result.content && result.filename) {
        const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        setError(result.error || 'Fehler beim Download')
      }
    } catch {
      setError('Download fehlgeschlagen')
    }
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
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
        <div className="border-error-200 mx-6 mt-4 rounded-lg border bg-error-50 px-4 py-3 text-sm text-error-700">
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
                  <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                    {szene.nummer}
                  </span>
                  <span className="font-medium text-gray-900">
                    {szene.titel}
                  </span>
                  {szene.dauer_minuten && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({szene.dauer_minuten} Min.)
                    </span>
                  )}
                  {szene.beschreibung && (
                    <p className="ml-11 mt-1 text-sm text-gray-500">
                      {szene.beschreibung}
                    </p>
                  )}
                  {szene.text && (
                    <div className="ml-11 mt-2 rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        Szenentext:
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-gray-700">
                        {szene.text}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {szene.text && (
                    <button
                      onClick={() => handleDownload(szene.id)}
                      className="text-sm text-primary-600 hover:text-primary-800"
                      title="Szene herunterladen"
                    >
                      ⬇ Download
                    </button>
                  )}
                  {canEdit && (
                    <>
                      <button
                        onClick={() => setEditingId(szene.id)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(szene.id)}
                        className="hover:text-error-800 text-sm text-error-600"
                      >
                        Löschen
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}

        {isAdding && (
          <li className="bg-gray-50 px-6 py-4">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Szenenname"
                value={newSzene.titel}
                onChange={(e) =>
                  setNewSzene({ ...newSzene, titel: e.target.value })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Dauer (Min.)"
                  value={newSzene.dauer_minuten ?? ''}
                  onChange={(e) =>
                    setNewSzene({
                      ...newSzene,
                      dauer_minuten: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  placeholder="Beschreibung (optional)"
                  value={newSzene.beschreibung ?? ''}
                  onChange={(e) =>
                    setNewSzene({ ...newSzene, beschreibung: e.target.value })
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <textarea
                placeholder="Szenentext / Script (optional)"
                value={newSzene.text ?? ''}
                onChange={(e) =>
                  setNewSzene({ ...newSzene, text: e.target.value })
                }
                rows={6}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
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
                  disabled={isSubmitting || !newSzene.titel}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:bg-gray-400"
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

function SzeneEditRow({
  szene,
  onSave,
  onCancel,
  isSubmitting,
}: SzeneEditRowProps) {
  const [editData, setEditData] = useState(szene)

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={editData.titel}
        onChange={(e) => setEditData({ ...editData, titel: e.target.value })}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
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
          className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
        />
        <input
          type="text"
          placeholder="Beschreibung"
          value={editData.beschreibung ?? ''}
          onChange={(e) =>
            setEditData({ ...editData, beschreibung: e.target.value || null })
          }
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <textarea
        placeholder="Szenentext / Script"
        value={editData.text ?? ''}
        onChange={(e) =>
          setEditData({ ...editData, text: e.target.value || null })
        }
        rows={8}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
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
          className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
