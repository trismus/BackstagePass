'use client'

import type { ZeitblockMitSchichten } from '@/lib/actions/helfer-anmeldung'
import { SchichtSlot } from './SchichtSlot'

interface ZeitblockCardProps {
  zeitblock: ZeitblockMitSchichten
  eigeneAnmeldungen: string[]
  isLoading: boolean
  onRegister: (schichtId: string) => void
  onUnregister: (schichtId: string) => void
}

export function ZeitblockCard({
  zeitblock,
  eigeneAnmeldungen,
  isLoading,
  onRegister,
  onUnregister,
}: ZeitblockCardProps) {
  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5)
  }

  // Determine background color based on typ
  const getTypStyles = () => {
    switch (zeitblock.typ) {
      case 'aufbau':
        return 'border-l-warning-500 bg-warning-50/30'
      case 'einlass':
        return 'border-l-info-500 bg-info-50/30'
      case 'vorfuehrung':
        return 'border-l-success-500 bg-success-50/30'
      case 'pause':
        return 'border-l-neutral-400 bg-neutral-50/30'
      case 'abbau':
        return 'border-l-warning-500 bg-warning-50/30'
      default:
        return 'border-l-primary-500 bg-white'
    }
  }

  const getTypLabel = () => {
    switch (zeitblock.typ) {
      case 'aufbau':
        return 'Aufbau'
      case 'einlass':
        return 'Einlass'
      case 'vorfuehrung':
        return 'Vorfuehrung'
      case 'pause':
        return 'Pause'
      case 'abbau':
        return 'Abbau'
      default:
        return null
    }
  }

  return (
    <div className={`rounded-lg border-l-4 shadow-sm ${getTypStyles()}`}>
      {/* Zeitblock Header */}
      <div className="border-b border-neutral-200/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-neutral-900">
              {zeitblock.name}
            </h3>
            {getTypLabel() && (
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {getTypLabel()}
              </span>
            )}
          </div>
          <span className="text-sm text-neutral-600">
            {formatTime(zeitblock.startzeit)} - {formatTime(zeitblock.endzeit)}
          </span>
        </div>
      </div>

      {/* Schichten */}
      <div className="p-4">
        {zeitblock.schichten.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-500">
            Keine Schichten in diesem Zeitblock
          </p>
        ) : (
          <div className="space-y-3">
            {zeitblock.schichten.map((schicht) => (
              <SchichtSlot
                key={schicht.id}
                schicht={schicht}
                isRegistered={eigeneAnmeldungen.includes(schicht.id)}
                isLoading={isLoading}
                onRegister={() => onRegister(schicht.id)}
                onUnregister={() => onUnregister(schicht.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
