'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createSchicht,
  updateSchicht,
  deleteSchicht,
} from '@/lib/actions/auffuehrung-schichten'
import type { SchichtMitZeitblock, Zeitblock } from '@/lib/supabase/types'
import { TagInput } from '@/components/ui/TagInput'

const SKILL_SUGGESTIONS = [
  'Licht',
  'Ton',
  'Bühnenbau',
  'Kostüm',
  'Maske',
  'Requisite',
  'Fotografie',
  'Video',
  'Kasse',
  'Einlass',
  'Service',
  'Aufbau',
  'Abbau',
]

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
  const [benoetigteSkills, setBenoetigteSkills] = useState<string[]>([])

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRolle, setEditRolle] = useState('')
  const [editZeitblockId, setEditZeitblockId] = useState('')
  const [editAnzahlBenoetigt, setEditAnzahlBenoetigt] = useState('1')
  const [editBenoetigteSkills, setEditBenoetigteSkills] = useState<string[]>([])
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  function startEditing(s: SchichtMitZeitblock) {
    setEditingId(s.id)
    setEditRolle(s.rolle)
    setEditZeitblockId(s.zeitblock_id || '')
    setEditAnzahlBenoetigt(String(s.anzahl_benoetigt))
    setEditBenoetigteSkills(s.benoetigte_skills ?? [])
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

    const result = await updateSchicht(editingId, {
      rolle: editRolle,
      zeitblock_id: editZeitblockId || null,
      anzahl_benoetigt: parseInt(editAnzahlBenoetigt, 10) || 1,
      benoetigte_skills: editBenoetigteSkills,
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

    const result = await createSchicht({
      veranstaltung_id: veranstaltungId,
      zeitblock_id: zeitblockId || null,
      rolle,
      anzahl_benoetigt: parseInt(anzahlBenoetigt, 10) || 1,
      benoetigte_skills: benoetigteSkills,
    })

    if (result.success) {
      setRolle('')
      setZeitblockId('')
      setAnzahlBenoetigt('1')
      setBenoetigteSkills([])
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

  function renderSchichtRow(s: SchichtMitZeitblock) {
    if (editingId === s.id) {
      return (
        <form
          key={s.id}
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
              <label className="mb-1 block text-xs text-gray-500">Rolle</label>
              <input
                type="text"
                placeholder="Rolle *"
                required
                value={editRolle}
                onChange={(e) => setEditRolle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <TagInput
                label="Benötigte Skills"
                value={editBenoetigteSkills}
                onChange={setEditBenoetigteSkills}
                suggestions={SKILL_SUGGESTIONS}
                placeholder="Skill hinzufügen..."
                maxTags={20}
                maxTagLength={50}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Zeitblock
              </label>
              <select
                value={editZeitblockId}
                onChange={(e) => setEditZeitblockId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
              <label className="mb-1 block text-xs text-gray-500">
                Anzahl benötigt
              </label>
              <input
                type="number"
                min="1"
                value={editAnzahlBenoetigt}
                onChange={(e) => setEditAnzahlBenoetigt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
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
      )
    }

    return (
      <div key={s.id} className="flex items-center justify-between p-4">
        <div>
          <span className="font-medium text-gray-900">{s.rolle}</span>
          <span className="ml-2 text-sm text-gray-500">
            ({s.anzahl_benoetigt} benötigt)
          </span>
          {s.benoetigte_skills && s.benoetigte_skills.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {s.benoetigte_skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => startEditing(s)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Bearbeiten
            </button>
            <button
              onClick={() => handleDelete(s.id, s.rolle)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Löschen
            </button>
          </div>
        )}
      </div>
    )
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
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
        <h3 className="font-medium text-gray-900">
          Schichten ({schichten.length})
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
                placeholder="Rolle (z.B. Kasse, Einlass, Technik) *"
                required
                value={rolle}
                onChange={(e) => setRolle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <TagInput
                label="Benötigte Skills"
                value={benoetigteSkills}
                onChange={setBenoetigteSkills}
                suggestions={SKILL_SUGGESTIONS}
                placeholder="Skill hinzufügen..."
                maxTags={20}
                maxTagLength={50}
              />
            </div>
            <div>
              <select
                value={zeitblockId}
                onChange={(e) => setZeitblockId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
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

      <div>
        {/* Schichten without zeitblock */}
        {groupedSchichten['no-zeitblock'] && (
          <div className="border-b">
            <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600">
              Ohne Zeitblock
            </div>
            <div className="divide-y divide-gray-100">
              {groupedSchichten['no-zeitblock'].map((s) => renderSchichtRow(s))}
            </div>
          </div>
        )}

        {/* Schichten grouped by zeitblock */}
        {zeitbloecke.map((zb) => {
          const zbSchichten = groupedSchichten[zb.id]
          if (!zbSchichten || zbSchichten.length === 0) return null

          return (
            <div key={zb.id} className="border-b last:border-b-0">
              <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600">
                {zb.name} ({zb.startzeit.slice(0, 5)} - {zb.endzeit.slice(0, 5)}
                )
              </div>
              <div className="divide-y divide-gray-100">
                {zbSchichten.map((s) => renderSchichtRow(s))}
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
