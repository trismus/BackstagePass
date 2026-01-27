'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createRessourcenReservierung,
  deleteRessourcenReservierung,
  updateRessourcenReservierung,
  checkRessourceVerfuegbarkeit,
} from '@/lib/actions/reservierungen'
import type { RessourcenReservierungMitRessource, Ressource } from '@/lib/supabase/types'
import { RessourceKategorieBadge } from '@/components/ressourcen/RessourceKategorieBadge'

interface RessourcenPickerProps {
  veranstaltungId: string
  datum: string
  reservierungen: RessourcenReservierungMitRessource[]
  ressourcen: Ressource[]
  canEdit: boolean
}

export function RessourcenPicker({
  veranstaltungId,
  datum,
  reservierungen,
  ressourcen,
  canEdit,
}: RessourcenPickerProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [selectedRessourceId, setSelectedRessourceId] = useState('')
  const [menge, setMenge] = useState('1')
  const [loading, setLoading] = useState(false)
  const [verfuegbar, setVerfuegbar] = useState<number | null>(null)
  const [checkingVerfuegbar, setCheckingVerfuegbar] = useState(false)

  // Filter out already reserved resources
  const reservedRessourceIds = reservierungen.map((r) => r.ressource_id)
  const availableRessourcen = ressourcen.filter((r) => !reservedRessourceIds.includes(r.id))

  async function handleRessourceSelect(ressourceId: string) {
    setSelectedRessourceId(ressourceId)
    if (!ressourceId) {
      setVerfuegbar(null)
      return
    }

    // Check availability
    setCheckingVerfuegbar(true)
    const result = await checkRessourceVerfuegbarkeit(ressourceId, datum, veranstaltungId)
    setVerfuegbar(result.available)
    setMenge(Math.min(1, result.available).toString())
    setCheckingVerfuegbar(false)
  }

  async function handleAddReservierung() {
    if (!selectedRessourceId) return
    setLoading(true)

    const result = await createRessourcenReservierung({
      veranstaltung_id: veranstaltungId,
      ressource_id: selectedRessourceId,
      menge: parseInt(menge, 10) || 1,
      notizen: null,
    })

    if (result.success) {
      setSelectedRessourceId('')
      setMenge('1')
      setShowForm(false)
      setVerfuegbar(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRemoveReservierung(id: string, ressourceName: string) {
    if (!confirm(`Reservierung für "${ressourceName}" wirklich entfernen?`)) return

    await deleteRessourcenReservierung(id, veranstaltungId)
    router.refresh()
  }

  async function handleMengeChange(id: string, newMenge: number) {
    await updateRessourcenReservierung(id, newMenge)
    router.refresh()
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Ressourcen ({reservierungen.length})</h3>
        {canEdit && !showForm && availableRessourcen.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Ressource reservieren
          </button>
        )}
      </div>

      {/* Add Resource Form */}
      {showForm && canEdit && (
        <div className="p-4 border-b bg-blue-50">
          <div className="flex gap-2">
            <select
              value={selectedRessourceId}
              onChange={(e) => handleRessourceSelect(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Ressource auswählen...</option>
              {availableRessourcen.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.menge} verfügbar)
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max={verfuegbar || 999}
              value={menge}
              onChange={(e) => setMenge(e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Menge"
            />
            <button
              onClick={handleAddReservierung}
              disabled={loading || !selectedRessourceId || checkingVerfuegbar}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:bg-blue-400"
            >
              {loading ? 'Speichern...' : 'Reservieren'}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setSelectedRessourceId('')
                setMenge('1')
                setVerfuegbar(null)
              }}
              className="px-3 py-2 text-gray-600 text-sm"
            >
              Abbrechen
            </button>
          </div>

          {/* Availability Info */}
          {verfuegbar !== null && (
            <p className={`text-sm mt-2 ${verfuegbar > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {verfuegbar > 0
                ? `${verfuegbar} verfügbar an diesem Tag`
                : 'Nicht verfügbar an diesem Tag'}
            </p>
          )}

          {checkingVerfuegbar && (
            <p className="text-sm text-gray-500 mt-2">Prüfe Verfügbarkeit...</p>
          )}
        </div>
      )}

      {/* Reserved Resources */}
      <div className="divide-y divide-gray-200">
        {reservierungen.map((r) => (
          <div key={r.id} className="p-4 flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-900">{r.ressource.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <RessourceKategorieBadge kategorie={r.ressource.kategorie} />
                {canEdit ? (
                  <input
                    type="number"
                    min="1"
                    max={r.ressource.menge}
                    value={r.menge}
                    onChange={(e) => handleMengeChange(r.id, parseInt(e.target.value, 10))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <span className="text-sm text-gray-500">{r.menge} Stück</span>
                )}
                <span className="text-sm text-gray-400">
                  (max. {r.ressource.menge})
                </span>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => handleRemoveReservierung(r.id, r.ressource.name)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Entfernen
              </button>
            )}
          </div>
        ))}
        {reservierungen.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Noch keine Ressourcen reserviert
          </div>
        )}
      </div>
    </div>
  )
}
