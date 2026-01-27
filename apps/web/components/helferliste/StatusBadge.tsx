import type { HelferAnmeldungStatus } from '@/lib/supabase/types'
import { HELFER_ANMELDUNG_STATUS_LABELS } from '@/lib/supabase/types'

interface StatusBadgeProps {
  status: HelferAnmeldungStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<HelferAnmeldungStatus, string> = {
    angemeldet: 'bg-info-100 text-info-700',
    bestaetigt: 'bg-success-100 text-success-700',
    abgelehnt: 'bg-error-100 text-error-700',
    warteliste: 'bg-warning-100 text-warning-700',
  }

  return (
    <span className={`rounded px-2 py-0.5 text-xs ${styles[status]}`}>
      {HELFER_ANMELDUNG_STATUS_LABELS[status]}
    </span>
  )
}
