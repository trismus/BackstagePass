'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Veranstaltung } from '@/lib/supabase/types'
import { StatusBadge } from '@/components/veranstaltungen/StatusBadge'

interface AuffuehrungenTableProps {
  auffuehrungen: Veranstaltung[]
}

export function AuffuehrungenTable({ auffuehrungen }: AuffuehrungenTableProps) {
  const [search, setSearch] = useState('')
  const [showPast, setShowPast] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const filtered = auffuehrungen.filter((a) => {
    const matchesSearch = a.titel.toLowerCase().includes(search.toLowerCase())
    const isPast = a.datum < today
    const matchesTime = showPast || !isPast

    return matchesSearch && matchesTime
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-'
    return timeStr.slice(0, 5)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Filter Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <input
            type="text"
            placeholder="Suche nach Titel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Vergangene anzeigen</span>
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {filtered.length} von {auffuehrungen.length} Aufführungen
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aufführung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum / Zeit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ort
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
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/auffuehrungen/${a.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {a.titel}
                  </Link>
                  {a.beschreibung && (
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {a.beschreibung}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(a.datum)}
                  {a.startzeit && (
                    <span className="text-gray-400 ml-2">
                      {formatTime(a.startzeit)}
                      {a.endzeit && ` - ${formatTime(a.endzeit)}`}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {a.ort || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link
                    href={`/auffuehrungen/${a.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Verwalten
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Keine Aufführungen gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
