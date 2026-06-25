import type { ZuweisungStatus } from '@/lib/supabase/types'

interface StatusBadgeProps {
  status: ZuweisungStatus
}

/** Labels for ZuweisungStatus values (System B). */
const ZUWEISUNG_STATUS_LABELS: Partial<Record<ZuweisungStatus, string>> = {
  vorgeschlagen: 'Vorgeschlagen',
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
  erschienen: 'Erschienen',
  nicht_erschienen: 'Nicht erschienen',
}

const STATUS_STYLES: Record<string, string> = {
  vorgeschlagen: 'bg-warning-100 text-warning-700',
  zugesagt: 'bg-success-100 text-success-700',
  abgesagt: 'bg-error-100 text-error-700',
  erschienen: 'bg-success-100 text-success-700',
  nicht_erschienen: 'bg-error-100 text-error-700',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700'
  const label = ZUWEISUNG_STATUS_LABELS[status] ?? status

  return (
    <span className={`rounded px-2 py-0.5 text-xs ${style}`}>
      {label}
    </span>
  )
}
