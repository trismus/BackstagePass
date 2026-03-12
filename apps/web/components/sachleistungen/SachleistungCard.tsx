'use client'

import type { SachleistungMitZusagen } from '@/lib/supabase/types'
import { SACHLEISTUNG_KATEGORIE_LABELS } from '@/lib/supabase/types'

interface SachleistungCardProps {
  sachleistung: SachleistungMitZusagen
  /** Show pledge button */
  onPledge?: (sachleistungId: string) => void
  /** Compact mode for summaries */
  compact?: boolean
}

/**
 * Single sachleistung card with progress bar showing
 * how many are pledged vs. needed.
 */
export function SachleistungCard({
  sachleistung,
  onPledge,
  compact = false,
}: SachleistungCardProps) {
  const { name, anzahl, beschreibung, kategorie, zugesagt_anzahl, offen_anzahl } = sachleistung
  const fillPct = anzahl > 0 ? Math.min(100, Math.round((zugesagt_anzahl / anzahl) * 100)) : 100
  const isFull = offen_anzahl <= 0

  const barColor = isFull
    ? 'bg-success-500'
    : fillPct >= 50
      ? 'bg-amber-400'
      : 'bg-red-400'

  const kategorieLabel = SACHLEISTUNG_KATEGORIE_LABELS[kategorie] || kategorie

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 py-1.5">
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-neutral-800">{name}</span>
          <span className="ml-2 text-xs text-neutral-500">
            {zugesagt_anzahl}/{anzahl}
          </span>
        </div>
        <div className="w-16">
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-neutral-900">{name}</h4>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              {kategorieLabel}
            </span>
          </div>
          {beschreibung && (
            <p className="mt-1 text-sm text-neutral-500">{beschreibung}</p>
          )}
        </div>

        {onPledge && !isFull && (
          <button
            type="button"
            onClick={() => onPledge(sachleistung.id)}
            className="shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Ich bringe etwas mit
          </button>
        )}
        {isFull && (
          <span className="shrink-0 rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-700">
            Komplett
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            {zugesagt_anzahl} von {anzahl} zugesagt
          </span>
          {offen_anzahl > 0 && (
            <span className="font-medium text-neutral-700">
              Noch {offen_anzahl} benötigt
            </span>
          )}
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
