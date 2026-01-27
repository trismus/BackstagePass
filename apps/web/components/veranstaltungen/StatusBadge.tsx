import type {
  VeranstaltungStatus,
  VeranstaltungTyp,
  AnmeldungStatus,
} from '@/lib/supabase/types'

const statusConfig: Record<
  VeranstaltungStatus,
  { label: string; className: string }
> = {
  geplant: { label: 'Geplant', className: 'bg-yellow-100 text-yellow-800' },
  bestaetigt: { label: 'Bestätigt', className: 'bg-green-100 text-green-800' },
  abgesagt: { label: 'Abgesagt', className: 'bg-red-100 text-red-800' },
  abgeschlossen: {
    label: 'Abgeschlossen',
    className: 'bg-gray-100 text-gray-800',
  },
}

const typConfig: Record<
  VeranstaltungTyp,
  { label: string; className: string }
> = {
  vereinsevent: {
    label: 'Vereinsevent',
    className: 'bg-blue-100 text-blue-800',
  },
  probe: { label: 'Probe', className: 'bg-purple-100 text-purple-800' },
  auffuehrung: { label: 'Aufführung', className: 'bg-pink-100 text-pink-800' },
  sonstiges: { label: 'Sonstiges', className: 'bg-gray-100 text-gray-800' },
}

const anmeldungStatusConfig: Record<
  AnmeldungStatus,
  { label: string; className: string }
> = {
  angemeldet: { label: 'Angemeldet', className: 'bg-green-100 text-green-800' },
  warteliste: {
    label: 'Warteliste',
    className: 'bg-yellow-100 text-yellow-800',
  },
  abgemeldet: { label: 'Abgemeldet', className: 'bg-red-100 text-red-800' },
  teilgenommen: {
    label: 'Teilgenommen',
    className: 'bg-blue-100 text-blue-800',
  },
}

interface StatusBadgeProps {
  status: VeranstaltungStatus
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

interface TypBadgeProps {
  typ: VeranstaltungTyp
}

export function TypBadge({ typ }: TypBadgeProps) {
  const config = typConfig[typ]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

interface AnmeldungStatusBadgeProps {
  status: AnmeldungStatus
}

export function AnmeldungStatusBadge({ status }: AnmeldungStatusBadgeProps) {
  const config = anmeldungStatusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
