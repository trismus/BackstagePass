'use client'

import { useState, useEffect } from 'react'
import type {
  Person,
  BesetzungTyp,
  ProduktionsBesetzungStatus,
  ProduktionsBesetzung,
  StueckRolle,
} from '@/lib/supabase/types'
import {
  createProduktionsBesetzung,
  updateProduktionsBesetzung,
  deleteProduktionsBesetzung,
  getBesetzungsVorschlaege,
} from '@/lib/actions/produktions-besetzungen'
import type { BesetzungsVorschlag } from '@/lib/actions/produktions-besetzungen'
import { BesetzungsStatusBadge } from './BesetzungsStatusBadge'
import { BesetzungsVorschlagList } from './BesetzungsVorschlag'

const typOptions: { value: BesetzungTyp; label: string }[] = [
  { value: 'hauptbesetzung', label: 'Hauptbesetzung' },
  { value: 'zweitbesetzung', label: 'Zweitbesetzung' },
  { value: 'ersatz', label: 'Ersatz' },
]

const statusOptions: {
  value: ProduktionsBesetzungStatus
  label: string
}[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'vorgemerkt', label: 'Vorgemerkt' },
  { value: 'besetzt', label: 'Besetzt' },
  { value: 'abgesagt', label: 'Abgesagt' },
]

interface BesetzungsEditorProps {
  produktionId: string
  rolle: StueckRolle
  besetzungen: (ProduktionsBesetzung & {
    person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'skills'> | null
  })[]
  personen: Pick<Person, 'id' | 'vorname' | 'nachname'>[]
  onClose: () => void
}

export function BesetzungsEditor({
  produktionId,
  rolle,
  besetzungen,
  personen,
  onClose,
}: BesetzungsEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [vorschlaege, setVorschlaege] = useState<BesetzungsVorschlag[]>([])
  const [loadingVorschlaege, setLoadingVorschlaege] = useState(false)

  const [newEntry, setNewEntry] = useState({
    person_id: '',
    typ: 'hauptbesetzung' as BesetzungTyp,
    notizen: '',
  })

  // Load suggestions when editor opens
  useEffect(() => {
    async function load() {
      setLoadingVorschlaege(true)
      const result = await getBesetzungsVorschlaege(produktionId, rolle.id)
      setVorschlaege(result)
      setLoadingVorschlaege(false)
    }
    load()
  }, [produktionId, rolle.id])

  const besetztPersonIds = besetzungen
    .map((b) => b.person_id)
    .filter((id): id is string => id !== null)

  const availablePersonen = personen.filter(
    (p) => !besetztPersonIds.includes(p.id)
  )

  const handleAdd = async () => {
    if (!newEntry.person_id) return
    setIsSubmitting(true)
    setError(null)

    const result = await createProduktionsBesetzung({
      produktion_id: produktionId,
      rolle_id: rolle.id,
      person_id: newEntry.person_id,
      typ: newEntry.typ,
      status: 'vorgemerkt',
      notizen: newEntry.notizen || null,
    })

    if (!result.success) {
      setError(result.error || 'Fehler beim Erstellen')
    } else {
      setShowAddForm(false)
      setNewEntry({ person_id: '', typ: 'hauptbesetzung', notizen: '' })
    }
    setIsSubmitting(false)
  }

  const handleSuggestSelect = async (personId: string) => {
    setIsSubmitting(true)
    setError(null)

    const result = await createProduktionsBesetzung({
      produktion_id: produktionId,
      rolle_id: rolle.id,
      person_id: personId,
      typ: 'hauptbesetzung',
      status: 'vorgemerkt',
      notizen: null,
    })

    if (!result.success) {
      setError(result.error || 'Fehler beim Vormerken')
    }
    setIsSubmitting(false)
  }

  const handleUpdateStatus = async (
    id: string,
    status: ProduktionsBesetzungStatus
  ) => {
    setIsSubmitting(true)
    setError(null)
    const result = await updateProduktionsBesetzung(id, { status })
    if (!result.success) {
      setError(result.error || 'Fehler beim Update')
    }
    setIsSubmitting(false)
  }

  const handleUpdateTyp = async (id: string, typ: BesetzungTyp) => {
    setIsSubmitting(true)
    const result = await updateProduktionsBesetzung(id, { typ })
    if (!result.success) {
      setError(result.error || 'Fehler beim Update')
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Besetzung wirklich entfernen?')) return
    setIsSubmitting(true)
    const result = await deleteProduktionsBesetzung(id)
    if (!result.success) {
      setError(result.error || 'Fehler beim Löschen')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{rolle.name}</h3>
          <p className="text-sm text-gray-500">{rolle.typ}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-error-200 bg-error-50 p-2 text-sm text-error-700">
          {error}
        </div>
      )}

      {/* Existing Besetzungen */}
      <div className="mb-4 space-y-2">
        {besetzungen.length === 0 ? (
          <p className="text-sm text-gray-500">Noch keine Besetzungen.</p>
        ) : (
          besetzungen.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {b.person ? (
                    <span className="text-sm font-medium text-gray-900">
                      {b.person.vorname} {b.person.nachname}
                    </span>
                  ) : (
                    <span className="text-sm italic text-gray-400">
                      Nicht zugewiesen
                    </span>
                  )}
                  <BesetzungsStatusBadge status={b.status} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={b.typ}
                  onChange={(e) =>
                    handleUpdateTyp(b.id, e.target.value as BesetzungTyp)
                  }
                  disabled={isSubmitting}
                  className="rounded border border-gray-300 px-1.5 py-0.5 text-xs"
                >
                  {typOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={b.status}
                  onChange={(e) =>
                    handleUpdateStatus(
                      b.id,
                      e.target.value as ProduktionsBesetzungStatus
                    )
                  }
                  disabled={isSubmitting}
                  className="rounded border border-gray-300 px-1.5 py-0.5 text-xs"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={isSubmitting}
                  className="ml-1 text-xs text-error-600 hover:text-error-800"
                >
                  Entfernen
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Form */}
      {showAddForm ? (
        <div className="mb-4 space-y-2 rounded-lg bg-blue-50 p-3">
          <select
            value={newEntry.person_id}
            onChange={(e) =>
              setNewEntry({ ...newEntry, person_id: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Person auswählen...</option>
            {availablePersonen.map((p) => (
              <option key={p.id} value={p.id}>
                {p.vorname} {p.nachname}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={newEntry.typ}
              onChange={(e) =>
                setNewEntry({
                  ...newEntry,
                  typ: e.target.value as BesetzungTyp,
                })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {typOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Notizen"
              value={newEntry.notizen}
              onChange={(e) =>
                setNewEntry({ ...newEntry, notizen: e.target.value })
              }
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-sm text-gray-600"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAdd}
              disabled={isSubmitting || !newEntry.person_id}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:bg-gray-400"
            >
              {isSubmitting ? '...' : 'Hinzufügen'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mb-4 text-sm text-primary-600 hover:text-primary-800"
        >
          + Person besetzen
        </button>
      )}

      {/* Suggestions */}
      <div className="border-t border-gray-200 pt-3">
        <BesetzungsVorschlagList
          vorschlaege={vorschlaege.filter(
            (v) => !besetztPersonIds.includes(v.person.id)
          )}
          onSelect={handleSuggestSelect}
          isLoading={loadingVorschlaege}
        />
      </div>
    </div>
  )
}
