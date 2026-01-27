import type { ProbeStatus, TeilnehmerStatus } from '@/lib/supabase/types'

interface ProbeStatusBadgeProps {
  status: ProbeStatus
}

const statusConfig: Record<ProbeStatus, { label: string; className: string }> =
  {
    geplant: {
      label: 'Geplant',
      className: 'bg-gray-100 text-gray-800',
    },
    bestaetigt: {
      label: 'Bestätigt',
      className: 'bg-blue-100 text-blue-800',
    },
    abgesagt: {
      label: 'Abgesagt',
      className: 'bg-error-100 text-error-800',
    },
    verschoben: {
      label: 'Verschoben',
      className: 'bg-warning-100 text-warning-800',
    },
    abgeschlossen: {
      label: 'Abgeschlossen',
      className: 'bg-green-100 text-green-800',
    },
  }

export function ProbeStatusBadge({ status }: ProbeStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

interface TeilnehmerStatusBadgeProps {
  status: TeilnehmerStatus
}

const teilnehmerStatusConfig: Record<
  TeilnehmerStatus,
  { label: string; className: string }
> = {
  eingeladen: {
    label: 'Eingeladen',
    className: 'bg-gray-100 text-gray-800',
  },
  zugesagt: {
    label: 'Zugesagt',
    className: 'bg-green-100 text-green-800',
  },
  abgesagt: {
    label: 'Abgesagt',
    className: 'bg-error-100 text-error-800',
  },
  erschienen: {
    label: 'Erschienen',
    className: 'bg-blue-100 text-blue-800',
  },
  nicht_erschienen: {
    label: 'Nicht erschienen',
    className: 'bg-warning-100 text-warning-800',
  },
}

export function TeilnehmerStatusBadge({ status }: TeilnehmerStatusBadgeProps) {
  const config = teilnehmerStatusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
