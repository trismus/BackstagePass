'use client'

import { useState } from 'react'
import type { PublicSchichtData } from '@/lib/actions/external-registration'

interface PublicSchichtCardProps {
  schicht: PublicSchichtData
  onRegister: (schichtId: string) => void
  disabled?: boolean
}

export function PublicSchichtCard({
  schicht,
  onRegister,
  disabled = false,
}: PublicSchichtCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const isFull = schicht.freie_plaetze <= 0
  const slotsText = isFull
    ? 'Alle Plätze belegt'
    : `${schicht.freie_plaetze} von ${schicht.anzahl_benoetigt} ${schicht.freie_plaetze === 1 ? 'Platz' : 'Plätze'} frei`

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        isFull
          ? 'border-gray-200 bg-gray-50'
          : 'border-primary-200 bg-white hover:border-primary-300 hover:shadow-sm'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{schicht.rolle}</h4>
          <p className={`text-sm ${isFull ? 'text-gray-400' : 'text-gray-600'}`}>
            {slotsText}
          </p>
        </div>

        {!isFull && (
          <button
            onClick={() => onRegister(schicht.id)}
            disabled={disabled}
            className={`ml-4 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              isHovered
                ? 'bg-primary-600 text-white'
                : 'bg-primary-50 text-primary-700'
            } hover:bg-primary-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Anmelden
          </button>
        )}

        {isFull && (
          <span className="ml-4 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            Belegt
          </span>
        )}
      </div>

      {/* Slot indicator */}
      <div className="mt-3">
        <div className="flex gap-1">
          {Array.from({ length: schicht.anzahl_benoetigt }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < schicht.anzahl_belegt
                  ? 'bg-primary-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
