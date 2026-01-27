'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Ressource } from '@/lib/supabase/types'
import { RessourceKategorieBadge } from './RessourceKategorieBadge'

interface RessourcenTableProps {
  ressourcen: Ressource[]
}

export function RessourcenTable({ ressourcen }: RessourcenTableProps) {
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const filtered = ressourcen.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchesActive = showInactive || r.aktiv

    return matchesSearch && matchesActive
  })

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Filter Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <input
            type="text"
            placeholder="Suche nach Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <p className="text-sm text-gray-500 mt-2">
          {filtered.length} von {ressourcen.length} Ressourcen
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Menge
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((r) => (
              <tr key={r.id} className={`hover:bg-gray-50 ${!r.aktiv ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900">{r.name}</span>
                  {r.beschreibung && (
                    <p className="text-sm text-gray-500 truncate max-w-xs">{r.beschreibung}</p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RessourceKategorieBadge kategorie={r.kategorie} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {r.menge}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      r.aktiv
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {r.aktiv ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link
                    href={`/ressourcen?edit=${r.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Bearbeiten
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Keine Ressourcen gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
