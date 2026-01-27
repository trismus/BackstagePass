import type { BesetzungTyp } from '@/lib/supabase/types'

interface BesetzungTypBadgeProps {
  typ: BesetzungTyp
}

const typConfig: Record<BesetzungTyp, { label: string; className: string }> = {
  hauptbesetzung: {
    label: 'Hauptbesetzung',
    className: 'bg-green-100 text-green-800',
  },
  zweitbesetzung: {
    label: 'Zweitbesetzung',
    className: 'bg-blue-100 text-blue-800',
  },
  ersatz: {
    label: 'Ersatz',
    className: 'bg-gray-100 text-gray-800',
  },
}

export function BesetzungTypBadge({ typ }: BesetzungTypBadgeProps) {
  const config = typConfig[typ]
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
