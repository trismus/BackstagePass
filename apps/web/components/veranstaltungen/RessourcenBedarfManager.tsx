'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Plus, Trash2, Check, Package } from 'lucide-react'
import {
  createRessourcenReservierung,
  updateRessourcenReservierung,
  deleteRessourcenReservierung,
  checkRessourceKonflikt,
  getVerfuegbareRessourcen,
} from '@/lib/actions/ressourcen-bedarf'
import type {
  RessourcenReservierungMitRessource,
  Ressource,
  RessourcenKonflikt,
  ReservierungStatus,
  BedarfTyp,
} from '@/lib/supabase/types'
import { RessourceKategorieBadge } from '@/components/ressourcen/RessourceKategorieBadge'

interface RessourcenBedarfManagerProps {
  veranstaltungId: string
  reservierungen: RessourcenReservierungMitRessource[]
  canEdit: boolean
}

const statusLabels: Record<ReservierungStatus, { label: string; color: string }> = {
  geplant: { label: 'Geplant', color: 'bg-gray-100 text-gray-700' },
  reserviert: { label: 'Reserviert', color: 'bg-blue-100 text-blue-700' },
  bestaetigt: { label: 'Bestaetigt', color: 'bg-green-100 text-green-700' },
}

const bedarfTypLabels: Record<BedarfTyp, { label: string; color: string }> = {
  fix: { label: 'Fix', color: 'bg-purple-100 text-purple-700' },
  variabel: { label: 'Variabel', color: 'bg-amber-100 text-amber-700' },
}

