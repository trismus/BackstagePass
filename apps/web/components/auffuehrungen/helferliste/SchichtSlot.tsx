'use client'

import type { SchichtMitDetails } from '@/lib/actions/helfer-anmeldung'

interface SchichtSlotProps {
  schicht: SchichtMitDetails
  isRegistered: boolean
  isLoading: boolean
  onRegister: () => void
  onUnregister: () => void
  waitlistPosition?: number | null  // null = not on waitlist, number = position
  onJoinWaitlist?: () => void
  onLeaveWaitlist?: () => void
}

export function SchichtSlot({
  schicht,
  isRegistered,
  isLoading,
  onRegister,
  onUnregister,
  waitlistPosition,
  onJoinWaitlist,
  onLeaveWaitlist,
}: SchichtSlotProps) {
  // Count active zuweisungen
  const activeZuweisungen = (schicht.zuweisungen || []).filter(
    (z) => z.status !== 'abgesagt'
  )
  const besetzt = activeZuweisungen.length
  const benoetigt = schicht.anzahl_benoetigt
  const isFull = besetzt >= benoetigt
  const isOnWaitlist = waitlistPosition != null && waitlistPosition > 0

  // Get registered helper names
  const helferNamen = activeZuweisungen
    .map((z) =>
      z.person ? `${z.person.vorname} ${z.person.nachname.charAt(0)}.` : 'Unbekannt'
    )
    .filter(Boolean)

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        isRegistered
          ? 'border-success-300 bg-success-50 ring-2 ring-success-200'
          : isOnWaitlist
            ? 'border-warning-300 bg-warning-50 ring-2 ring-warning-200'
            : isFull
              ? 'border-neutral-200 bg-neutral-50'
              : 'border-neutral-200 bg-white hover:border-primary-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Rolle Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-neutral-900">{schicht.rolle}</h4>
            {isRegistered && (
              <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                Meine Anmeldung
              </span>
            )}
            {isOnWaitlist && (
              <span className="rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">
                Warteliste Position {waitlistPosition}
              </span>
            )}
          </div>

          {/* Slot Counter */}
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`text-sm ${
                isFull ? 'text-warning-600' : 'text-neutral-600'
              }`}
            >
              {besetzt} von {benoetigt} besetzt
            </span>
            {!isFull && (
              <span className="text-sm text-success-600">
                ({benoetigt - besetzt} frei)
              </span>
            )}
          </div>

          {/* Helfer Namen */}
          {helferNamen.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1.5">
                {helferNamen.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {isRegistered ? (
            <button
              onClick={onUnregister}
              disabled={isLoading}
              className="rounded-lg border border-error-300 bg-error-50 px-4 py-2 text-sm font-medium text-error-700 transition-colors hover:bg-error-100 disabled:opacity-50"
            >
              {isLoading ? 'Wird abgemeldet...' : 'Abmelden'}
            </button>
          ) : isOnWaitlist ? (
            <button
              onClick={onLeaveWaitlist}
              disabled={isLoading}
              className="rounded-lg border border-warning-300 bg-warning-50 px-4 py-2 text-sm font-medium text-warning-700 transition-colors hover:bg-warning-100 disabled:opacity-50"
            >
              {isLoading ? 'Wird entfernt...' : 'Von Warteliste entfernen'}
            </button>
          ) : isFull && onJoinWaitlist ? (
            <button
              onClick={onJoinWaitlist}
              disabled={isLoading}
              className="rounded-lg border border-warning-300 bg-warning-50 px-4 py-2 text-sm font-medium text-warning-700 transition-colors hover:bg-warning-100 disabled:opacity-50"
            >
              {isLoading ? 'Wird hinzugefuegt...' : 'Auf Warteliste setzen'}
            </button>
          ) : isFull ? (
            <span className="rounded-lg bg-neutral-100 px-4 py-2 text-sm text-neutral-500">
              Voll
            </span>
          ) : (
            <button
              onClick={onRegister}
              disabled={isLoading}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
