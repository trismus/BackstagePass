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
  const [showFullByBlock, setShowFullByBlock] = useState<Set<string>>(new Set())

  const toggleShowFull = (zeitblockId: string) => {
    setShowFullByBlock((prev) => {
      const next = new Set(prev)
      if (next.has(zeitblockId)) {
        next.delete(zeitblockId)
      } else {
        next.add(zeitblockId)
      }
      return next
    })
  }

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

  // Calculate total free slots across all shifts
  const totalFree = zeitbloecke.reduce(
    (sum, zb) =>
      sum + zb.schichten.reduce((s, sch) => s + Math.max(0, sch.freie_plaetze), 0),
    0
  )

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

      {/* Zeitbloecke with Schichten */}
      <div className="divide-y divide-gray-100">
        {zeitbloecke.map((zeitblock) => {
          const availableSchichten = zeitblock.schichten.filter(
            (s) => s.freie_plaetze > 0
          )
          const fullSchichten = zeitblock.schichten.filter(
            (s) => s.freie_plaetze <= 0
          )
          const showingFull = showFullByBlock.has(zeitblock.id)

          return (
            <div key={zeitblock.id} className="px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">
                  {zeitblock.name}
                </h4>
                <span className="text-xs text-gray-400">
                  {zeitblock.startzeit.slice(0, 5)} -{' '}
                  {zeitblock.endzeit.slice(0, 5)} Uhr
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {availableSchichten.map((schicht) => (
                  <SelectableSchichtCard
                    key={schicht.id}
                    schicht={schicht}
                    isSelected={selectedSchichtIds.has(schicht.id)}
                    onToggle={onToggleSchicht}
                  />
                ))}
                {showingFull &&
                  fullSchichten.map((schicht) => (
                    <SelectableSchichtCard
                      key={schicht.id}
                      schicht={schicht}
                      isSelected={false}
                      onToggle={onToggleSchicht}
                    />
                  ))}
              </div>
              {fullSchichten.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleShowFull(zeitblock.id)}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showingFull
                    ? 'Belegte Rollen ausblenden'
                    : `${fullSchichten.length} belegte ${fullSchichten.length === 1 ? 'Rolle' : 'Rollen'} anzeigen`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
