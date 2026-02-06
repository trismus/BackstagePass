import type { ProduktionStatus } from '@/lib/supabase/types'
import { PRODUKTION_STATUS_LABELS } from '@/lib/supabase/types'

const statusConfig: Record<
  ProduktionStatus,
  { className: string; lightClassName: string }
> = {
  draft: { className: 'bg-gray-100 text-gray-700', lightClassName: 'bg-white/20 text-white' },
  planung: { className: 'bg-blue-100 text-blue-700', lightClassName: 'bg-white/20 text-white' },
  casting: { className: 'bg-amber-100 text-amber-700', lightClassName: 'bg-white/20 text-white' },
  proben: { className: 'bg-indigo-100 text-indigo-700', lightClassName: 'bg-white/20 text-white' },
  premiere: { className: 'bg-purple-100 text-purple-700', lightClassName: 'bg-white/20 text-white' },
  laufend: { className: 'bg-green-100 text-green-700', lightClassName: 'bg-white/20 text-white' },
  abgeschlossen: { className: 'bg-gray-100 text-gray-500', lightClassName: 'bg-white/20 text-white/80' },
  abgesagt: { className: 'bg-red-100 text-red-700', lightClassName: 'bg-white/20 text-white' },
}

interface ProduktionStatusBadgeProps {
  status: ProduktionStatus
  variant?: 'default' | 'light'
}

export function ProduktionStatusBadge({
  status,
  variant = 'default',
}: ProduktionStatusBadgeProps) {
  const config = statusConfig[status]
  const className = variant === 'light' ? config.lightClassName : config.className
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {PRODUKTION_STATUS_LABELS[status]}
    </span>
  )
}
