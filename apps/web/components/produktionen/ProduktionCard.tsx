'use client'

import Link from 'next/link'
import type { Route } from 'next'
import type { Produktion } from '@/lib/supabase/types'
import { ProduktionStatusBadge } from './ProduktionStatusBadge'

interface ProduktionCardProps {
  produktion: Produktion
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, id: string) => void
}

export function ProduktionCard({
  produktion,
  draggable = false,
  onDragStart,
}: ProduktionCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const premiere = formatDate(produktion.premiere)
  const derniere = formatDate(produktion.derniere)
  const dateRange =
    premiere && derniere
      ? `${premiere} – ${derniere}`
      : premiere
        ? `ab ${premiere}`
        : derniere
          ? `bis ${derniere}`
          : null

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, produktion.id)}
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <Link
          href={`/produktionen/${produktion.id}` as Route}
          className="font-medium text-gray-900 hover:text-primary-600"
        >
          {produktion.titel}
        </Link>
        <ProduktionStatusBadge status={produktion.status} />
      </div>

      <p className="mb-2 text-sm text-gray-500">Saison {produktion.saison}</p>

      {dateRange && (
        <p className="text-xs text-gray-400">{dateRange}</p>
      )}

      {produktion.beschreibung && (
        <p className="mt-2 line-clamp-2 text-xs text-gray-500">
          {produktion.beschreibung}
        </p>
      )}
    </div>
  )
}
