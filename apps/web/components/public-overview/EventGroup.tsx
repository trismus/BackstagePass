'use client'

import { useState } from 'react'
import { SelectableSchichtCard } from './SelectableSchichtCard'
import type { PublicOverviewEventData } from '@/lib/actions/public-overview'

interface EventGroupProps {
  event: PublicOverviewEventData
  selectedRolleIds: Set<string>
  onToggleRolle: (rolleId: string) => void
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EventGroup({
  event,
  selectedRolleIds,
  onToggleRolle,
}: EventGroupProps) {
  const { event: eventData, rollen } = event
  const [showFull, setShowFull] = useState(false)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const availableRollen = rollen.filter((r) => r.freie_plaetze > 0)
  const fullRollen = rollen.filter((r) => r.freie_plaetze <= 0)
  const totalFree = availableRollen.reduce((sum, r) => sum + r.freie_plaetze, 0)

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Event Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {eventData.name}
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
          <span>{formatDate(eventData.datum_start)}</span>
          <span>
            {formatTime(eventData.datum_start)}
            {eventData.datum_end &&
              ` - ${formatTime(eventData.datum_end)}`}{' '}
            Uhr
          </span>
          {eventData.ort && <span>{eventData.ort}</span>}
        </div>
      </div>

      {/* All roles in one grid */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
          {availableRollen.map((rolle) => {
            const zeitblockLabel =
              rolle.zeitblock_start && rolle.zeitblock_end
                ? `${formatTime(rolle.zeitblock_start)}–${formatTime(rolle.zeitblock_end)}`
                : undefined

            return (
              <SelectableSchichtCard
                key={rolle.id}
                rolle={rolle}
                isSelected={selectedRolleIds.has(rolle.id)}
                onToggle={onToggleRolle}
                zeitblockLabel={zeitblockLabel}
              />
            )
          })}
          {showFull &&
            fullRollen.map((rolle) => {
              const zeitblockLabel =
                rolle.zeitblock_start && rolle.zeitblock_end
                  ? `${formatTime(rolle.zeitblock_start)}–${formatTime(rolle.zeitblock_end)}`
                  : undefined

              return (
                <SelectableSchichtCard
                  key={rolle.id}
                  rolle={rolle}
                  isSelected={false}
                  onToggle={onToggleRolle}
                  zeitblockLabel={zeitblockLabel}
                />
              )
            })}
        </div>
        {fullRollen.length > 0 && (
          <button
            type="button"
            onClick={() => setShowFull((prev) => !prev)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            {showFull
              ? 'Belegte Rollen ausblenden'
              : `${fullRollen.length} belegte ${fullRollen.length === 1 ? 'Rolle' : 'Rollen'} anzeigen`}
          </button>
        )}
      </div>
    </div>
  )
}
