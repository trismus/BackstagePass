'use client'

import { PublicSchichtCard } from './PublicSchichtCard'
import type { PublicZeitblockData } from '@/lib/actions/external-registration'

interface PublicZeitblockGroupProps {
  zeitblock: PublicZeitblockData
  onRegister: (schichtId: string) => void
  disabled?: boolean
}

export function PublicZeitblockGroup({
  zeitblock,
  onRegister,
  disabled = false,
}: PublicZeitblockGroupProps) {
  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5)
  }

  const totalSlots = zeitblock.schichten.reduce(
    (sum, s) => sum + s.anzahl_benoetigt,
    0
  )
  const totalFree = zeitblock.schichten.reduce(
    (sum, s) => sum + s.freie_plaetze,
    0
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{zeitblock.name}</h3>
            <p className="text-sm text-gray-500">
              {formatTime(zeitblock.startzeit)} - {formatTime(zeitblock.endzeit)} Uhr
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-sm font-medium ${
                totalFree > 0 ? 'text-success-600' : 'text-gray-400'
              }`}
            >
              {totalFree > 0
                ? `${totalFree} ${totalFree === 1 ? 'Platz' : 'Plätze'} frei`
                : 'Alle belegt'}
            </span>
            <p className="text-xs text-gray-400">
              von {totalSlots} gesamt
            </p>
          </div>
        </div>
      </div>

      {/* Schichten */}
      <div className="space-y-3 p-4">
        {zeitblock.schichten.map((schicht) => (
          <PublicSchichtCard
            key={schicht.id}
            schicht={schicht}
            onRegister={onRegister}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
