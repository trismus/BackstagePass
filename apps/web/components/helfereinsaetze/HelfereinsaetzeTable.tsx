'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { HelfereinsatzMitPartner } from '@/lib/supabase/types'
import { HelfereinsatzStatusBadge } from './HelfereinsatzStatusBadge'

interface HelfereinsaetzeTableProps {
  helfereinsaetze: HelfereinsatzMitPartner[]
}

export function HelfereinsaetzeTable({ helfereinsaetze }: HelfereinsaetzeTableProps) {
  const [search, setSearch] = useState('')
  const [showPast, setShowPast] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const filtered = helfereinsaetze.filter((h) => {
    const matchesSearch =
      h.titel.toLowerCase().includes(search.toLowerCase()) ||
      (h.partner?.name?.toLowerCase().includes(search.toLowerCase()) ?? false)

    const isPast = h.datum < today
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
            placeholder="Suche nach Titel oder Partner..."
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
          {filtered.length} von {helfereinsaetze.length} Einsätze
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Einsatz
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Partner
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
            {filtered.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/helfereinsaetze/${h.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {h.titel}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {h.partner?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(h.datum)}
                  {h.startzeit && (
                    <span className="text-gray-400 ml-2">
                      {formatTime(h.startzeit)}
                      {h.endzeit && ` - ${formatTime(h.endzeit)}`}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {h.ort || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <HelfereinsatzStatusBadge status={h.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link
                    href={`/helfereinsaetze/${h.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Keine Helfereinsätze gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
