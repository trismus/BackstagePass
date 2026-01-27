import type { GruppenTyp } from '@/lib/supabase/types'
import { GRUPPEN_TYP_LABELS } from '@/lib/supabase/types'

const typColors: Record<GruppenTyp, string> = {
  team: 'bg-blue-100 text-blue-800',
  gremium: 'bg-purple-100 text-purple-800',
  produktion: 'bg-amber-100 text-amber-800',
  sonstiges: 'bg-neutral-100 text-neutral-800',
}

interface GruppenTypBadgeProps {
  typ: GruppenTyp
  className?: string
}

export function GruppenTypBadge({ typ, className = '' }: GruppenTypBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typColors[typ]} ${className}`}
    >
      {GRUPPEN_TYP_LABELS[typ]}
    </span>
  )
}
