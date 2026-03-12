import type { DashboardSchicht, AmpelStatus } from '@/lib/supabase/types'
import { HelferBadge } from './HelferBadge'

// =============================================================================
// Types
// =============================================================================

interface SchichtRowProps {
  schicht: DashboardSchicht
}

// =============================================================================
// Component
// =============================================================================

/**
 * Displays a single Schicht (shift) row with occupancy bar,
 * assigned helpers, and open slots indicator.
 */
export function SchichtRow({ schicht }: SchichtRowProps) {
  const besetzt = schicht.zuweisungen.length
  const benoetigt = schicht.anzahl_benoetigt
  const fillPct = benoetigt > 0
    ? Math.min(100, Math.round((besetzt / benoetigt) * 100))
    : 100

  const ampel: AmpelStatus =
    besetzt >= benoetigt ? 'gruen' : besetzt >= benoetigt * 0.5 ? 'gelb' : 'rot'

  const barColor: Record<AmpelStatus, string> = {
    gruen: 'bg-success-500',
    gelb: 'bg-amber-400',
    rot: 'bg-red-400',
  }

  const dotColor: Record<AmpelStatus, string> = {
    gruen: 'bg-success-500',
    gelb: 'bg-amber-400',
    rot: 'bg-red-400',
  }

  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-3">
      {/* Header row: rolle name + occupancy */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotColor[ampel]}`} />
          <span className="text-sm font-medium text-neutral-900">{schicht.rolle}</span>
          {schicht.sichtbarkeit === 'public' && (
            <span className="rounded bg-info-100 px-1.5 py-0.5 text-xs text-info-700">
              Öffentlich
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">
            {besetzt}/{benoetigt}
          </span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
            <div
              className={`h-full rounded-full transition-all ${barColor[ampel]}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assigned helpers */}
      {schicht.zuweisungen.length > 0 && (
        <div className="mt-2 space-y-1 pl-5">
          {schicht.zuweisungen.map((z) => (
            <HelferBadge key={z.id} zuweisung={z} showContact />
          ))}
        </div>
      )}

      {/* Open slots */}
      {schicht.offene_plaetze > 0 && (
        <div className="mt-2 pl-5">
          <span className="text-xs text-red-600">
            {schicht.offene_plaetze} {schicht.offene_plaetze === 1 ? 'Platz' : 'Plätze'} offen
          </span>
        </div>
      )}
    </div>
  )
}
