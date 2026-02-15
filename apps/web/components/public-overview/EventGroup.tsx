'use client'

import { useState } from 'react'
import { SelectableSchichtCard } from './SelectableSchichtCard'
import type { PublicOverviewEventData } from '@/lib/actions/public-overview'

interface EventGroupProps {
  event: PublicOverviewEventData
  selectedSchichtIds: Set<string>
  onToggleSchicht: (schichtId: string) => void
}

export function EventGroup({
  event,
  selectedSchichtIds,
  onToggleSchicht,
}: EventGroupProps) {
  const { veranstaltung, zeitbloecke } = event
  const [showFull, setShowFull] = useState(false)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null
    return timeStr.slice(0, 5)
  }

  // Flatten all shifts across Zeitblöcke
  const allSchichten = zeitbloecke.flatMap((zb) =>
    zb.schichten.map((s) => ({ ...s, zeitblockName: zb.name, zeitblockStart: zb.startzeit, zeitblockEnd: zb.endzeit }))
  )
  const availableSchichten = allSchichten.filter((s) => s.freie_plaetze > 0)
  const fullSchichten = allSchichten.filter((s) => s.freie_plaetze <= 0)
  const totalFree = availableSchichten.reduce((sum, s) => sum + s.freie_plaetze, 0)

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Event Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {veranstaltung.titel}
          </h3>
          {totalFree > 0 ? (
            <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              {totalFree} {totalFree === 1 ? 'Platz' : 'Plätze'} frei
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              Alles besetzt
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          <span>{formatDate(veranstaltung.datum)}</span>
          {veranstaltung.startzeit && (
            <span>
              {formatTime(veranstaltung.startzeit)}
              {veranstaltung.endzeit &&
                ` - ${formatTime(veranstaltung.endzeit)}`}{' '}
              Uhr
            </span>
          )}
          {veranstaltung.ort && <span>{veranstaltung.ort}</span>}
        </div>
      </div>

      {/* All shifts in one grid */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
          {availableSchichten.map((schicht) => (
            <SelectableSchichtCard
              key={schicht.id}
              schicht={schicht}
              isSelected={selectedSchichtIds.has(schicht.id)}
              onToggle={onToggleSchicht}
              zeitblockLabel={`${schicht.zeitblockStart.slice(0, 5)}–${schicht.zeitblockEnd.slice(0, 5)}`}
            />
          ))}
          {showFull &&
            fullSchichten.map((schicht) => (
              <SelectableSchichtCard
                key={schicht.id}
                schicht={schicht}
                isSelected={false}
                onToggle={onToggleSchicht}
                zeitblockLabel={`${schicht.zeitblockStart.slice(0, 5)}–${schicht.zeitblockEnd.slice(0, 5)}`}
              />
            ))}
        </div>
        {fullSchichten.length > 0 && (
          <button
            type="button"
            onClick={() => setShowFull((prev) => !prev)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            {showFull
              ? 'Belegte Rollen ausblenden'
              : `${fullSchichten.length} belegte ${fullSchichten.length === 1 ? 'Rolle' : 'Rollen'} anzeigen`}
          </button>
        )}
      </div>
    </div>
  )
}
