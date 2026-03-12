import type { HelferEventBelegung } from '@/lib/supabase/types'
import { HelferlisteOverview } from '../helferliste/HelferlisteOverview'

// =============================================================================
// Types
// =============================================================================

interface LegacyHelferlisteTabProps {
  events: HelferEventBelegung[]
  error?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * Wraps the existing System A HelferlisteOverview with a read-only notice.
 * System A is frozen - no new features, existing data remains accessible.
 */
export function LegacyHelferlisteTab({ events, error }: LegacyHelferlisteTabProps) {
  return (
    <div className="space-y-4">
      {/* System A notice */}
      <div className="rounded-lg border border-info-200 bg-info-50 px-4 py-3">
        <p className="text-sm text-info-800">
          <span className="font-medium">Bisheriges System (System A)</span>
          {' '}&mdash; Diese Daten stammen aus dem bisherigen Helfersystem und sind schreibgeschützt.
          Neue Helfer-Events werden im aktuellen System (Zeitblöcke/Schichten) verwaltet.
        </p>
      </div>

      {/* Existing overview component */}
      <HelferlisteOverview events={events} error={error} />
    </div>
  )
}
