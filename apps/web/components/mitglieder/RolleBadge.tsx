import type { Rolle } from '@/lib/supabase/types'

const rolleConfig: Record<Rolle, { label: string; className: string }> = {
  vorstand: {
    label: 'Vorstand',
    className: 'bg-purple-100 text-purple-800',
  },
  regie: {
    label: 'Regie',
    className: 'bg-blue-100 text-blue-800',
  },
  mitglied: {
    label: 'Mitglied',
    className: 'bg-green-100 text-green-800',
  },
  technik: {
    label: 'Technik',
    className: 'bg-yellow-100 text-yellow-800',
  },
  gast: {
    label: 'Gast',
    className: 'bg-gray-100 text-gray-800',
  },
}

interface RolleBadgeProps {
  rolle: Rolle
}

export function RolleBadge({ rolle }: RolleBadgeProps) {
  const config = rolleConfig[rolle]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
