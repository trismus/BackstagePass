'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import type { Stueck } from '@/lib/supabase/types'
import { StatusBadge } from './StatusBadge'

interface StueckeTableProps {
  stuecke: Stueck[]
}

export function StueckeTable({ stuecke }: StueckeTableProps) {
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const filtered = stuecke.filter((s) => {
    const matchesSearch =
      s.titel.toLowerCase().includes(search.toLowerCase()) ||
      (s.autor?.toLowerCase().includes(search.toLowerCase()) ?? false)

    const matchesArchived = showArchived || s.status !== 'archiviert'

    return matchesSearch && matchesArchived
  })

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Filter Bar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Suche nach Titel oder Autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:w-64"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">Archivierte anzeigen</span>
          </label>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {filtered.length} von {stuecke.length} Stücke
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Stück
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Autor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Premiere
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/stuecke/${s.id}` as Route}
                    className="font-medium text-primary-600 hover:text-primary-800"
                  >
                    {s.titel}
                  </Link>
                  {s.beschreibung && (
                    <p className="max-w-xs truncate text-xs text-gray-500">
                      {s.beschreibung}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {s.autor || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {formatDate(s.premiere_datum)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <StatusBadge status={s.status} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <Link
                    href={`/stuecke/${s.id}` as Route}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Keine Stücke gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
