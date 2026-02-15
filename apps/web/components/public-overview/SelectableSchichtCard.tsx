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
      <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-gray-400">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-100">
          <svg
            className="h-3 w-3 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 12H6"
            />
          </svg>
        </div>
        <span className="flex-1 text-sm">{schicht.rolle}</span>
        <span className="text-xs">{slotsText}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(schicht.id)}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          isSelected
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

      <span className="flex-1 text-sm font-medium text-gray-900">
        {schicht.rolle}
      </span>

      <span className="text-xs text-gray-500">{slotsText}</span>
    </button>
  )
}
