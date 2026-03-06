'use client'

import type { PublicOverviewRolle } from '@/lib/actions/public-overview'

interface SelectableSchichtCardProps {
  rolle: PublicOverviewRolle
  isSelected: boolean
  onToggle: (rolleId: string) => void
  zeitblockLabel?: string
}

export function SelectableSchichtCard({
  rolle,
  isSelected,
  onToggle,
  zeitblockLabel,
}: SelectableSchichtCardProps) {
  const rollenName = rolle.template?.name || rolle.custom_name || 'Unbekannt'
  const isFull = rolle.freie_plaetze <= 0
  const slotsText = isFull
    ? 'Belegt'
    : `${rolle.freie_plaetze} von ${rolle.anzahl_benoetigt} frei`

  if (isFull) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-gray-100 bg-gray-50 px-2 py-2 text-center text-gray-400">
        <span className="text-xs leading-tight">{rollenName}</span>
        {zeitblockLabel && (
          <span className="mt-0.5 text-[10px]">{zeitblockLabel}</span>
        )}
        <span className="mt-0.5 text-[10px]">{slotsText}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(rolle.id)}
      className={`relative flex flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
      }`}
    >
      {/* Selection indicator */}
      <div
        className={`absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-sm border transition-colors ${
          isSelected
            ? 'border-primary-600 bg-primary-600'
            : 'border-gray-300 bg-white'
        }`}
      >
        {isSelected && (
          <svg
            className="h-2.5 w-2.5 text-white"
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

      <span className="text-xs font-medium leading-tight text-gray-900">
        {rollenName}
      </span>
      {zeitblockLabel && (
        <span className="mt-0.5 text-[10px] text-gray-400">{zeitblockLabel}</span>
      )}
      <span className="mt-0.5 text-[10px] text-gray-500">{slotsText}</span>
    </button>
  )
}
