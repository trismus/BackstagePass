import type { StueckStatus, RollenTyp } from '@/lib/supabase/types'
import { STUECK_STATUS_LABELS } from '@/lib/supabase/types'

interface StatusBadgeProps {
  status: StueckStatus
}

const statusConfig: Record<StueckStatus, { label: string; className: string }> =
  {
    in_planung: {
      label: STUECK_STATUS_LABELS.in_planung,
      className: 'bg-gray-100 text-gray-800',
    },
    in_proben: {
      label: STUECK_STATUS_LABELS.in_proben,
      className: 'bg-blue-100 text-blue-800',
    },
    aktiv: {
      label: STUECK_STATUS_LABELS.aktiv,
      className: 'bg-green-100 text-green-800',
    },
    abgeschlossen: {
      label: STUECK_STATUS_LABELS.abgeschlossen,
      className: 'bg-purple-100 text-purple-800',
    },
    archiviert: {
      label: STUECK_STATUS_LABELS.archiviert,
      className: 'bg-gray-200 text-gray-600',
    },
  }

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

interface RollenTypBadgeProps {
  typ: RollenTyp
}

const rollenTypConfig: Record<RollenTyp, { label: string; className: string }> =
  {
    hauptrolle: {
      label: 'Hauptrolle',
      className: 'bg-yellow-100 text-yellow-800',
    },
    nebenrolle: {
      label: 'Nebenrolle',
      className: 'bg-blue-100 text-blue-800',
    },
    ensemble: {
      label: 'Ensemble',
      className: 'bg-green-100 text-green-800',
    },
    statisterie: {
      label: 'Statisterie',
      className: 'bg-gray-100 text-gray-800',
    },
  }

export function RollenTypBadge({ typ }: RollenTypBadgeProps) {
  const config = rollenTypConfig[typ]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
