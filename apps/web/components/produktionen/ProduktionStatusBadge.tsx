import type { ProduktionStatus } from '@/lib/supabase/types'
import { PRODUKTION_STATUS_LABELS } from '@/lib/supabase/types'

const statusConfig: Record<
  ProduktionStatus,
  { className: string }
> = {
  draft: { className: 'bg-gray-100 text-gray-700' },
  planung: { className: 'bg-blue-100 text-blue-700' },
  casting: { className: 'bg-amber-100 text-amber-700' },
  proben: { className: 'bg-indigo-100 text-indigo-700' },
  premiere: { className: 'bg-purple-100 text-purple-700' },
  laufend: { className: 'bg-green-100 text-green-700' },
  abgeschlossen: { className: 'bg-gray-100 text-gray-500' },
  abgesagt: { className: 'bg-red-100 text-red-700' },
}

export function ProduktionStatusBadge({
  status,
}: {
  status: ProduktionStatus
}) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {PRODUKTION_STATUS_LABELS[status]}
    </span>
  )
}
