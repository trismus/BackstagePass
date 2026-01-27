'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Veranstaltung } from '@/lib/supabase/types'
import { StatusBadge, TypBadge } from './StatusBadge'

interface VeranstaltungenTableProps {
  veranstaltungen: Veranstaltung[]
}

export function VeranstaltungenTable({
  veranstaltungen,
}: VeranstaltungenTableProps) {
  const [search, setSearch] = useState('')
  const [showPast, setShowPast] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const filtered = veranstaltungen.filter((v) => {
    const matchesSearch =
      v.titel.toLowerCase().includes(search.toLowerCase()) ||
      (v.ort?.toLowerCase().includes(search.toLowerCase()) ?? false)

    const isPast = v.datum < today
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
    <div className="rounded-lg bg-white shadow">
      {/* Filter Bar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Suche nach Titel oder Ort..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:w-64"
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
        <p className="mt-2 text-sm text-gray-500">
          {filtered.length} von {veranstaltungen.length} Veranstaltungen
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Veranstaltung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Datum / Zeit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ort
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Typ
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
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/veranstaltungen/${v.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {v.titel}
                  </Link>
                  {v.max_teilnehmer && (
                    <span className="ml-2 text-xs text-gray-500">
                      (max. {v.max_teilnehmer})
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {formatDate(v.datum)}
                  {v.startzeit && (
                    <span className="ml-2 text-gray-400">
                      {formatTime(v.startzeit)}
                      {v.endzeit && ` - ${formatTime(v.endzeit)}`}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {v.ort || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <TypBadge typ={v.typ} />
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <StatusBadge status={v.status} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <Link
                    href={`/veranstaltungen/${v.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Keine Veranstaltungen gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
