'use client'

import type { PublicSchichtData } from '@/lib/actions/external-registration'

interface SelectableSchichtCardProps {
  schicht: PublicSchichtData
  isSelected: boolean
  onToggle: (schichtId: string) => void
}

export function SelectableSchichtCard({
  schicht,
  isSelected,
  onToggle,
}: SelectableSchichtCardProps) {
  const isFull = schicht.freie_plaetze <= 0
  const slotsText = isFull
    ? 'Alle Plätze belegt'
    : `${schicht.freie_plaetze} von ${schicht.anzahl_benoetigt} ${schicht.freie_plaetze === 1 ? 'Platz' : 'Plätze'} frei`

  return (
    <button
      type="button"
      disabled={isFull}
      onClick={() => onToggle(schicht.id)}
      className={`w-full rounded-lg border p-4 text-left transition-all ${
        isFull
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
          : isSelected
            ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
            : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
            isFull
              ? 'border-gray-300 bg-gray-100'
              : isSelected
                ? 'border-primary-600 bg-primary-600'
                : 'border-gray-300 bg-white'
          }`}
        >
          {isSelected && (
            <svg
              className="h-3.5 w-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{schicht.rolle}</h4>
          <p
            className={`text-sm ${isFull ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {slotsText}
          </p>
        </div>

        {isFull && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            Belegt
          </span>
        )}
      </div>

      {/* Slot indicator */}
      <div className="mt-3 pl-8">
        <div className="flex gap-1">
          {Array.from({ length: schicht.anzahl_benoetigt }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < schicht.anzahl_belegt ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </button>
  )
}
