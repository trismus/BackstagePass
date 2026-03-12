import type { DashboardHelferZuweisung } from '@/lib/supabase/types'

// =============================================================================
// Types
// =============================================================================

interface HelferBadgeProps {
  zuweisung: DashboardHelferZuweisung
  /** Show contact info (email/phone) for external helpers */
  showContact?: boolean
}

// =============================================================================
// Status label mapping
// =============================================================================

const STATUS_LABELS: Record<string, string> = {
  vorgeschlagen: 'Vorgeschlagen',
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
  erschienen: 'Erschienen',
  nicht_erschienen: 'Nicht erschienen',
}

const STATUS_COLORS: Record<string, string> = {
  vorgeschlagen: 'bg-amber-50 text-amber-700',
  zugesagt: 'bg-success-50 text-success-700',
  abgesagt: 'bg-red-50 text-red-700',
  erschienen: 'bg-success-50 text-success-700',
  nicht_erschienen: 'bg-red-50 text-red-700',
}

// =============================================================================
// Component
// =============================================================================

/**
 * Displays a single helper assignment with type badge (Intern/Extern),
 * name, status, and optional contact info.
 */
export function HelferBadge({ zuweisung, showContact = false }: HelferBadgeProps) {
  const isExtern = zuweisung.typ === 'extern'

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Type badge */}
      <span
        className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs font-medium ${
          isExtern
            ? 'bg-purple-100 text-purple-700'
            : 'bg-primary-100 text-primary-700'
        }`}
      >
        {isExtern ? 'Extern' : 'Intern'}
      </span>

      {/* Name */}
      <span className="truncate font-medium text-neutral-900">
        {zuweisung.name}
      </span>

      {/* Status */}
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
          STATUS_COLORS[zuweisung.status] || 'bg-neutral-100 text-neutral-600'
        }`}
      >
        {STATUS_LABELS[zuweisung.status] || zuweisung.status}
      </span>

      {/* Contact info for external helpers */}
      {showContact && isExtern && (zuweisung.email || zuweisung.telefon) && (
        <span className="truncate text-xs text-neutral-500">
          {zuweisung.email && (
            <a href={`mailto:${zuweisung.email}`} className="hover:text-primary-600">
              {zuweisung.email}
            </a>
          )}
          {zuweisung.email && zuweisung.telefon && ' · '}
          {zuweisung.telefon}
        </span>
      )}
    </div>
  )
}
