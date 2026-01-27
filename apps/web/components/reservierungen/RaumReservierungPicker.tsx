'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRaumReservierung, deleteRaumReservierung, checkRaumKonflikt } from '@/lib/actions/reservierungen'
import type { RaumReservierungMitRaum, Raum } from '@/lib/supabase/types'
import { RaumTypBadge } from '@/components/raeume/RaumTypBadge'
import { KonfliktWarnung } from './KonfliktWarnung'

interface RaumReservierungPickerProps {
  veranstaltungId: string
  datum: string
  reservierungen: RaumReservierungMitRaum[]
  raeume: Raum[]
  canEdit: boolean
}

export function RaumReservierungPicker({
  veranstaltungId,
  datum,
  reservierungen,
  raeume,
  canEdit,
}: RaumReservierungPickerProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [selectedRaumId, setSelectedRaumId] = useState('')
  const [loading, setLoading] = useState(false)
  const [konflikt, setKonflikt] = useState<string[] | null>(null)
  const [checkingKonflikt, setCheckingKonflikt] = useState(false)

  // Filter out already reserved rooms
  const reservedRaumIds = reservierungen.map((r) => r.raum_id)
  const availableRaeume = raeume.filter((r) => !reservedRaumIds.includes(r.id))

  async function handleRaumSelect(raumId: string) {
    setSelectedRaumId(raumId)
    if (!raumId) {
      setKonflikt(null)
      return
    }

    // Check for conflicts
    setCheckingKonflikt(true)
    const result = await checkRaumKonflikt(raumId, datum, veranstaltungId)
    setKonflikt(result.hasConflict ? result.conflictingEvents : null)
    setCheckingKonflikt(false)
  }

  async function handleAddReservierung() {
    if (!selectedRaumId) return
    setLoading(true)

    const result = await createRaumReservierung({
      veranstaltung_id: veranstaltungId,
      raum_id: selectedRaumId,
      notizen: null,
    })

    if (result.success) {
      setSelectedRaumId('')
      setShowForm(false)
      setKonflikt(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRemoveReservierung(id: string, raumName: string) {
    if (!confirm(`Reservierung für "${raumName}" wirklich entfernen?`)) return

    await deleteRaumReservierung(id, veranstaltungId)
    router.refresh()
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Räume ({reservierungen.length})</h3>
        {canEdit && !showForm && availableRaeume.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Raum reservieren
          </button>
        )}
      </div>

      {/* Add Room Form */}
      {showForm && canEdit && (
        <div className="p-4 border-b bg-blue-50">
          <div className="flex gap-2">
            <select
              value={selectedRaumId}
              onChange={(e) => handleRaumSelect(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Raum auswählen...</option>
              {availableRaeume.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.kapazitaet ? `(${r.kapazitaet} Plätze)` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddReservierung}
              disabled={loading || !selectedRaumId || checkingKonflikt}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:bg-blue-400"
            >
              {loading ? 'Speichern...' : 'Reservieren'}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setSelectedRaumId('')
                setKonflikt(null)
              }}
              className="px-3 py-2 text-gray-600 text-sm"
            >
              Abbrechen
            </button>
          </div>

          {/* Conflict Warning */}
          {konflikt && konflikt.length > 0 && (
            <div className="mt-3">
              <KonfliktWarnung
                message="Dieser Raum ist bereits reserviert für:"
                items={konflikt}
              />
            </div>
          )}

          {checkingKonflikt && (
            <p className="text-sm text-gray-500 mt-2">Prüfe Verfügbarkeit...</p>
          )}
        </div>
      )}

      {/* Reserved Rooms */}
      <div className="divide-y divide-gray-200">
        {reservierungen.map((r) => (
          <div key={r.id} className="p-4 flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-900">{r.raum.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <RaumTypBadge typ={r.raum.typ} />
                {r.raum.kapazitaet && (
                  <span className="text-sm text-gray-500">
                    {r.raum.kapazitaet} Plätze
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => handleRemoveReservierung(r.id, r.raum.name)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Entfernen
              </button>
            )}
          </div>
        ))}
        {reservierungen.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Noch keine Räume reserviert
          </div>
        )}
      </div>
    </div>
  )
}
