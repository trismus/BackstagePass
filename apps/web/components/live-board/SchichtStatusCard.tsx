'use client'

import type { LiveSchicht } from '@/lib/actions/live-board'

type SchichtStatusCardProps = {
  schicht: LiveSchicht
}

export function SchichtStatusCard({ schicht }: SchichtStatusCardProps) {
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  }

  const borderClasses = {
    green: 'border-green-500',
    yellow: 'border-yellow-500',
    orange: 'border-orange-500',
    red: 'border-red-500',
  }

  const statusDotClasses = {
    eingecheckt: 'bg-green-500',
    erwartet: 'bg-yellow-500',
    no_show: 'bg-red-500',
  }

  return (
    <div
      className={`rounded-lg border-l-4 bg-gray-800 p-4 ${borderClasses[schicht.statusColor]}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">{schicht.rolle}</h4>
        <span className="text-sm text-gray-400">
          {schicht.besetzt}/{schicht.benoetigt}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all ${colorClasses[schicht.statusColor]}`}
          style={{ width: `${Math.min(schicht.auslastung, 100)}%` }}
        />
      </div>

      {/* Helper Dots */}
      <div className="flex flex-wrap gap-2">
        {schicht.helfer.map((helfer) => (
          <div
            key={helfer.id}
            title={`${helfer.name}: ${helfer.status === 'eingecheckt' ? 'Eingecheckt' : helfer.status === 'no_show' ? 'No-Show' : 'Erwartet'}`}
            className="group relative"
          >
            <div
              className={`h-3 w-3 rounded-full ${statusDotClasses[helfer.status]}`}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white group-hover:block">
              {helfer.name}
            </div>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div className="mt-3 flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {schicht.eingecheckt} eingecheckt
        </span>
        {schicht.helfer.filter((h) => h.status === 'no_show').length > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {schicht.helfer.filter((h) => h.status === 'no_show').length} No-Show
          </span>
        )}
      </div>
    </div>
  )
}
