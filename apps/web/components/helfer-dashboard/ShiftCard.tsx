import Link from 'next/link'
import { Card, CardContent } from '@/components/ui'
import { StatusBadge } from '@/components/helferliste/StatusBadge'
import type { HelferDashboardAnmeldung } from '@/lib/supabase/types'

interface ShiftCardProps {
  anmeldung: HelferDashboardAnmeldung
  canCancel: boolean
  isPast: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a time string that may be HH:MM:SS or a full datetime
 */
function formatTimeValue(timeStr: string) {
  // If it looks like a time-only string (HH:MM or HH:MM:SS), parse differently
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    return timeStr.slice(0, 5)
  }
  return formatTime(timeStr)
}

/**
 * Get the cancellation route based on the booking system.
 * System A (helferliste): /helfer/helferliste/abmeldung/[token]
 * System B (auffuehrung): /helfer/abmeldung/[token]
 */
function getCancellationHref(anmeldung: HelferDashboardAnmeldung): string {
  if (anmeldung.system === 'b') {
    return `/helfer/abmeldung/${anmeldung.abmeldung_token}`
  }
  return `/helfer/helferliste/abmeldung/${anmeldung.abmeldung_token}`
}

/**
 * Get the "more shifts" link based on the booking system.
 * System A links to the helferliste event page.
 * System B links to the mitmachen overview page.
 */
function getMoreShiftsHref(anmeldung: HelferDashboardAnmeldung): string {
  if (anmeldung.system === 'b') {
    return '/mitmachen'
  }
  return `/helfer/anmeldung/${anmeldung.event_public_token}`
}

export function ShiftCard({ anmeldung, canCancel, isPast }: ShiftCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-neutral-900">
              {anmeldung.event_name}
            </h3>
            <p className="text-sm text-neutral-600">
              {formatDate(anmeldung.event_datum_start)}
            </p>
            {anmeldung.event_ort && (
              <p className="text-sm text-neutral-500">{anmeldung.event_ort}</p>
            )}
          </div>
          {anmeldung.status === 'abgelehnt' ? (
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              Abgemeldet
            </span>
          ) : (
            <StatusBadge status={anmeldung.status} />
          )}
        </div>

        <div className="mt-3 border-t border-neutral-100 pt-3">
          <p className="text-sm">
            <span className="text-neutral-600">Rolle: </span>
            <span className="font-medium">{anmeldung.rolle_name}</span>
          </p>
          {anmeldung.zeitblock_start && (
            <p className="text-sm">
              <span className="text-neutral-600">Zeit: </span>
              <span className="font-medium">
                {formatTimeValue(anmeldung.zeitblock_start)}
                {anmeldung.zeitblock_end &&
                  ` - ${formatTimeValue(anmeldung.zeitblock_end)}`}
                {' Uhr'}
              </span>
            </p>
          )}
        </div>

        {!isPast && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
            <Link
              href={getMoreShiftsHref(anmeldung) as never}
              href="/mitmachen"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Weitere Schichten
            </Link>
            {canCancel && anmeldung.abmeldung_token && (
              <>
                <span className="text-neutral-300">|</span>
                <Link
                  href={getCancellationHref(anmeldung) as never}
                  className="text-sm font-medium text-error-600 hover:text-error-700"
                >
                  Abmelden
                </Link>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
