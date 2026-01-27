'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createZuweisung,
  deleteZuweisung,
  updateZuweisung,
} from '@/lib/actions/auffuehrung-schichten'
import type {
  SchichtMitZeitblock,
  ZuweisungMitPerson,
  Person,
  ZuweisungStatus,
} from '@/lib/supabase/types'

interface SchichtZuweisungListeProps {
  schichten: SchichtMitZeitblock[]
  zuweisungen: ZuweisungMitPerson[]
  personen: Person[]
  canEdit: boolean
}

const statusLabels: Record<ZuweisungStatus, { label: string; color: string }> =
  {
    zugesagt: { label: 'Zugesagt', color: 'bg-green-100 text-green-800' },
    abgesagt: { label: 'Abgesagt', color: 'bg-red-100 text-red-800' },
    erschienen: { label: 'Erschienen', color: 'bg-blue-100 text-blue-800' },
    nicht_erschienen: {
      label: 'Nicht erschienen',
      color: 'bg-gray-100 text-gray-800',
    },
  }

export function SchichtZuweisungListe({
  schichten,
  zuweisungen,
  personen,
  canEdit,
}: SchichtZuweisungListeProps) {
  const router = useRouter()
  const [addingToSchicht, setAddingToSchicht] = useState<string | null>(null)
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [loading, setLoading] = useState(false)

  // Group zuweisungen by schicht_id
  const zuweisungenBySchicht = zuweisungen.reduce(
    (acc, z) => {
      if (!acc[z.schicht_id]) acc[z.schicht_id] = []
      acc[z.schicht_id].push(z)
      return acc
    },
    {} as Record<string, ZuweisungMitPerson[]>
  )

  async function handleAddZuweisung(schichtId: string) {
    if (!selectedPersonId) return
    setLoading(true)

    const result = await createZuweisung({
      schicht_id: schichtId,
      person_id: selectedPersonId,
      status: 'zugesagt',
      notizen: null,
    })

    if (result.success) {
      setAddingToSchicht(null)
      setSelectedPersonId('')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRemoveZuweisung(id: string) {
    if (!confirm('Zuweisung wirklich entfernen?')) return
    await deleteZuweisung(id)
    router.refresh()
  }

  async function handleStatusChange(id: string, status: ZuweisungStatus) {
    await updateZuweisung(id, { status })
    router.refresh()
  }

  // Get already assigned person IDs for a schicht
  const getAssignedPersonIds = (schichtId: string): string[] => {
    return (zuweisungenBySchicht[schichtId] || []).map((z) => z.person_id)
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b bg-gray-50 px-4 py-3">
        <h3 className="font-medium text-gray-900">Zuweisungen verwalten</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {schichten.map((schicht) => {
          const schichtZuweisungen = zuweisungenBySchicht[schicht.id] || []
          const assignedIds = getAssignedPersonIds(schicht.id)
          const availablePersonen = personen.filter(
            (p) => !assignedIds.includes(p.id)
          )

          return (
            <div key={schicht.id} className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{schicht.rolle}</h4>
                  {schicht.zeitblock && (
                    <p className="text-sm text-gray-500">
                      {schicht.zeitblock.name} (
                      {schicht.zeitblock.startzeit.slice(0, 5)} -{' '}
                      {schicht.zeitblock.endzeit.slice(0, 5)})
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    {schichtZuweisungen.length}/{schicht.anzahl_benoetigt}{' '}
                    besetzt
                  </p>
                </div>
                {canEdit && addingToSchicht !== schicht.id && (
                  <button
                    onClick={() => setAddingToSchicht(schicht.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Person hinzufügen
                  </button>
                )}
              </div>

              {/* Add person form */}
              {addingToSchicht === schicht.id && canEdit && (
                <div className="mb-3 flex gap-2">
                  <select
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Person auswählen...</option>
                    {availablePersonen.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.vorname} {p.nachname}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAddZuweisung(schicht.id)}
                    disabled={loading || !selectedPersonId}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:bg-blue-400"
                  >
                    Hinzufügen
                  </button>
                  <button
                    onClick={() => {
                      setAddingToSchicht(null)
                      setSelectedPersonId('')
                    }}
                    className="px-3 py-2 text-sm text-gray-600"
                  >
                    Abbrechen
                  </button>
                </div>
              )}

              {/* Assigned people */}
              {schichtZuweisungen.length > 0 ? (
                <div className="space-y-2">
                  {schichtZuweisungen.map((z) => (
                    <div
                      key={z.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                    >
                      <span className="text-sm text-gray-900">
                        {z.person.vorname} {z.person.nachname}
                      </span>
                      <div className="flex items-center gap-2">
                        {canEdit ? (
                          <select
                            value={z.status}
                            onChange={(e) =>
                              handleStatusChange(
                                z.id,
                                e.target.value as ZuweisungStatus
                              )
                            }
                            className={`rounded-full border-0 px-2 py-1 text-xs ${statusLabels[z.status].color}`}
                          >
                            {Object.entries(statusLabels).map(
                              ([value, { label }]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${statusLabels[z.status].color}`}
                          >
                            {statusLabels[z.status].label}
                          </span>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleRemoveZuweisung(z.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Noch niemand zugewiesen</p>
              )}
            </div>
          )
        })}

        {schichten.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Keine Schichten definiert
          </div>
        )}
      </div>
    </div>
  )
}
