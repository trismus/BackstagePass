import type { HelfereinsatzStatus, HelferschichtStatus } from '@/lib/supabase/types'

const statusConfig: Record<HelfereinsatzStatus, { label: string; className: string }> = {
  offen: { label: 'Offen', className: 'bg-blue-100 text-blue-800' },
  bestaetigt: { label: 'Bestätigt', className: 'bg-green-100 text-green-800' },
  abgeschlossen: { label: 'Abgeschlossen', className: 'bg-gray-100 text-gray-800' },
  abgesagt: { label: 'Abgesagt', className: 'bg-red-100 text-red-800' },
}

const schichtStatusConfig: Record<HelferschichtStatus, { label: string; className: string }> = {
  zugesagt: { label: 'Zugesagt', className: 'bg-blue-100 text-blue-800' },
  abgesagt: { label: 'Abgesagt', className: 'bg-red-100 text-red-800' },
  erschienen: { label: 'Erschienen', className: 'bg-green-100 text-green-800' },
  nicht_erschienen: { label: 'Nicht erschienen', className: 'bg-yellow-100 text-yellow-800' },
}

interface HelfereinsatzStatusBadgeProps {
  status: HelfereinsatzStatus
}

export function HelfereinsatzStatusBadge({ status }: HelfereinsatzStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

interface HelferschichtStatusBadgeProps {
  status: HelferschichtStatus
}

export function HelferschichtStatusBadge({ status }: HelferschichtStatusBadgeProps) {
  const config = schichtStatusConfig[status]
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
