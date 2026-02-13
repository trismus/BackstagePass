'use client'

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

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Event Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {veranstaltung.titel}
        </h3>
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
        {zeitbloecke.map((zeitblock) => (
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
            <div className="space-y-2">
              {zeitblock.schichten.map((schicht) => (
                <SelectableSchichtCard
                  key={schicht.id}
                  schicht={schicht}
                  isSelected={selectedSchichtIds.has(schicht.id)}
                  onToggle={onToggleSchicht}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
