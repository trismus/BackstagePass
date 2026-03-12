'use client'

import type { AmpelStatus } from '@/lib/supabase/types'

// =============================================================================
// Types
// =============================================================================

interface DashboardFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  ampelFilter: AmpelStatus | 'alle'
  onAmpelFilterChange: (filter: AmpelStatus | 'alle') => void
}

// =============================================================================
// Component
// =============================================================================

/**
 * Filter bar with search input and Ampel status filter buttons.
 */
export function DashboardFilter({
  searchQuery,
  onSearchChange,
  ampelFilter,
  onAmpelFilterChange,
}: DashboardFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <input
        type="text"
        placeholder="Aufführung, Schicht oder Helfer suchen..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-72 rounded-lg border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {/* Ampel filter buttons */}
      <div className="flex gap-1">
        {([
          { key: 'alle' as const, label: 'Alle' },
          { key: 'rot' as const, label: 'Kritisch' },
          { key: 'gelb' as const, label: 'Teilweise' },
          { key: 'gruen' as const, label: 'Voll besetzt' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onAmpelFilterChange(key)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              ampelFilter === key
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
