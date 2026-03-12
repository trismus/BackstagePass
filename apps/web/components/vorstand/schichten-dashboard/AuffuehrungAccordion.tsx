'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DashboardAuffuehrung, AmpelStatus } from '@/lib/supabase/types'
import { ZeitblockSection } from './ZeitblockSection'

// =============================================================================
// Types
// =============================================================================

interface AuffuehrungAccordionProps {
  auffuehrung: DashboardAuffuehrung
  /** Start expanded (e.g. for critical items) */
  defaultOpen?: boolean
}

// =============================================================================
// Component
// =============================================================================

/**
 * Collapsible card for a single Aufführung.
 * Shows Ampel dot, title, date, occupancy bar, and expands to
 * reveal Zeitblöcke with Schichten.
 */
export function AuffuehrungAccordion({
  auffuehrung,
  defaultOpen = false,
}: AuffuehrungAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const { soll, ist } = auffuehrung.belegung
  const fillPct = soll > 0 ? Math.min(100, Math.round((ist / soll) * 100)) : 100

  const ampelDotColors: Record<AmpelStatus, string> = {
    gruen: 'bg-success-500',
    gelb: 'bg-amber-400',
    rot: 'bg-red-400',
  }

  const ampelBarColors: Record<AmpelStatus, string> = {
    gruen: 'bg-success-500',
    gelb: 'bg-amber-400',
    rot: 'bg-red-400',
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  const helferStatusLabel = auffuehrung.helfer_status
    ? {
        entwurf: 'Entwurf',
        veroeffentlicht: 'Veröffentlicht',
        abgeschlossen: 'Abgeschlossen',
      }[auffuehrung.helfer_status]
    : null

  const helferStatusColor = auffuehrung.helfer_status
    ? {
        entwurf: 'bg-neutral-100 text-neutral-600',
        veroeffentlicht: 'bg-success-100 text-success-700',
        abgeschlossen: 'bg-primary-100 text-primary-700',
      }[auffuehrung.helfer_status]
    : ''

  // Check if deadline is approaching (within 3 days)
  const deadlineWarning = (() => {
    if (!auffuehrung.helfer_buchung_deadline) return null
    const deadline = new Date(auffuehrung.helfer_buchung_deadline)
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'Abgelaufen'
    if (diffDays <= 3) return `Noch ${diffDays} Tag${diffDays !== 1 ? 'e' : ''}`
    return null
  })()

  const schichtenCount = auffuehrung.zeitbloecke.reduce(
    (sum, zb) => sum + zb.schichten.length,
    0
  )

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Header (clickable to toggle) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-neutral-50"
        aria-expanded={isOpen}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 shrink-0 rounded-full ${ampelDotColors[auffuehrung.ampel]}`}
            />
            <h3 className="truncate text-base font-semibold text-neutral-900">
              {auffuehrung.titel}
            </h3>
            {helferStatusLabel && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${helferStatusColor}`}
              >
                {helferStatusLabel}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
            <span>{formatDate(auffuehrung.datum)}</span>
            {auffuehrung.startzeit && (
              <span>
                {formatTime(auffuehrung.startzeit)}
                {auffuehrung.endzeit && ` – ${formatTime(auffuehrung.endzeit)}`} Uhr
              </span>
            )}
            {auffuehrung.ort && <span>{auffuehrung.ort}</span>}
            <span className="text-neutral-400">·</span>
            <span>
              {schichtenCount} Schicht{schichtenCount !== 1 ? 'en' : ''}
            </span>
            {deadlineWarning && (
              <span className="rounded bg-warning-100 px-1.5 py-0.5 text-xs font-medium text-warning-700">
                Frist: {deadlineWarning}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar + chevron */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="w-28">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{ist}/{soll}</span>
              <span>{fillPct}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full transition-all ${ampelBarColors[auffuehrung.ampel]}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
          <svg
            className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="border-t border-neutral-100 px-4 pb-4 pt-3">
          {/* Quick link to detailed helferliste */}
          <div className="mb-4 flex items-center justify-end">
            <Link
              href={`/auffuehrungen/${auffuehrung.id}/helferliste` as never}
              className="text-xs font-medium text-primary-600 hover:text-primary-800"
            >
              Zur Helferliste &rarr;
            </Link>
          </div>

          {/* Zeitblöcke */}
          {auffuehrung.zeitbloecke.length > 0 ? (
            <div className="space-y-4">
              {auffuehrung.zeitbloecke.map((zb) => (
                <ZeitblockSection key={zb.id} zeitblock={zb} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              Keine Zeitblöcke oder Schichten definiert
            </p>
          )}
        </div>
      )}
    </div>
  )
}
