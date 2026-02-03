'use client'

import { useState } from 'react'
import type {
  Person,
  RolleMitProduktionsBesetzungen,
  ProduktionsBesetzungStatus,
  RollenTyp,
} from '@/lib/supabase/types'
import { initBesetzungenFromStueck } from '@/lib/actions/produktions-besetzungen'
import { BesetzungsStatusBadge } from './BesetzungsStatusBadge'
import { BesetzungsEditor } from './BesetzungsEditor'

const ROLLEN_TYP_LABELS: Record<RollenTyp, string> = {
  hauptrolle: 'Hauptrollen',
  nebenrolle: 'Nebenrollen',
  ensemble: 'Ensemble',
  statisterie: 'Statisterie',
}

const ROLLEN_TYP_ORDER: RollenTyp[] = [
  'hauptrolle',
  'nebenrolle',
  'ensemble',
  'statisterie',
]

interface BesetzungsMatrixProps {
  produktionId: string
  stueckId: string
  rollen: RolleMitProduktionsBesetzungen[]
  personen: Pick<Person, 'id' | 'vorname' | 'nachname'>[]
  canEdit: boolean
}

export function BesetzungsMatrix({
  produktionId,
  stueckId,
  rollen,
  personen,
  canEdit,
}: BesetzungsMatrixProps) {
  const [editingRolleId, setEditingRolleId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<
    ProduktionsBesetzungStatus | 'alle'
  >('alle')
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Progress stats
  const totalRollen = rollen.length
  const besetzteRollen = rollen.filter((r) =>
    r.besetzungen.some((b) => b.status === 'besetzt')
  ).length
  const offeneRollen = rollen.filter(
    (r) =>
      r.besetzungen.length === 0 ||
      r.besetzungen.every((b) => b.status === 'offen')
  ).length
  const progressPercent =
    totalRollen > 0 ? Math.round((besetzteRollen / totalRollen) * 100) : 0

  // Group by Rollentyp
  const grouped = ROLLEN_TYP_ORDER.map((typ) => ({
    typ,
    label: ROLLEN_TYP_LABELS[typ],
    rollen: rollen.filter((r) => r.typ === typ),
  })).filter((g) => g.rollen.length > 0)

  // Apply filter
  const filterRollen = (items: RolleMitProduktionsBesetzungen[]) => {
    if (statusFilter === 'alle') return items
    return items.filter((r) =>
      r.besetzungen.some((b) => b.status === statusFilter)
    )
  }

  const handleInit = async () => {
    if (
      !confirm(
        'Rollen aus dem Stück importieren? Bestehende Stück-Besetzungen werden als "Vorgemerkt" übernommen.'
      )
    ) {
      return
    }
    setIsInitializing(true)
    setError(null)
    const result = await initBesetzungenFromStueck(produktionId, stueckId)
    if (!result.success) {
      setError(result.error || 'Fehler beim Importieren')
    }
    setIsInitializing(false)
  }

  // Empty state: no besetzungen yet
  if (rollen.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Besetzung</h2>
        <p className="text-gray-500">
          Dieses Stück hat noch keine Rollen. Erstelle zuerst Rollen im Stück.
        </p>
      </div>
    )
  }

  const hasAnyBesetzungen = rollen.some((r) => r.besetzungen.length > 0)

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Besetzung</h2>
            <p className="mt-1 text-sm text-gray-500">
              {besetzteRollen} von {totalRollen} Rollen besetzt
              {offeneRollen > 0 && (
                <span className="text-warning-600">
                  {' '}
                  ({offeneRollen} offen)
                </span>
              )}
            </p>
          </div>
          {canEdit && !hasAnyBesetzungen && (
            <button
              onClick={handleInit}
              disabled={isInitializing}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
            >
              {isInitializing
                ? 'Importieren...'
                : 'Rollen aus Stück importieren'}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">{progressPercent}%</p>
        </div>

        {/* Filter */}
        {hasAnyBesetzungen && (
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">
              Filter:
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as ProduktionsBesetzungStatus | 'alle'
                )
              }
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="alle">Alle</option>
              <option value="offen">Offen</option>
              <option value="vorgemerkt">Vorgemerkt</option>
              <option value="besetzt">Besetzt</option>
              <option value="abgesagt">Abgesagt</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Schliessen
          </button>
        </div>
      )}

      {/* Matrix */}
      <div className="divide-y divide-gray-200">
        {grouped.map((group) => {
          const filteredRollen = filterRollen(group.rollen)
          if (filteredRollen.length === 0) return null

          return (
            <div key={group.typ}>
              {/* Group Header */}
              <div className="bg-gray-50 px-6 py-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  {group.label}
                  <span className="ml-2 font-normal text-gray-500">
                    ({group.rollen.length})
                  </span>
                </h3>
              </div>

              {/* Roles */}
              {filteredRollen.map((rolle) => {
                const hauptbesetzung = rolle.besetzungen.find(
                  (b) => b.typ === 'hauptbesetzung' && b.person
                )
                const zweitbesetzung = rolle.besetzungen.find(
                  (b) => b.typ === 'zweitbesetzung' && b.person
                )
                const isEditing = editingRolleId === rolle.id
                const isOffen =
                  rolle.besetzungen.length === 0 ||
                  rolle.besetzungen.every(
                    (b) => b.status === 'offen' && !b.person_id
                  )

                return (
                  <div key={rolle.id}>
                    <div
                      className={`flex items-center gap-4 px-6 py-3 ${
                        canEdit
                          ? 'cursor-pointer hover:bg-gray-50'
                          : ''
                      } ${isOffen ? 'bg-warning-50/30' : ''}`}
                      onClick={() =>
                        canEdit &&
                        setEditingRolleId(isEditing ? null : rolle.id)
                      }
                    >
                      {/* Role Name */}
                      <div className="w-40 shrink-0">
                        <span className="text-sm font-medium text-gray-900">
                          {rolle.name}
                        </span>
                      </div>

                      {/* Hauptbesetzung */}
                      <div className="w-44 shrink-0">
                        {hauptbesetzung?.person ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                              {hauptbesetzung.person.vorname[0]}
                              {hauptbesetzung.person.nachname[0]}
                            </div>
                            <span className="text-sm text-gray-900">
                              {hauptbesetzung.person.vorname}{' '}
                              {hauptbesetzung.person.nachname}
                            </span>
                            <BesetzungsStatusBadge
                              status={hauptbesetzung.status}
                            />
                          </div>
                        ) : (
                          <span className="text-sm italic text-gray-400">
                            Hauptbes. offen
                          </span>
                        )}
                      </div>

                      {/* Zweitbesetzung */}
                      <div className="w-44 shrink-0">
                        {zweitbesetzung?.person ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {zweitbesetzung.person.vorname}{' '}
                              {zweitbesetzung.person.nachname}
                            </span>
                            <BesetzungsStatusBadge
                              status={zweitbesetzung.status}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">
                            Zweitbes. —
                          </span>
                        )}
                      </div>

                      {/* Count */}
                      <div className="text-xs text-gray-500">
                        {rolle.besetzungen.filter((b) => b.person_id).length}{' '}
                        Besetzung
                        {rolle.besetzungen.filter((b) => b.person_id).length !==
                          1 && 'en'}
                      </div>
                    </div>

                    {/* Editor Panel */}
                    {isEditing && canEdit && (
                      <div className="border-t border-gray-100 px-6 py-3">
                        <BesetzungsEditor
                          produktionId={produktionId}
                          rolle={rolle}
                          besetzungen={rolle.besetzungen}
                          personen={personen}
                          onClose={() => setEditingRolleId(null)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Empty after filter */}
      {grouped.every((g) => filterRollen(g.rollen).length === 0) && (
        <div className="px-6 py-8 text-center text-gray-500">
          Keine Rollen mit diesem Status gefunden.
        </div>
      )}
    </div>
  )
}