export function RessourcenBedarfManager({
  veranstaltungId,
  reservierungen: initialReservierungen,
  canEdit,
}: RessourcenBedarfManagerProps) {
  const router = useRouter()
  const reservierungen = initialReservierungen
  const [verfuegbareRessourcen, setVerfuegbareRessourcen] = useState<Ressource[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [konflikte, setKonflikte] = useState<Record<string, RessourcenKonflikt[]>>({})

  // Form state for adding new reservierung
  const [newRessourceId, setNewRessourceId] = useState('')
  const [newMenge, setNewMenge] = useState('1')
  const [newStatus, setNewStatus] = useState<ReservierungStatus>('geplant')
  const [newBedarfTyp, setNewBedarfTyp] = useState<BedarfTyp>('fix')

  // Load available resources
  useEffect(() => {
    async function loadRessourcen() {
      const ressourcen = await getVerfuegbareRessourcen()
      setVerfuegbareRessourcen(ressourcen)
    }
    loadRessourcen()
  }, [])

  // Check conflicts when ressource is selected
  async function checkKonflikt(ressourceId: string) {
    if (!ressourceId) return
    const konfliktList = await checkRessourceKonflikt(ressourceId, veranstaltungId)
    setKonflikte((prev) => ({ ...prev, [ressourceId]: konfliktList }))
  }

  // Filter out already reserved resources
  const availableForSelection = verfuegbareRessourcen.filter(
    (r) => !reservierungen.some((res) => res.ressource_id === r.id)
  )

  async function handleAdd() {
    if (!newRessourceId) return

    setLoading(true)
    setError(null)

    const result = await createRessourcenReservierung({
      veranstaltung_id: veranstaltungId,
      ressource_id: newRessourceId,
      menge: parseInt(newMenge, 10) || 1,
      notizen: null,
      status: newStatus,
      bedarf_typ: newBedarfTyp,
    })

    if (result.success) {
      setShowAddForm(false)
      setNewRessourceId('')
      setNewMenge('1')
      setNewStatus('geplant')
      setNewBedarfTyp('fix')
      router.refresh()
    } else {
      setError(result.error || 'Fehler beim Hinzufuegen')
    }
    setLoading(false)
  }

  async function handleUpdate(
    id: string,
    data: { menge?: number; status?: ReservierungStatus; bedarf_typ?: BedarfTyp }
  ) {
    setLoading(true)
    setError(null)

    const result = await updateRessourcenReservierung(id, data)

    if (result.success) {
      setEditingId(null)
      router.refresh()
    } else {
      setError(result.error || 'Fehler beim Aktualisieren')
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Ressourcen-Reservierung wirklich loeschen?')) return

    setLoading(true)
    setError(null)

    const result = await deleteRessourcenReservierung(id)

    if (result.success) {
      router.refresh()
    } else {
      setError(result.error || 'Fehler beim Loeschen')
    }
    setLoading(false)
  }

  // Group by category for display
  const groupedByKategorie = reservierungen.reduce(
    (acc, res) => {
      const kategorie = res.ressource?.kategorie || 'sonstiges'
      if (!acc[kategorie]) acc[kategorie] = []
      acc[kategorie].push(res)
      return acc
    },
    {} as Record<string, RessourcenReservierungMitRessource[]>
  )

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900">Ressourcenbedarf</h2>
        </div>
        {canEdit && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Hinzufuegen
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 font-medium text-gray-900">Neue Ressource hinzufuegen</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Ressource Select */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ressource
              </label>
              <select
                value={newRessourceId}
                onChange={(e) => {
                  setNewRessourceId(e.target.value)
                  checkKonflikt(e.target.value)
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Auswaehlen --</option>
                {availableForSelection.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.menge} verfuegbar)
                  </option>
                ))}
              </select>
            </div>

            {/* Menge */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Menge
              </label>
              <input
                type="number"
                min="1"
                value={newMenge}
                onChange={(e) => setNewMenge(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Bedarf-Typ */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Typ
              </label>
              <select
                value={newBedarfTyp}
                onChange={(e) => setNewBedarfTyp(e.target.value as BedarfTyp)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="fix">Fix (immer benoetigt)</option>
                <option value="variabel">Variabel (optional)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ReservierungStatus)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="geplant">Geplant</option>
                <option value="reserviert">Reserviert</option>
                <option value="bestaetigt">Bestaetigt</option>
              </select>
            </div>
          </div>

          {/* Conflict Warning */}
          {newRessourceId && konflikte[newRessourceId]?.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div className="text-sm text-amber-800">
                <span className="font-medium">Achtung:</span> Diese Ressource ist am
                selben Tag bereits reserviert fuer:
                <ul className="mt-1 list-inside list-disc">
                  {konflikte[newRessourceId].map((k, i) => (
                    <li key={i}>
                      {k.konflikt_titel} ({k.reserviert_menge} Stueck)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewRessourceId('')
                setError(null)
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAdd}
              disabled={loading || !newRessourceId}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              <Check className="h-4 w-4" />
              {loading ? 'Speichern...' : 'Hinzufuegen'}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {reservierungen.length === 0 && !showAddForm && (
        <p className="py-4 text-center text-sm text-gray-500">
          Keine Ressourcen zugewiesen
        </p>
      )}

      {/* Grouped List */}
      {Object.entries(groupedByKategorie).map(([kategorie, items]) => (
        <div key={kategorie} className="mb-4 last:mb-0">
          <div className="mb-2">
            <RessourceKategorieBadge
              kategorie={kategorie as Ressource['kategorie']}
            />
          </div>

          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {items.map((res) => (
              <div
                key={res.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  {/* Name */}
                  <span className="font-medium text-gray-900">
                    {res.ressource?.name || 'Unbekannt'}
                  </span>

                  {/* Menge */}
                  {editingId === res.id ? (
                    <input
                      type="number"
                      min="1"
                      defaultValue={res.menge || 1}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                      onBlur={(e) => {
                        const menge = parseInt(e.target.value, 10)
                        if (menge && menge !== res.menge) {
                          handleUpdate(res.id, { menge })
                        }
                      }}
                    />
                  ) : (
                    <span className="text-sm text-gray-600">
                      {res.menge || 1} Stueck
                    </span>
                  )}

                  {/* Status Badge */}
                  {editingId === res.id ? (
                    <select
                      defaultValue={res.status || 'geplant'}
                      onChange={(e) =>
                        handleUpdate(res.id, {
                          status: e.target.value as ReservierungStatus,
                        })
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="geplant">Geplant</option>
                      <option value="reserviert">Reserviert</option>
                      <option value="bestaetigt">Bestaetigt</option>
                    </select>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusLabels[res.status || 'geplant'].color
                      }`}
                    >
                      {statusLabels[res.status || 'geplant'].label}
                    </span>
                  )}

                  {/* Bedarf Typ Badge */}
                  {editingId === res.id ? (
                    <select
                      defaultValue={res.bedarf_typ || 'fix'}
                      onChange={(e) =>
                        handleUpdate(res.id, {
                          bedarf_typ: e.target.value as BedarfTyp,
                        })
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="fix">Fix</option>
                      <option value="variabel">Variabel</option>
                    </select>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        bedarfTypLabels[res.bedarf_typ || 'fix'].color
                      }`}
                    >
                      {bedarfTypLabels[res.bedarf_typ || 'fix'].label}
                    </span>
                  )}
                </div>

                {/* Actions */}
                {canEdit && (
                  <div className="flex items-center gap-2">
                    {editingId === res.id ? (
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                      >
                        Fertig
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingId(res.id)}
                        className="rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        Bearbeiten
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(res.id)}
                      disabled={loading}
                      className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
