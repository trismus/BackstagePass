'use client'

import { useState } from 'react'
import type {
  RolleMitBesetzungen,
  RollenTyp,
  BesetzungTyp,
  Person,
} from '@/lib/supabase/types'
import {
  createBesetzung,
  deleteBesetzung,
} from '@/lib/actions/besetzungen'

interface StueckBesetzungenProps {
  stueckId: string
  rollen: RolleMitBesetzungen[]
  personen: Pick<Person, 'id' | 'vorname' | 'nachname'>[]
  canEdit: boolean
}

const rollenTypLabels: Record<RollenTyp, string> = {
  hauptrolle: 'Hauptrollen',
  nebenrolle: 'Nebenrollen',
  ensemble: 'Ensemble',
  statisterie: 'Statisterie',
}

const rollenTypOrder: RollenTyp[] = [
  'hauptrolle',
  'nebenrolle',
  'ensemble',
  'statisterie',
]

const besetzungTypLabels: Record<BesetzungTyp, string> = {
  hauptbesetzung: 'Haupt',
  zweitbesetzung: 'Zweit',
  ersatz: 'Ersatz',
}

const besetzungTypOptions: { value: BesetzungTyp; label: string }[] = [
  { value: 'hauptbesetzung', label: 'Hauptbesetzung' },
  { value: 'zweitbesetzung', label: 'Zweitbesetzung' },
  { value: 'ersatz', label: 'Ersatz' },
]

function getInitials(vorname: string, nachname: string): string {
  return `${vorname.charAt(0)}${nachname.charAt(0)}`.toUpperCase()
}

