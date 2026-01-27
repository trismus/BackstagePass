import type { ZeitblockTyp } from '@/lib/supabase/types'

const typConfig: Record<ZeitblockTyp, { label: string; color: string }> = {
  aufbau: { label: 'Aufbau', color: 'bg-orange-100 text-orange-800' },
  einlass: { label: 'Einlass', color: 'bg-blue-100 text-blue-800' },
  vorfuehrung: { label: 'Vorführung', color: 'bg-purple-100 text-purple-800' },
  pause: { label: 'Pause', color: 'bg-yellow-100 text-yellow-800' },
  abbau: { label: 'Abbau', color: 'bg-red-100 text-red-800' },
  standard: { label: 'Standard', color: 'bg-gray-100 text-gray-600' },
}

interface ZeitblockTypBadgeProps {
  typ: ZeitblockTyp
}

export function ZeitblockTypBadge({ typ }: ZeitblockTypBadgeProps) {
  const config = typConfig[typ]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
