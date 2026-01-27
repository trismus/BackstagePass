'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { HelferEventMitDetails } from '@/lib/supabase/types'

interface HelferEventTableProps {
  events: HelferEventMitDetails[]
}

export function HelferEventTable({ events }: HelferEventTableProps) {
  const [search, setSearch] = useState('')
  const [showPast, setShowPast] = useState(false)

  const now = new Date().toISOString()

  const filtered = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.ort?.toLowerCase().includes(search.toLowerCase()) ?? false)

    const isPast = e.datum_end < now
    const matchesTime = showPast || !isPast

    return matchesSearch && matchesTime
  })

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypBadge = (typ: string) => {
    if (typ === 'auffuehrung') {
      return (
        <span className="rounded bg-curtain-100 px-2 py-0.5 text-xs text-curtain-700">
          Aufführung
        </span>
      )
    }
    return (
      <span className="rounded bg-stage-100 px-2 py-0.5 text-xs text-stage-700">
        Helfereinsatz
      </span>
    )
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Filter Bar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Suche nach Name oder Ort..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:w-64"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">Vergangene anzeigen</span>
          </label>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {filtered.length} von {events.length} Events
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Typ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Datum / Zeit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ort
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Rollen
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/helferliste/${event.id}` as never}
                    className="font-medium text-primary-600 hover:text-primary-800"
                  >
                    {event.name}
                  </Link>
                  {event.veranstaltung && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {event.veranstaltung.titel}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {getTypBadge(event.typ)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {formatDateTime(event.datum_start)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {event.ort || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {event.rollen_count} Rollen
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <Link
                    href={`/helferliste/${event.id}` as never}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Keine Helfer-Events gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