export function StueckBesetzungen({
  stueckId: _stueckId,
  rollen,
  personen,
  canEdit,
}: StueckBesetzungenProps) {
  const [editingRolleId, setEditingRolleId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [selectedBesetzungTyp, setSelectedBesetzungTyp] =
    useState<BesetzungTyp>('hauptbesetzung')

  const groupedRollen = rollenTypOrder
    .map((typ) => ({
      typ,
      label: rollenTypLabels[typ],
      rollen: rollen.filter((r) => r.typ === typ),
    }))
    .filter((g) => g.rollen.length > 0)

  const totalRollen = rollen.length
  const besetzteRollen = rollen.filter((r) =>
    r.besetzungen.some((b) => b.typ === 'hauptbesetzung')
  ).length

  const handleAssign = async (rolleId: string) => {
    if (!selectedPersonId) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await createBesetzung({
        rolle_id: rolleId,
        person_id: selectedPersonId,
        typ: selectedBesetzungTyp,
        gueltig_von: null,
        gueltig_bis: null,
        notizen: null,
      })
      if (result.success) {
        setEditingRolleId(null)
        setSelectedPersonId('')
        setSelectedBesetzungTyp('hauptbesetzung')
      } else {
        setError(result.error || 'Fehler beim Zuweisen')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (besetzungId: string) => {
    if (!confirm('Besetzung wirklich entfernen?')) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await deleteBesetzung(besetzungId)
      if (!result.success) {
        setError(result.error || 'Fehler beim Entfernen')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Persons already assigned to a role (to filter the dropdown)
  const getAssignedPersonIds = (rolleId: string): Set<string> => {
    const rolle = rollen.find((r) => r.id === rolleId)
    if (!rolle) return new Set()
    return new Set(rolle.besetzungen.map((b) => b.person_id))
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Besetzung</h2>
          <p className="text-sm text-gray-500">
            {besetzteRollen} von {totalRollen} Rollen besetzt
          </p>
        </div>
        {totalRollen > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${totalRollen > 0 ? Math.round((besetzteRollen / totalRollen) * 100) : 0}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {totalRollen > 0
                ? Math.round((besetzteRollen / totalRollen) * 100)
                : 0}
              %
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center justify-between rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-error-500 hover:text-error-700"
          >
            &times;
          </button>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {groupedRollen.map((group) => (
          <div key={group.typ} className="px-6 py-4">
            <h3 className="mb-3 text-sm font-medium text-gray-500">
              {group.label}{' '}
              <span className="text-gray-400">({group.rollen.length})</span>
            </h3>
            <div className="space-y-2">
              {group.rollen.map((rolle) => {
                const haupt = rolle.besetzungen.filter(
                  (b) => b.typ === 'hauptbesetzung'
                )
                const zweit = rolle.besetzungen.filter(
                  (b) => b.typ === 'zweitbesetzung'
                )
                const ersatz = rolle.besetzungen.filter(
                  (b) => b.typ === 'ersatz'
                )
                const isEditing = editingRolleId === rolle.id
                const isOpen = haupt.length === 0

                return (
                  <div key={rolle.id}>
                    <div
                      className={`flex items-center gap-4 rounded-lg px-3 py-2 ${
                        isOpen ? 'bg-warning-50/30' : 'bg-gray-50'
                      } ${canEdit ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                      onClick={() => {
                        if (!canEdit) return
                        if (isEditing) {
                          setEditingRolleId(null)
                        } else {
                          setEditingRolleId(rolle.id)
                          setSelectedPersonId('')
                          setSelectedBesetzungTyp('hauptbesetzung')
                        }
                      }}
                    >
                      {/* Rolle name */}
                      <div className="w-40 shrink-0">
                        <span className="text-sm font-medium text-gray-900">
                          {rolle.name}
                        </span>
                      </div>

                      {/* Hauptbesetzung */}
                      <div className="w-44 shrink-0">
                        {haupt.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {haupt.map((b) => (
                              <PersonBadge
                                key={b.id}
                                vorname={b.person.vorname}
                                nachname={b.person.nachname}
                                label={besetzungTypLabels[b.typ]}
                                showAvatar
                                onRemove={
                                  canEdit
                                    ? (e) => {
                                        e.stopPropagation()
                                        handleRemove(b.id)
                                      }
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs italic text-gray-400">
                            Nicht besetzt
                          </span>
                        )}
                      </div>

                      {/* Zweit-/Ersatzbesetzungen */}
                      <div className="flex-1">
                        {[...zweit, ...ersatz].length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {[...zweit, ...ersatz].map((b) => (
                              <PersonBadge
                                key={b.id}
                                vorname={b.person.vorname}
                                nachname={b.person.nachname}
                                label={besetzungTypLabels[b.typ]}
                                onRemove={
                                  canEdit
                                    ? (e) => {
                                        e.stopPropagation()
                                        handleRemove(b.id)
                                      }
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inline editor */}
                    {isEditing && canEdit && (
                      <div className="ml-3 mt-2 flex items-end gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-gray-500">
                            Person
                          </label>
                          <select
                            value={selectedPersonId}
                            onChange={(e) =>
                              setSelectedPersonId(e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Person wählen...</option>
                            {personen
                              .filter(
                                (p) =>
                                  !getAssignedPersonIds(rolle.id).has(p.id)
                              )
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nachname}, {p.vorname}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">
                            Typ
                          </label>
                          <select
                            value={selectedBesetzungTyp}
                            onChange={(e) =>
                              setSelectedBesetzungTyp(
                                e.target.value as BesetzungTyp
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {besetzungTypOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssign(rolle.id)
                          }}
                          disabled={isSubmitting || !selectedPersonId}
                          className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:bg-gray-400"
                        >
                          {isSubmitting ? 'Speichern...' : 'Zuweisen'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingRolleId(null)
                          }}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Abbrechen
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {rollen.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            Noch keine Rollen erstellt. Erstelle zuerst Rollen, um die
            Besetzung zu verwalten.
          </div>
        )}
      </div>
    </div>
  )
}

interface PersonBadgeProps {
  vorname: string
  nachname: string
  label: string
  showAvatar?: boolean
  onRemove?: (e: React.MouseEvent) => void
}

function PersonBadge({
  vorname,
  nachname,
  label,
  showAvatar,
  onRemove,
}: PersonBadgeProps) {
  return (
    <div className="flex items-center gap-1.5">
      {showAvatar && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
          {getInitials(vorname, nachname)}
        </div>
      )}
      <span className="text-sm text-gray-900">
        {vorname} {nachname}
      </span>
      <span className="text-xs text-gray-400">({label})</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 text-gray-400 hover:text-error-600"
          title="Entfernen"
        >
          &times;
        </button>
      )}
    </div>
  )
}
