import type {
  HelferAnmeldungStatus,
  ZuweisungStatus,
} from '@/lib/supabase/types'
import { HELFER_ANMELDUNG_STATUS_LABELS } from '@/lib/supabase/types'

// HelferDashboardAnmeldung may still carry HelferAnmeldungStatus values
// until System A types are removed (#475). New entries are System B only.
type StatusBadgeStatus = HelferAnmeldungStatus | ZuweisungStatus

interface StatusBadgeProps {
  status: StatusBadgeStatus
}

/** Labels for ZuweisungStatus values (System B). */
const ZUWEISUNG_STATUS_LABELS: Partial<Record<ZuweisungStatus, string>> = {
  vorgeschlagen: 'Vorgeschlagen',
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
  erschienen: 'Erschienen',
  nicht_erschienen: 'Nicht erschienen',
}

/** Style mapping for all currently displayable status values. */
const STATUS_STYLES: Record<string, string> = {
  // Legacy System A (read-only, displayed only in historical lists)
  angemeldet: 'bg-info-100 text-info-700',
  bestaetigt: 'bg-success-100 text-success-700',
  abgelehnt: 'bg-error-100 text-error-700',
  warteliste: 'bg-warning-100 text-warning-700',
  // System B (ZuweisungStatus)
  vorgeschlagen: 'bg-warning-100 text-warning-700',
  zugesagt: 'bg-success-100 text-success-700',
  abgesagt: 'bg-error-100 text-error-700',
  erschienen: 'bg-success-100 text-success-700',
  nicht_erschienen: 'bg-error-100 text-error-700',
}

function getStatusLabel(status: StatusBadgeStatus): string {
  if (status in HELFER_ANMELDUNG_STATUS_LABELS) {
    return HELFER_ANMELDUNG_STATUS_LABELS[status as HelferAnmeldungStatus]
  }
  return ZUWEISUNG_STATUS_LABELS[status as ZuweisungStatus] ?? status
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700'

  return (
    <span className={`rounded px-2 py-0.5 text-xs ${style}`}>
      {getStatusLabel(status)}
    </span>
  )
}
