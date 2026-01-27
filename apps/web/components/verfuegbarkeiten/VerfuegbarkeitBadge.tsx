'use client'

import type { VerfuegbarkeitStatus } from '@/lib/supabase/types'
import { VERFUEGBARKEIT_STATUS_LABELS } from '@/lib/supabase/types'

interface VerfuegbarkeitBadgeProps {
  status: VerfuegbarkeitStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<
  VerfuegbarkeitStatus,
  { bg: string; text: string; dot: string }
> = {
  verfuegbar: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-500',
  },
  eingeschraenkt: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    dot: 'bg-yellow-500',
  },
  nicht_verfuegbar: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    dot: 'bg-red-500',
  },
}

export function VerfuegbarkeitBadge({
  status,
  size = 'md',
}: VerfuegbarkeitBadgeProps) {
  const config = statusConfig[status]
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {VERFUEGBARKEIT_STATUS_LABELS[status]}
    </span>
  )
}

// Compact dot-only indicator
export function VerfuegbarkeitDot({
  status,
  title,
}: {
  status: VerfuegbarkeitStatus
  title?: string
}) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${config.dot}`}
      title={title || VERFUEGBARKEIT_STATUS_LABELS[status]}
    />
  )
}
