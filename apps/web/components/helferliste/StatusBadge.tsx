import type { HelferAnmeldungStatus, ZuweisungStatus } from '@/lib/supabase/types'
import { HELFER_ANMELDUNG_STATUS_LABELS } from '@/lib/supabase/types'

type StatusBadgeStatus = HelferAnmeldungStatus | ZuweisungStatus

interface StatusBadgeProps {
  status: StatusBadgeStatus
}

/** Labels for ZuweisungStatus values that differ from HelferAnmeldungStatus */
const ZUWEISUNG_STATUS_LABELS: Partial<Record<ZuweisungStatus, string>> = {
  vorgeschlagen: 'Vorgeschlagen',
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
  erschienen: 'Erschienen',
  nicht_erschienen: 'Nicht erschienen',
}

/** Style mapping for all possible status values */
const STATUS_STYLES: Record<string, string> = {
  // System A (HelferAnmeldungStatus)
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
  // Check System A labels first
  if (status in HELFER_ANMELDUNG_STATUS_LABELS) {
    return HELFER_ANMELDUNG_STATUS_LABELS[status as HelferAnmeldungStatus]
  }
  // Then System B labels
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
