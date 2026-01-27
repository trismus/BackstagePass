'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import type { Probe } from '@/lib/supabase/types'
import { ProbeStatusBadge } from './ProbeStatusBadge'

interface ProbenListProps {
  proben: Probe[]
  stueckId: string
  canEdit: boolean
}

export function ProbenList({ proben, stueckId, canEdit }: ProbenListProps) {
  const [showPast, setShowPast] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const filtered = proben.filter((p) => {
    const isPast = p.datum < today || p.status === 'abgeschlossen'
    return showPast || !isPast
  })

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  // Gruppiere nach Monat
  const groupedByMonth: Record<string, Probe[]> = {}
  filtered.forEach((probe) => {
    const monthKey = probe.datum.slice(0, 7) // YYYY-MM
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = []
    }
    groupedByMonth[monthKey].push(probe)
  })

  const formatMonthHeader = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
      'de-CH',
      {
        month: 'long',
        year: 'numeric',
      }
    )
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Proben</h2>
          <p className="text-sm text-gray-500">
            {filtered.length} Probe{filtered.length !== 1 && 'n'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="rounded border-gray-300 text-primary-600"
            />
            Vergangene anzeigen
          </label>
          {canEdit && (
            <Link
              href={`/stuecke/${stueckId}/proben/neu` as Route}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700"
            >
              + Neue Probe
            </Link>
          )}
        </div>
      </div>

      {Object.keys(groupedByMonth).length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          {showPast ? 'Keine Proben vorhanden' : 'Keine kommenden Proben'}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {Object.entries(groupedByMonth).map(([monthKey, monthProben]) => (
            <div key={monthKey}>
              <div className="bg-gray-50 px-6 py-2 text-sm font-medium text-gray-500">
                {formatMonthHeader(monthKey)}
              </div>
              <ul className="divide-y divide-gray-100">
                {monthProben.map((probe) => (
                  <li key={probe.id}>
                    <Link
                      href={`/proben/${probe.id}` as Route}
                      className="block px-6 py-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="min-w-[60px] text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {new Date(probe.datum).getDate()}
                            </div>
                            <div className="text-xs uppercase text-gray-500">
                              {new Date(probe.datum).toLocaleDateString(
                                'de-CH',
                                { weekday: 'short' }
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {probe.titel}
                              </span>
                              <ProbeStatusBadge status={probe.status} />
                            </div>
                            <div className="mt-0.5 text-sm text-gray-500">
                              {probe.startzeit && (
                                <span>
                                  {formatTime(probe.startzeit)}
                                  {probe.endzeit &&
                                    ` - ${formatTime(probe.endzeit)}`}
                                </span>
                              )}
                              {probe.ort && (
                                <span className="ml-3">{probe.ort}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
