'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Raum } from '@/lib/supabase/types'
import { RaumTypBadge } from './RaumTypBadge'

interface RaeumeTableProps {
  raeume: Raum[]
}

export function RaeumeTable({ raeume }: RaeumeTableProps) {
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const filtered = raeume.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchesActive = showInactive || r.aktiv

    return matchesSearch && matchesActive
  })

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Filter Bar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Suche nach Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:w-64"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Inaktive anzeigen</span>
          </label>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {filtered.length} von {raeume.length} Räume
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Typ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Kapazität
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
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={`hover:bg-gray-50 ${!r.aktiv ? 'opacity-60' : ''}`}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="font-medium text-gray-900">{r.name}</span>
                  {r.beschreibung && (
                    <p className="max-w-xs truncate text-sm text-gray-500">
                      {r.beschreibung}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <RaumTypBadge typ={r.typ} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {r.kapazitaet ? `${r.kapazitaet} Personen` : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.aktiv
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {r.aktiv ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <Link
                    href={`/raeume?edit=${r.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Bearbeiten
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Keine Räume gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
