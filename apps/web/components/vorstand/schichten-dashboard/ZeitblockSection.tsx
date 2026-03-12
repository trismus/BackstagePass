import type { DashboardZeitblock } from '@/lib/supabase/types'
import { SchichtRow } from './SchichtRow'

// =============================================================================
// Types
// =============================================================================

interface ZeitblockSectionProps {
  zeitblock: DashboardZeitblock
}

// =============================================================================
// Typ label mapping
// =============================================================================

const TYP_LABELS: Record<string, string> = {
  aufbau: 'Aufbau',
  einlass: 'Einlass',
  vorfuehrung: 'Vorführung',
  pause: 'Pause',
  abbau: 'Abbau',
  standard: '',
}

const TYP_COLORS: Record<string, string> = {
  aufbau: 'border-l-warning-500',
  einlass: 'border-l-info-500',
  vorfuehrung: 'border-l-success-500',
  pause: 'border-l-neutral-400',
  abbau: 'border-l-warning-500',
  standard: 'border-l-primary-500',
}

// =============================================================================
// Component
// =============================================================================

/**
 * Groups Schichten under a Zeitblock with time range and type indicator.
 */
export function ZeitblockSection({ zeitblock }: ZeitblockSectionProps) {
  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  const typLabel = TYP_LABELS[zeitblock.typ] || ''
  const borderColor = TYP_COLORS[zeitblock.typ] || 'border-l-neutral-300'

  const totalSoll = zeitblock.schichten.reduce((s, sch) => s + sch.anzahl_benoetigt, 0)
  const totalIst = zeitblock.schichten.reduce((s, sch) => s + sch.zuweisungen.length, 0)

  return (
    <div className={`border-l-4 ${borderColor} pl-3`}>
      {/* Zeitblock header */}
      <div className="flex items-center gap-3">
        <h4 className="text-sm font-semibold text-neutral-800">
          {zeitblock.name}
        </h4>
        {zeitblock.startzeit && zeitblock.endzeit && (
          <span className="text-xs text-neutral-500">
            {formatTime(zeitblock.startzeit)} – {formatTime(zeitblock.endzeit)}
          </span>
        )}
        {typLabel && (
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
            {typLabel}
          </span>
        )}
        <span className="text-xs text-neutral-400">
          {totalIst}/{totalSoll} besetzt
        </span>
      </div>

      {/* Schichten */}
      {zeitblock.schichten.length > 0 ? (
        <div className="mt-2 space-y-2">
          {zeitblock.schichten.map((schicht) => (
            <SchichtRow key={schicht.id} schicht={schicht} />
          ))}
        </div>
      ) : (
        <p className="mt-1 text-xs text-neutral-400">
          Keine Schichten definiert
        </p>
      )}
    </div>
  )
}
