'use client'

import Link from 'next/link'
import type { Route } from 'next'
import type { Produktion, ProduktionStatus } from '@/lib/supabase/types'
import { PRODUKTION_STATUS_LABELS } from '@/lib/supabase/types'

interface ProduktionTimelineProps {
  produktionen: Produktion[]
}

const STATUS_COLORS: Record<ProduktionStatus, string> = {
  draft: 'bg-gray-300',
  planung: 'bg-blue-400',
  casting: 'bg-amber-400',
  proben: 'bg-indigo-400',
  premiere: 'bg-purple-400',
  laufend: 'bg-green-400',
  abgeschlossen: 'bg-gray-400',
  abgesagt: 'bg-red-400',
}

export function ProduktionTimeline({ produktionen }: ProduktionTimelineProps) {
  // Filter to active productions that have dates
  const withDates = produktionen.filter(
    (p) => p.proben_start || p.premiere || p.derniere
  )

  if (withDates.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-gray-500">
          Keine Produktionen mit Terminen vorhanden.
        </p>
      </div>
    )
  }

  // Determine date range for the timeline
  const allDates: Date[] = []
  withDates.forEach((p) => {
    if (p.proben_start) allDates.push(new Date(p.proben_start))
    if (p.premiere) allDates.push(new Date(p.premiere))
    if (p.derniere) allDates.push(new Date(p.derniere))
  })

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

  // Pad the range by 2 weeks on each side
  minDate.setDate(minDate.getDate() - 14)
  maxDate.setDate(maxDate.getDate() + 14)

  const totalDays = Math.ceil(
    (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr)
    const daysDiff = Math.ceil(
      (date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    return (daysDiff / totalDays) * 100
  }

  const getBarWidth = (start: string, end: string) => {
    const startPos = getPosition(start)
    const endPos = getPosition(end)
    return Math.max(endPos - startPos, 1) // minimum 1% width
  }

  const today = new Date()
  const todayPosition =
    today >= minDate && today <= maxDate
      ? getPosition(today.toISOString().split('T')[0])
      : null

  // Generate month markers
  const months: { label: string; position: number }[] = []
  const current = new Date(minDate)
  current.setDate(1)
  while (current <= maxDate) {
    if (current >= minDate) {
      const position = getPosition(current.toISOString().split('T')[0])
      months.push({
        label: current.toLocaleDateString('de-CH', {
          month: 'short',
          year: 'numeric',
        }),
        position,
      })
    }
    current.setMonth(current.getMonth() + 1)
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Produktions-Timeline
      </h2>

      {/* Month markers */}
      <div className="relative mb-2 h-6 border-b border-gray-200">
        {months.map((m, idx) => (
          <div
            key={idx}
            className="absolute -top-0 text-xs text-gray-500"
            style={{ left: `${m.position}%` }}
          >
            <div className="h-6 w-px bg-gray-200" />
            <span className="ml-1">{m.label}</span>
          </div>
        ))}
        {todayPosition !== null && (
          <div
            className="absolute -top-0 z-10"
            style={{ left: `${todayPosition}%` }}
          >
            <div className="h-6 w-0.5 bg-primary-500" />
            <span className="ml-1 text-xs font-medium text-primary-600">
              Heute
            </span>
          </div>
        )}
      </div>

      {/* Timeline rows */}
      <div className="space-y-4 pt-8">
        {withDates.map((p) => {
          const startDate = p.proben_start || p.premiere || p.derniere
          const endDate = p.derniere || p.premiere || p.proben_start

          if (!startDate || !endDate) return null

          const startPos = getPosition(startDate)
          const width = getBarWidth(startDate, endDate)

          return (
            <div key={p.id} className="relative h-8">
              {/* Production bar */}
              <Link
                href={`/produktionen/${p.id}` as Route}
                className={`absolute flex h-6 items-center rounded px-2 text-xs font-medium text-white transition-transform hover:scale-[1.02] ${STATUS_COLORS[p.status]}`}
                style={{
                  left: `${startPos}%`,
                  width: `${Math.max(width, 10)}%`,
                  minWidth: '100px',
                }}
                title={`${p.titel} (${PRODUKTION_STATUS_LABELS[p.status]})`}
              >
                <span className="truncate">{p.titel}</span>
              </Link>

              {/* Milestone markers */}
              {p.proben_start && (
                <div
                  className="absolute top-0 h-6 w-1 rounded-sm bg-blue-600"
                  style={{ left: `${getPosition(p.proben_start)}%` }}
                  title={`Probenstart: ${new Date(p.proben_start).toLocaleDateString('de-CH')}`}
                />
              )}
              {p.premiere && (
                <div
                  className="absolute top-0 h-6 w-1 rounded-sm bg-purple-600"
                  style={{ left: `${getPosition(p.premiere)}%` }}
                  title={`Premiere: ${new Date(p.premiere).toLocaleDateString('de-CH')}`}
                />
              )}
              {p.derniere && (
                <div
                  className="absolute top-0 h-6 w-1 rounded-sm bg-gray-600"
                  style={{ left: `${getPosition(p.derniere)}%` }}
                  title={`Derniere: ${new Date(p.derniere).toLocaleDateString('de-CH')}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-1 rounded-sm bg-blue-600" />
          <span className="text-gray-600">Probenstart</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-1 rounded-sm bg-purple-600" />
          <span className="text-gray-600">Premiere</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-1 rounded-sm bg-gray-600" />
          <span className="text-gray-600">Derniere</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-0.5 bg-primary-500" />
          <span className="text-gray-600">Heute</span>
        </div>
      </div>
    </div>
  )
}
