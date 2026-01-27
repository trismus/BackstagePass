'use client'

import { useState } from 'react'
import type {
  RolleMitBesetzungen,
  Person,
  BesetzungTyp,
} from '@/lib/supabase/types'
import {
  createBesetzung,
  updateBesetzung,
  deleteBesetzung,
} from '@/lib/actions/besetzungen'
import { RollenTypBadge } from './StatusBadge'
import { BesetzungTypBadge } from './BesetzungTypBadge'

interface BesetzungenListProps {
  rollen: RolleMitBesetzungen[]
  personen: Person[]
  canEdit: boolean
}

const besetzungTypOptions: { value: BesetzungTyp; label: string }[] = [
  { value: 'hauptbesetzung', label: 'Hauptbesetzung' },
  { value: 'zweitbesetzung', label: 'Zweitbesetzung' },
  { value: 'ersatz', label: 'Ersatz' },
]

export function BesetzungenList({
  rollen,
  personen,
  canEdit,
}: BesetzungenListProps) {
  const [expandedRolle, setExpandedRolle] = useState<string | null>(null)
  const [addingToRolle, setAddingToRolle] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newBesetzung, setNewBesetzung] = useState({
    person_id: '',
    typ: 'hauptbesetzung' as BesetzungTyp,
    notizen: '',
  })

  const handleAdd = async (rolleId: string) => {
    if (!newBesetzung.person_id) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await createBesetzung({
        rolle_id: rolleId,
        person_id: newBesetzung.person_id,
        typ: newBesetzung.typ,
        notizen: newBesetzung.notizen || null,
        gueltig_von: null,
        gueltig_bis: null,
      })
      if (result.success) {
        setAddingToRolle(null)
        setNewBesetzung({ person_id: '', typ: 'hauptbesetzung', notizen: '' })
      } else {
        setError(result.error || 'Fehler beim Erstellen')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (besetzungId: string) => {
    if (!confirm('Besetzung wirklich entfernen?')) return
    setIsSubmitting(true)
    try {
      await deleteBesetzung(besetzungId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTyp = async (besetzungId: string, typ: BesetzungTyp) => {
    setIsSubmitting(true)
    try {
      await updateBesetzung(besetzungId, { typ })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Personen die noch nicht für eine bestimmte Rolle besetzt sind
  const getAvailablePersonen = (rolleId: string) => {
    const rolle = rollen.find((r) => r.id === rolleId)
    const besetztIds = rolle?.besetzungen.map((b) => b.person_id) || []
    return personen.filter((p) => !besetztIds.includes(p.id) && p.aktiv)
  }

  // Zähle unbesetzte Rollen
  const unbesetzteCount = rollen.filter(
    (r) => !r.besetzungen.some((b) => b.typ === 'hauptbesetzung')
  ).length

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Besetzung</h2>
        <p className="mt-1 text-sm text-gray-500">
          {rollen.length} Rollen,{' '}
          {unbesetzteCount > 0 && (
            <span className="text-warning-600">
              {unbesetzteCount} unbesetzt
            </span>
          )}
          {unbesetzteCount === 0 && (
            <span className="text-success-600">alle besetzt</span>
          )}
        </p>
      </div>

      {error && (
        <div className="border-error-200 mx-6 mt-4 rounded-lg border bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {rollen.map((rolle) => {
          const isExpanded = expandedRolle === rolle.id
          const isAdding = addingToRolle === rolle.id
          const hauptbesetzung = rolle.besetzungen.find(
            (b) => b.typ === 'hauptbesetzung'
          )
          const hasHauptbesetzung = !!hauptbesetzung

          return (
            <div key={rolle.id} className="px-6 py-4">
              {/* Rolle Header */}
              <div
                className="flex cursor-pointer items-center justify-between"
                onClick={() => setExpandedRolle(isExpanded ? null : rolle.id)}
              >
                <div className="flex items-center gap-3">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg
                      className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {rolle.name}
                      </span>
                      <RollenTypBadge typ={rolle.typ} />
                      {!hasHauptbesetzung && (
                        <span className="rounded bg-warning-50 px-2 py-0.5 text-xs text-warning-600">
                          unbesetzt
                        </span>
                      )}
                    </div>
                    {hauptbesetzung && (
                      <p className="text-sm text-gray-500">
                        {hauptbesetzung.person.vorname}{' '}
                        {hauptbesetzung.person.nachname}
                        {rolle.besetzungen.length > 1 && (
                          <span className="text-gray-400">
                            {' '}
                            +{rolle.besetzungen.length - 1}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {rolle.besetzungen.length} Besetzung
                  {rolle.besetzungen.length !== 1 && 'en'}
                </span>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="ml-8 mt-4 space-y-3">
                  {rolle.besetzungen.map((besetzung) => (
                    <div
                      key={besetzung.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                          {besetzung.person.vorname[0]}
                          {besetzung.person.nachname[0]}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">
                            {besetzung.person.vorname}{' '}
                            {besetzung.person.nachname}
                          </span>
                          <div className="mt-0.5 flex items-center gap-2">
                            <BesetzungTypBadge typ={besetzung.typ} />
                            {besetzung.notizen && (
                              <span className="text-xs text-gray-500">
                                {besetzung.notizen}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <select
                            value={besetzung.typ}
                            onChange={(e) =>
                              handleUpdateTyp(
                                besetzung.id,
                                e.target.value as BesetzungTyp
                              )
                            }
                            disabled={isSubmitting}
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                          >
                            {besetzungTypOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDelete(besetzung.id)}
                            className="hover:text-error-800 text-sm text-error-600"
                          >
                            Entfernen
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Besetzung Form */}
                  {isAdding ? (
                    <div className="space-y-3 rounded-lg bg-blue-50 px-3 py-2">
                      <div className="flex gap-3">
                        <select
                          value={newBesetzung.person_id}
                          onChange={(e) =>
                            setNewBesetzung({
                              ...newBesetzung,
                              person_id: e.target.value,
                            })
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Person auswählen...</option>
                          {getAvailablePersonen(rolle.id).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.vorname} {p.nachname}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newBesetzung.typ}
                          onChange={(e) =>
                            setNewBesetzung({
                              ...newBesetzung,
                              typ: e.target.value as BesetzungTyp,
                            })
                          }
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          {besetzungTypOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Notizen (optional)"
                        value={newBesetzung.notizen}
                        onChange={(e) =>
                          setNewBesetzung({
                            ...newBesetzung,
                            notizen: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAddingToRolle(null)}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={() => handleAdd(rolle.id)}
                          disabled={isSubmitting || !newBesetzung.person_id}
                          className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:bg-gray-400"
                        >
                          {isSubmitting ? 'Speichern...' : 'Hinzufügen'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    canEdit && (
                      <button
                        onClick={() => {
                          setAddingToRolle(rolle.id)
                          setNewBesetzung({
                            person_id: '',
                            typ: 'hauptbesetzung',
                            notizen: '',
                          })
                        }}
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        + Person besetzen
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}

        {rollen.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            Erstelle zuerst Rollen, um Besetzungen vornehmen zu können
          </div>
        )}
      </div>
    </div>
  )
}
