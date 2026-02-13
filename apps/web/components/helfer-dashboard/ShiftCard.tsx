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
          <StatusBadge status={anmeldung.status} />
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
                {formatTime(anmeldung.zeitblock_start)}
                {anmeldung.zeitblock_end &&
                  ` - ${formatTime(anmeldung.zeitblock_end)}`}
                {' Uhr'}
              </span>
            </p>
          )}
        </div>

        {!isPast && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
            <Link
              href={`/helfer/anmeldung/${anmeldung.event_public_token}` as never}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Weitere Schichten
            </Link>
            {canCancel && anmeldung.abmeldung_token && (
              <>
                <span className="text-neutral-300">|</span>
                <Link
                  href={`/helfer/helferliste/abmeldung/${anmeldung.abmeldung_token}` as never}
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
