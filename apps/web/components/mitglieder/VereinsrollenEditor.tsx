'use client'

import { useState, useTransition } from 'react'
import type { Vereinsrolle, MitgliedRolleMitDetails } from '@/lib/supabase/types'
import {
  addMitgliedRolle,
  removeMitgliedRolle,
  updateMitgliedRolle,
} from '@/lib/actions/vereinsrollen'

interface VereinsrollenEditorProps {
  mitgliedId: string
  aktiveRollen: MitgliedRolleMitDetails[]
  verfuegbareRollen: Vereinsrolle[]
  readOnly?: boolean
}

export function VereinsrollenEditor({
  mitgliedId,
  aktiveRollen,
  verfuegbareRollen,
  readOnly = false,
}: VereinsrollenEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedRolle, setSelectedRolle] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Filter out already assigned roles
  const unassignedRollen = verfuegbareRollen.filter(
    (rolle) => !aktiveRollen.some((ar) => ar.rolle_id === rolle.id)
  )

  const handleAddRolle = () => {
    if (!selectedRolle) return

    startTransition(async () => {
      await addMitgliedRolle({
        mitglied_id: mitgliedId,
        rolle_id: selectedRolle,
        ist_primaer: aktiveRollen.length === 0, // First role is primary
        gueltig_von: new Date().toISOString().split('T')[0],
        gueltig_bis: null,
        notizen: null,
      })
      setSelectedRolle('')
      setShowAddForm(false)
    })
  }

  const handleRemoveRolle = (rolleId: string) => {
    if (!confirm('Rolle wirklich entfernen?')) return

    startTransition(async () => {
      await removeMitgliedRolle(rolleId)
    })
  }

  const handleSetPrimary = (rolleId: string) => {
    startTransition(async () => {
      await updateMitgliedRolle(rolleId, { ist_primaer: true })
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-700">Vereinsrollen</h4>
        {!readOnly && unassignedRollen.length > 0 && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Rolle hinzufügen
          </button>
        )}
      </div>

      {/* Current Roles */}
      {aktiveRollen.length > 0 ? (
        <div className="space-y-2">
          {aktiveRollen.map((rolle) => (
            <div
              key={rolle.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: rolle.vereinsrolle?.farbe || '#6B7280' }}
                />
                <span className="text-sm font-medium text-neutral-900">
                  {rolle.vereinsrolle?.name || 'Unbekannt'}
                </span>
                {rolle.ist_primaer && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                    Primär
                  </span>
                )}
              </div>

              {!readOnly && (
                <div className="flex items-center gap-2">
                  {!rolle.ist_primaer && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(rolle.id)}
                      disabled={isPending}
                      className="text-xs text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
                    >
                      Als primär setzen
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveRolle(rolle.id)}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Entfernen
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Keine Vereinsrollen zugewiesen</p>
      )}

      {/* Add Role Form */}
      {showAddForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor="newRolle"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Neue Rolle
              </label>
              <select
                id="newRolle"
                value={selectedRolle}
                onChange={(e) => setSelectedRolle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Auswählen --</option>
                {unassignedRollen.map((rolle) => (
                  <option key={rolle.id} value={rolle.id}>
                    {rolle.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddRolle}
              disabled={!selectedRolle || isPending}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isPending ? '...' : 'Hinzufügen'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setSelectedRolle('')
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact badge display for lists
export function VereinsrollenBadges({
  rollen,
}: {
  rollen: MitgliedRolleMitDetails[]
}) {
  if (rollen.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {rollen.map((rolle) => (
        <span
          key={rolle.id}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: rolle.vereinsrolle?.farbe || '#6B7280' }}
        >
          {rolle.vereinsrolle?.name || 'Unbekannt'}
          {rolle.ist_primaer && (
            <span className="ml-0.5 text-[10px] opacity-75">★</span>
          )}
        </span>
      ))}
    </div>
  )
}
