import type { RaumTyp } from '@/lib/supabase/types'

const typConfig: Record<RaumTyp, { label: string; color: string }> = {
  buehne: { label: 'Bühne', color: 'bg-purple-100 text-purple-800' },
  foyer: { label: 'Foyer', color: 'bg-blue-100 text-blue-800' },
  lager: { label: 'Lager', color: 'bg-gray-100 text-gray-800' },
  garderobe: { label: 'Garderobe', color: 'bg-pink-100 text-pink-800' },
  technik: { label: 'Technik', color: 'bg-yellow-100 text-yellow-800' },
  sonstiges: { label: 'Sonstiges', color: 'bg-gray-100 text-gray-600' },
}

interface RaumTypBadgeProps {
  typ: RaumTyp | null
}

export function RaumTypBadge({ typ }: RaumTypBadgeProps) {
  if (!typ) {
    return <span className="text-gray-400 text-sm">-</span>
  }

  const config = typConfig[typ]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
