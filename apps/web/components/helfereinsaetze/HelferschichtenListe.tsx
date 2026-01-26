'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HelferschichtMitDetails, HelferschichtStatus } from '@/lib/supabase/types'
import { HelferschichtStatusBadge } from './HelfereinsatzStatusBadge'
import { updateHelferschichtStatus, removeHelfer } from '@/lib/actions/helferschichten'

interface HelferschichtenListeProps {
  schichten: HelferschichtMitDetails[]
  canEdit?: boolean
}

export function HelferschichtenListe({
  schichten,
  canEdit = false,
}: HelferschichtenListeProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleStatusChange(id: string, newStatus: HelferschichtStatus) {
    setLoading(id)
    await updateHelferschichtStatus(id, newStatus)
    setLoading(null)
    router.refresh()
  }

  async function handleRemove(id: string) {
    if (!confirm('Helfer wirklich entfernen?')) return
    setLoading(id)
    await removeHelfer(id)
    setLoading(null)
    router.refresh()
  }

  const totalStunden = schichten
    .filter((s) => s.status === 'erschienen')
    .reduce((sum, s) => sum + (s.stunden_gearbeitet || 0), 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span className="text-gray-600">
          <strong>{schichten.length}</strong> Helfer zugewiesen
        </span>
        {totalStunden > 0 && (
          <span className="text-green-600">
            <strong>{totalStunden.toFixed(1)}</strong> Stunden gearbeitet
          </span>
        )}
      </div>

      {/* List */}
      {schichten.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Rolle
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Stunden
                </th>
                {canEdit && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Aktion
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schichten.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {s.person.vorname} {s.person.nachname}
                    </div>
                    {s.person.email && (
                      <div className="text-sm text-gray-500">{s.person.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {s.helferrolle?.rolle || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <HelferschichtStatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {s.stunden_gearbeitet?.toFixed(1) || '-'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {loading === s.id ? (
                        <span className="text-sm text-gray-400">...</span>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <select
                            value={s.status}
                            onChange={(e) =>
                              handleStatusChange(
                                s.id,
                                e.target.value as HelferschichtStatus
                              )
                            }
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="zugesagt">Zugesagt</option>
                            <option value="erschienen">Erschienen</option>
                            <option value="nicht_erschienen">Nicht erschienen</option>
                            <option value="abgesagt">Abgesagt</option>
                          </select>
                          <button
                            onClick={() => handleRemove(s.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Entfernen
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
          Noch keine Helfer zugewiesen
        </div>
      )}
    </div>
  )
}
