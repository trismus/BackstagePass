'use client'

import type { ProbeTeilnehmer, TeilnehmerStatus } from '@/lib/supabase/types'

interface TeilnahmeUebersichtProps {
  teilnehmer: (ProbeTeilnehmer & {
    person: {
      id: string
      vorname: string
      nachname: string
      email: string | null
    }
  })[]
}

const statusConfig: Record<
  TeilnehmerStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  zugesagt: {
    label: 'Zugesagt',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: '✓',
  },
  vielleicht: {
    label: 'Vielleicht',
    color: 'text-amber-800',
    bgColor: 'bg-amber-100',
    icon: '?',
  },
  eingeladen: {
    label: 'Offen',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    icon: '○',
  },
  abgesagt: {
    label: 'Abgesagt',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    icon: '×',
  },
  erschienen: {
    label: 'Erschienen',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: '✓',
  },
  nicht_erschienen: {
    label: 'Nicht erschienen',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    icon: '×',
  },
}

export function TeilnahmeUebersicht({ teilnehmer }: TeilnahmeUebersichtProps) {
  // Group by status
  const grouped: Record<TeilnehmerStatus, typeof teilnehmer> = {
    zugesagt: [],
    vielleicht: [],
    eingeladen: [],
    abgesagt: [],
    erschienen: [],
    nicht_erschienen: [],
  }

  teilnehmer.forEach((t) => {
    grouped[t.status].push(t)
  })

  // Calculate totals
  const kommen = grouped.zugesagt.length + grouped.erschienen.length
  const vielleicht = grouped.vielleicht.length
  const fehlen = grouped.abgesagt.length + grouped.nicht_erschienen.length
  const offen = grouped.eingeladen.length
  const total = teilnehmer.length

  // Order for display: zugesagt, erschienen, vielleicht, eingeladen, abgesagt, nicht_erschienen
  const displayOrder: TeilnehmerStatus[] = [
    'zugesagt',
    'erschienen',
    'vielleicht',
    'eingeladen',
    'abgesagt',
    'nicht_erschienen',
  ]

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Stats Header */}
      <div className="grid grid-cols-4 gap-4 border-b border-gray-200 p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{kommen}</div>
          <div className="text-sm text-gray-500">Kommen</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{vielleicht}</div>
          <div className="text-sm text-gray-500">Vielleicht</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-500">{offen}</div>
          <div className="text-sm text-gray-500">Offen</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{fehlen}</div>
          <div className="text-sm text-gray-500">Fehlen</div>
        </div>
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="px-4 py-3">
          <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
            {kommen > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${(kommen / total) * 100}%` }}
              />
            )}
            {vielleicht > 0 && (
              <div
                className="bg-amber-500"
                style={{ width: `${(vielleicht / total) * 100}%` }}
              />
            )}
            {offen > 0 && (
              <div
                className="bg-gray-400"
                style={{ width: `${(offen / total) * 100}%` }}
              />
            )}
            {fehlen > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${(fehlen / total) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Grouped Lists */}
      <div className="divide-y divide-gray-100">
        {displayOrder.map((status) => {
          const group = grouped[status]
          if (group.length === 0) return null

          const config = statusConfig[status]

          return (
            <div key={status} className="px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${config.bgColor} ${config.color}`}
                >
                  {config.icon}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {config.label} ({group.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-full px-3 py-1 text-sm ${config.bgColor} ${config.color}`}
                    title={t.absage_grund ? `Grund: ${t.absage_grund}` : undefined}
                  >
                    {t.person.vorname} {t.person.nachname}
                    {t.absage_grund && (
                      <span className="ml-1 opacity-70">*</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend for absage_grund */}
      {teilnehmer.some((t) => t.absage_grund) && (
        <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
          * Absagegrund angegeben
        </div>
      )}
    </div>
  )
}
