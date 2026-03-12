import type { SchichtenDashboardStats, AmpelStatus } from '@/lib/supabase/types'

// =============================================================================
// Types
// =============================================================================

interface DashboardStatsProps {
  stats: SchichtenDashboardStats
  auffuehrungenCount: number
}

// =============================================================================
// Component
// =============================================================================

/**
 * Aggregated stats cards at the top of the Schichten-Dashboard.
 * Shows total shifts, occupancy breakdown by Ampel, and overall fill rate.
 */
export function DashboardStats({ stats, auffuehrungenCount }: DashboardStatsProps) {
  const quoteBadgeColor: AmpelStatus =
    stats.belegungsquote >= 100
      ? 'gruen'
      : stats.belegungsquote >= 50
        ? 'gelb'
        : 'rot'

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {/* Aufführungen */}
      <StatCard label="Aufführungen" value={auffuehrungenCount} />

      {/* Total Schichten */}
      <StatCard label="Schichten total" value={stats.total_schichten} />

      {/* Voll besetzt (grün) */}
      <StatCard
        label="Voll besetzt"
        value={stats.besetzt_voll}
        badge={stats.total_schichten > 0
          ? `${Math.round((stats.besetzt_voll / stats.total_schichten) * 100)}%`
          : undefined}
        badgeColor="gruen"
      />

      {/* Kritisch (rot) */}
      <StatCard
        label="Kritisch"
        value={stats.besetzt_kritisch}
        badge={stats.besetzt_kritisch > 0 ? 'Handlungsbedarf' : undefined}
        badgeColor={stats.besetzt_kritisch > 0 ? 'rot' : 'gruen'}
      />

      {/* Belegungsquote */}
      <StatCard
        label="Belegungsquote"
        value={`${stats.belegungsquote}%`}
        badge={
          stats.belegungsquote >= 100
            ? 'Komplett'
            : stats.belegungsquote >= 50
              ? 'Teilweise'
              : 'Kritisch'
        }
        badgeColor={quoteBadgeColor}
      />
    </div>
  )
}

// =============================================================================
// StatCard
// =============================================================================

function StatCard({
  label,
  value,
  badge,
  badgeColor,
}: {
  label: string
  value: number | string
  badge?: string
  badgeColor?: AmpelStatus
}) {
  const colorMap: Record<AmpelStatus, string> = {
    gruen: 'bg-success-100 text-success-700',
    gelb: 'bg-amber-100 text-amber-700',
    rot: 'bg-red-100 text-red-700',
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold text-neutral-900">{value}</span>
        {badge && badgeColor && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}
