'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import type { Produktion, ProduktionStatus } from '@/lib/supabase/types'
import { PRODUKTION_STATUS_LABELS } from '@/lib/supabase/types'
import { ProduktionStatusBadge } from './ProduktionStatusBadge'
import { deleteProduktion } from '@/lib/actions/produktionen'

interface ProduktionenTableProps {
  produktionen: Produktion[]
  canEdit?: boolean
  canDelete?: boolean
}

export function ProduktionenTable({
  produktionen,
  canEdit = false,
  canDelete = false,
}: ProduktionenTableProps) {
  const [filterStatus, setFilterStatus] = useState<ProduktionStatus | 'alle'>(
    'alle'
  )
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = produktionen.filter((p) => {
    if (filterStatus !== 'alle' && p.status !== filterStatus) return false
    if (
      searchTerm &&
      !p.titel.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.saison.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const handleDelete = async (id: string, titel: string) => {
    if (!confirm(`Produktion "${titel}" wirklich löschen?`)) return
    const result = await deleteProduktion(id)
    if (!result.success) {
      alert(result.error || 'Fehler beim Löschen')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '–'
    return new Date(dateStr).toLocaleDateString('de-CH')
  }

  if (produktionen.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <p className="text-gray-500">Noch keine Produktionen vorhanden.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="Suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as ProduktionStatus | 'alle')
          }
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        >
          <option value="alle">Alle Status</option>
          {Object.entries(PRODUKTION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Titel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Saison
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Premiere
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Dernière
              </th>
              {(canEdit || canDelete) && (
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Aktionen
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/produktionen/${p.id}` as Route}
                    className="font-medium text-primary-600 hover:text-primary-800"
                  >
                    {p.titel}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {p.saison}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <ProduktionStatusBadge status={p.status} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {formatDate(p.premiere)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {formatDate(p.derniere)}
                </td>
                {(canEdit || canDelete) && (
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <Link
                          href={`/produktionen/${p.id}/bearbeiten` as Route}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          Bearbeiten
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(p.id, p.titel)}
                          className="text-error-600 hover:text-error-800"
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Keine Produktionen gefunden.
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {filtered.length} von {produktionen.length} Produktionen
      </p>
    </div>
  )
}
