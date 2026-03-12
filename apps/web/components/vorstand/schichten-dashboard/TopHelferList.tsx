import { Trophy, Medal, Award } from 'lucide-react'
import type { TopHelfer } from '@/lib/supabase/types'

// =============================================================================
// Types
// =============================================================================

interface TopHelferListProps {
  helfer: TopHelfer[]
}

// =============================================================================
// Component
// =============================================================================

/**
 * Top 10 Helfer leaderboard showing the most active helpers
 * ranked by number of assigned shifts across all upcoming performances.
 * Features medal icons for top 3 and relative bar charts for visual flair.
 */
export function TopHelferList({ helfer }: TopHelferListProps) {
  if (helfer.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
          <Trophy className="h-5 w-5 text-amber-500" />
          Top 10 Helfer
        </h3>
        <p className="mt-3 text-sm text-neutral-500">
          Noch keine Schichtzuweisungen vorhanden
        </p>
      </div>
    )
  }

  const maxCount = helfer[0].schichten_count

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
        <Trophy className="h-5 w-5 text-amber-500" />
        Top 10 Helfer
      </h3>
      <p className="mt-0.5 text-xs text-neutral-500">
        Meiste Schichtzuweisungen (kommende Aufführungen)
      </p>

      <div className="mt-4 space-y-2">
        {helfer.map((h, index) => (
          <HelferRow
            key={h.id}
            helfer={h}
            rank={index + 1}
            maxCount={maxCount}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// HelferRow
// =============================================================================

function HelferRow({
  helfer,
  rank,
  maxCount,
}: {
  helfer: TopHelfer
  rank: number
  maxCount: number
}) {
  const barWidth = maxCount > 0
    ? Math.max(8, Math.round((helfer.schichten_count / maxCount) * 100))
    : 0

  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50">
      {/* Rank indicator */}
      <div className="flex w-7 shrink-0 justify-center">
        <RankBadge rank={rank} />
      </div>

      {/* Name and type */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-neutral-900">
            {helfer.name}
          </span>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
              helfer.typ === 'intern'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-secondary-100 text-secondary-700'
            }`}
          >
            {helfer.typ === 'intern' ? 'Intern' : 'Extern'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full transition-all ${barColorClass(rank)}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Count */}
      <div className="shrink-0 text-right">
        <span className="text-sm font-semibold tabular-nums text-neutral-700">
          {helfer.schichten_count}
        </span>
        <span className="ml-0.5 text-xs text-neutral-400">
          {helfer.schichten_count === 1 ? 'Schicht' : 'Schichten'}
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// Rank Badge - medals for top 3, numbers for the rest
// =============================================================================

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
        <Trophy className="h-4 w-4 text-amber-600" />
      </div>
    )
  }

  if (rank === 2) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100">
        <Medal className="h-4 w-4 text-neutral-500" />
      </div>
    )
  }

  if (rank === 3) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50">
        <Award className="h-4 w-4 text-orange-500" />
      </div>
    )
  }

  return (
    <span className="text-xs font-medium text-neutral-400">
      {rank}
    </span>
  )
}

// =============================================================================
// Helpers
// =============================================================================

/** Gradient bar colors - gold/silver/bronze for top 3, neutral for rest */
function barColorClass(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-r from-amber-400 to-amber-500'
  if (rank === 2) return 'bg-gradient-to-r from-neutral-300 to-neutral-400'
  if (rank === 3) return 'bg-gradient-to-r from-orange-300 to-orange-400'
  return 'bg-primary-300'
}
