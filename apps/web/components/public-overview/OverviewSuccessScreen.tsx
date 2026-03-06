'use client'

import type { MultiRegistrationResult, PublicOverviewData } from '@/lib/actions/public-overview'
import type { BookHelferSlotResult } from '@/lib/supabase/types'
import {
  generateICalEvent,
  mergeICalEvents,
  icalToDataUrl,
  generateIcalFilename,
} from '@/lib/utils/ical-generator'

interface OverviewSuccessScreenProps {
  results: MultiRegistrationResult
  data: PublicOverviewData
  rolleNames: Map<string, string>
  dashboardToken?: string
  onBrowseMore: () => void
}

/**
 * Find the matching rolle from event data for a booking result.
 * Uses rollen_instanz_id if available, falls back to anmeldung_id-based lookup.
 */
function findRolleForResult(
  result: BookHelferSlotResult,
  data: PublicOverviewData
) {
  if (!result.rollen_instanz_id) return null
  for (const event of data.events) {
    const rolle = event.rollen.find((r) => r.id === result.rollen_instanz_id)
    if (rolle) return { rolle, event }
  }
  return null
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function formatDateTime(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OverviewSuccessScreen({
  results,
  data,
  rolleNames,
  dashboardToken,
  onBrowseMore,
}: OverviewSuccessScreenProps) {
  const successResults = results.results.filter((r) => r.success)
  const failedResults = results.results.filter((r) => !r.success)
  const waitlistResults = results.results.filter((r) => r.is_waitlist)

  const handleIcsDownload = () => {
    const icsContents = successResults
      .map((result) => {
        const match = findRolleForResult(result, data)
        if (!match) return null

        const { rolle, event } = match
        const rollenName =
          rolle.template?.name || rolle.custom_name || 'Unbekannte Rolle'
        const startDate = new Date(
          rolle.zeitblock_start || event.event.datum_start
        )
        const endDate = new Date(
          rolle.zeitblock_end || event.event.datum_end
        )

        return generateICalEvent({
          title: `Helfereinsatz: ${rollenName} - ${event.event.name}`,
          description: `Rolle: ${rollenName}\nVeranstaltung: ${event.event.name}`,
          location: event.event.ort || undefined,
          startDate,
          endDate,
        })
      })
      .filter((content): content is string => content !== null)

    if (icsContents.length === 0) return

    const icsContent =
      icsContents.length === 1
        ? icsContents[0]
        : mergeICalEvents(icsContents)

    const dataUrl = icalToDataUrl(icsContent)
    const filename = generateIcalFilename('mitmachen', 'helfereinsaetze')
    triggerDownload(dataUrl, filename)
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="rounded-xl border border-success-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
          <svg
            className="h-8 w-8 text-success-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">
          {successResults.length === results.results.length
            ? 'Alle Anmeldungen erfolgreich!'
            : 'Anmeldung teilweise erfolgreich'}
        </h2>

        <p className="mt-2 text-gray-600">
          {successResults.length} von {results.results.length}{' '}
          {results.results.length === 1 ? 'Rolle' : 'Rollen'} erfolgreich
          gebucht.
        </p>
      </div>

      {/* Successful Registrations */}
      {successResults.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3">
            <h3 className="font-medium text-success-700">
              Erfolgreich angemeldet
            </h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {successResults.map((r, index) => {
              const match = findRolleForResult(r, data)
              const displayName = match
                ? rolleNames.get(match.rolle.id) || `Rolle ${index + 1}`
                : `Rolle ${index + 1}`

              return (
                <li key={r.anmeldung_id || index} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 shrink-0 text-success-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-900">{displayName}</span>
                      {match?.rolle && (match.rolle.zeitblock_start || match.rolle.zeitblock_end) && (
                        <p className="text-sm text-gray-500">
                          {formatDateTime(match.rolle.zeitblock_start)}
                          {match.rolle.zeitblock_end &&
                            ` - ${formatDateTime(match.rolle.zeitblock_end)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {r.is_waitlist && (
                        <span className="rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">
                          Warteliste
                        </span>
                      )}
                      {!r.is_waitlist && (
                        <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                          Bestätigt
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Cancellation Link */}
                  {r.abmeldung_token && (
                    <div className="mt-1 pl-8">
                      <a
                        href={`/helfer/helferliste/abmeldung/${r.abmeldung_token}` as never}
                        className="text-sm text-error-600 hover:text-error-700 hover:underline"
                      >
                        Stornieren
                      </a>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Waitlist Notice */}
      {waitlistResults.length > 0 && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          {waitlistResults.length === 1
            ? 'Eine Rolle wurde auf die Warteliste gesetzt. Du wirst benachrichtigt, falls ein Platz frei wird.'
            : `${waitlistResults.length} Rollen wurden auf die Warteliste gesetzt. Du wirst benachrichtigt, falls Plätze frei werden.`}
        </div>
      )}

      {/* Failed Registrations */}
      {failedResults.length > 0 && (
        <div className="rounded-xl border border-error-200 bg-white shadow-sm">
          <div className="border-b border-error-100 px-5 py-3">
            <h3 className="font-medium text-error-700">
              Nicht angemeldet
            </h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {failedResults.map((r, index) => (
              <li key={r.anmeldung_id || `failed-${index}`} className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 shrink-0 text-error-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="text-gray-900">
                    {(() => {
                      const match = findRolleForResult(r, data)
                      return match
                        ? rolleNames.get(match.rolle.id) || `Rolle ${index + 1}`
                        : `Rolle ${index + 1}`
                    })()}
                  </span>
                </div>
                {r.error && (
                  <p className="mt-1 pl-8 text-sm text-error-600">{r.error}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {dashboardToken && (
          <a
            href={`/helfer/meine-einsaetze/${dashboardToken}` as never}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Zu meinen Einsätzen
          </a>
        )}
        {successResults.length > 0 && (
          <button
            onClick={handleIcsDownload}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Termine herunterladen (.ics)
          </button>
        )}
        <button
          onClick={onBrowseMore}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Weitere Rollen buchen
        </button>
      </div>
    </div>
  )
}
