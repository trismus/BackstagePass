import type { ProduktionsBesetzungStatus } from '@/lib/supabase/types'
import { PRODUKTIONS_BESETZUNG_STATUS_LABELS } from '@/lib/supabase/types'

const statusConfig: Record<ProduktionsBesetzungStatus, { className: string }> =
  {
    offen: { className: 'bg-gray-100 text-gray-700' },
    vorgemerkt: { className: 'bg-amber-100 text-amber-700' },
    besetzt: { className: 'bg-green-100 text-green-700' },
    abgesagt: { className: 'bg-red-100 text-red-700' },
  }

export function BesetzungsStatusBadge({
  status,
}: {
  status: ProduktionsBesetzungStatus
}) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {PRODUKTIONS_BESETZUNG_STATUS_LABELS[status]}
    </span>
  )
}
