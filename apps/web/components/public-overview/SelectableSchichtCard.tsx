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
    ? 'Belegt'
    : `${schicht.freie_plaetze} von ${schicht.anzahl_benoetigt} frei`

  if (isFull) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-center text-gray-400">
        <span className="text-sm leading-tight">{schicht.rolle}</span>
        <span className="mt-1 text-xs">{slotsText}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(schicht.id)}
      className={`relative flex flex-col items-center justify-center rounded-lg border px-3 py-3 text-center transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
      }`}
    >
      {/* Selection indicator */}
      <div
        className={`absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${
          isSelected
            ? 'border-primary-600 bg-primary-600'
            : 'border-gray-300 bg-white'
        }`}
      >
        {isSelected && (
          <svg
            className="h-3 w-3 text-white"
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

      <span className="text-sm font-medium leading-tight text-gray-900">
        {schicht.rolle}
      </span>
      <span className="mt-1 text-xs text-gray-500">{slotsText}</span>
    </button>
  )
}
