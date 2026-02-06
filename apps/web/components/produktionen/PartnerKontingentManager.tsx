'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  createPartnerKontingent,
  updatePartnerKontingent,
  deletePartnerKontingent,
  getKontingentUebersicht,
} from '@/lib/actions/partner-kontingente'
import { getActivePartner } from '@/lib/actions/partner'
import type { Partner, PartnerKontingentUebersicht } from '@/lib/supabase/types'

interface PartnerKontingentManagerProps {
  serieId: string
  serieName: string
  canEdit: boolean
}

export function PartnerKontingentManager({
  serieId,
  serieName: _serieName,
  canEdit,
}: PartnerKontingentManagerProps) {
  const router = useRouter()
  const [kontingente, setKontingente] = useState<PartnerKontingentUebersicht[]>([])
  const [partner, setPartner] = useState<Partner[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [newPartnerId, setNewPartnerId] = useState('')
  const [newSollStunden, setNewSollStunden] = useState('0')
  const [newNotizen, setNewNotizen] = useState('')

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [kontingentData, partnerData] = await Promise.all([
        getKontingentUebersicht(serieId),
        getActivePartner(),
      ])
      setKontingente(kontingentData)
      setPartner(partnerData)
      setLoading(false)
    }
    loadData()
  }, [serieId])

  // Filter out partners that already have a kontingent
  const availablePartner = partner.filter(
    (p) => !kontingente.some((k) => k.partner_id === p.id)
  )

  async function handleAdd() {
    if (!newPartnerId) return

    setLoading(true)
    setError(null)

    const result = await createPartnerKontingent({
      partner_id: newPartnerId,
      serie_id: serieId,
      soll_stunden: parseFloat(newSollStunden) || 0,
      notizen: newNotizen || null,
    })

    if (result.success) {
      setShowAddForm(false)
      setNewPartnerId('')
      setNewSollStunden('0')
      setNewNotizen('')
      // Reload data
      const kontingentData = await getKontingentUebersicht(serieId)
      setKontingente(kontingentData)
      router.refresh()
    } else {
      setError(result.error || 'Fehler beim Erstellen')
    }
    setLoading(false)
  }

  async function handleUpdate(id: string, sollStunden: number, notizen: string | null) {
    setLoading(true)
    setError(null)

    const result = await updatePartnerKontingent(id, {
      soll_stunden: sollStunden,
      notizen,
    })

    if (result.success) {
      setEditingId(null)
      const kontingentData = await getKontingentUebersicht(serieId)
      setKontingente(kontingentData)
      router.refresh()
    } else {
      setError(result.error || 'Fehler beim Aktualisieren')
    }
    setLoading(false)
  }

  async function handleDelete(id: string, partnerName: string) {
    if (!confirm(`Kontingent fuer "${partnerName}" wirklich loeschen?`)) return

    setLoading(true)
    setError(null)

    const result = await deletePartnerKontingent(id)

    if (result.success) {
      const kontingentData = await getKontingentUebersicht(serieId)
      setKontingente(kontingentData)
      router.refresh()
    } else {
      setError(result.error || 'Fehler beim Loeschen')
    }
    setLoading(false)
  }

  // Calculate totals
  const totalSoll = kontingente.reduce((sum, k) => sum + k.soll_stunden, 0)
  const totalIst = kontingente.reduce((sum, k) => sum + k.ist_stunden, 0)
  const totalErfuellung = totalSoll > 0 ? (totalIst / totalSoll) * 100 : 0

  function getErfuellungColor(grad: number): string {
    if (grad >= 100) return 'text-green-600'
    if (grad >= 75) return 'text-blue-600'
    if (grad >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  function getErfuellungIcon(grad: number) {
    if (grad >= 100) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (grad >= 50) return <Minus className="h-4 w-4 text-amber-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  if (loading && kontingente.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900">Partner-Kontingente</h2>
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">Laden...</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900">Partner-Kontingente</h2>
        </div>
        {canEdit && !showAddForm && availablePartner.length > 0 && (
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

      {/* Summary */}
      {kontingente.length > 0 && (
        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500">Soll (gesamt)</div>
              <div className="text-xl font-bold text-gray-900">{totalSoll.toFixed(1)}h</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Ist (gesamt)</div>
              <div className="text-xl font-bold text-gray-900">{totalIst.toFixed(1)}h</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Erfuellungsgrad</div>
              <div className={`text-xl font-bold ${getErfuellungColor(totalErfuellung)}`}>
                {totalErfuellung.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 font-medium text-gray-900">Neues Kontingent</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Partner Select */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Partner
              </label>
              <select
                value={newPartnerId}
                onChange={(e) => setNewPartnerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Auswaehlen --</option>
                {availablePartner.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Soll-Stunden */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Soll-Stunden
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={newSollStunden}
                onChange={(e) => setNewSollStunden(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Notizen */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notizen
              </label>
              <input
                type="text"
                value={newNotizen}
                onChange={(e) => setNewNotizen(e.target.value)}
                placeholder="Optional..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewPartnerId('')
                setNewSollStunden('0')
                setNewNotizen('')
                setError(null)
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAdd}
              disabled={loading || !newPartnerId}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? 'Speichern...' : 'Hinzufuegen'}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {kontingente.length === 0 && !showAddForm && (
        <p className="py-4 text-center text-sm text-gray-500">
          Keine Partner-Kontingente definiert
        </p>
      )}

      {/* Kontingente List */}
      {kontingente.length > 0 && (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {kontingente.map((k) => (
            <div key={k.id} className="px-4 py-3">
              {editingId === k.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="font-medium text-gray-900">{k.partner_name}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Soll-Stunden
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        defaultValue={k.soll_stunden}
                        id={`soll-${k.id}`}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Notizen
                      </label>
                      <input
                        type="text"
                        defaultValue={k.notizen || ''}
                        id={`notizen-${k.id}`}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => {
                        const sollInput = document.getElementById(
                          `soll-${k.id}`
                        ) as HTMLInputElement
                        const notizenInput = document.getElementById(
                          `notizen-${k.id}`
                        ) as HTMLInputElement
                        handleUpdate(
                          k.id,
                          parseFloat(sollInput.value) || 0,
                          notizenInput.value || null
                        )
                      }}
                      className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{k.partner_name}</span>
                      {getErfuellungIcon(k.erfuellungsgrad)}
                    </div>
                    {k.notizen && (
                      <p className="mt-1 text-xs text-gray-500">{k.notizen}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Soll */}
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Soll</div>
                      <div className="font-medium">{k.soll_stunden.toFixed(1)}h</div>
                    </div>

                    {/* Ist */}
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Ist</div>
                      <div className="font-medium">{k.ist_stunden.toFixed(1)}h</div>
                    </div>

                    {/* Erfuellungsgrad */}
                    <div className="w-16 text-right">
                      <div className="text-xs text-gray-500">Erfuellt</div>
                      <div className={`font-bold ${getErfuellungColor(k.erfuellungsgrad)}`}>
                        {k.erfuellungsgrad.toFixed(0)}%
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-24">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full ${
                            k.erfuellungsgrad >= 100
                              ? 'bg-green-500'
                              : k.erfuellungsgrad >= 75
                                ? 'bg-blue-500'
                                : k.erfuellungsgrad >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, k.erfuellungsgrad)}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingId(k.id)}
                          className="rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(k.id, k.partner_name)}
                          disabled={loading}
                          className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
