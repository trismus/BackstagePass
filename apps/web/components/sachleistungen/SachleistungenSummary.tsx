import type { SachleistungenSummaryData } from '@/lib/supabase/types'

interface SachleistungenSummaryProps {
  summary: SachleistungenSummaryData
}

/**
 * Compact summary showing sachleistungen status for dashboard accordion.
 * Displays total/pledged/open counts with a mini progress bar.
 */
export function SachleistungenSummary({ summary }: SachleistungenSummaryProps) {
  if (summary.total === 0) return null

  const fillPct = summary.total > 0
    ? Math.min(100, Math.round((summary.zugesagt / summary.total) * 100))
    : 100

  const isFull = summary.offen <= 0
  const barColor = isFull
    ? 'bg-success-500'
    : fillPct >= 50
      ? 'bg-amber-400'
      : 'bg-red-400'

  const dotColor = isFull
    ? 'bg-success-500'
    : fillPct >= 50
      ? 'bg-amber-400'
      : 'bg-red-400'

  return (
    <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
      <span className="text-sm text-neutral-700">
        Sachspenden: {summary.zugesagt}/{summary.total} zugesagt
      </span>
      {summary.offen > 0 && (
        <span className="text-xs text-neutral-500">
          ({summary.offen} offen)
        </span>
      )}
      <div className="ml-auto w-16">
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
