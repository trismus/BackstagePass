'use client'

import type { MultiRegistrationResult } from '@/lib/actions/public-overview'
import {
  generateICalEvent,
  mergeICalEvents,
  icalToDataUrl,
  generateIcalFilename,
} from '@/lib/utils/ical-generator'

interface OverviewSuccessScreenProps {
  results: MultiRegistrationResult
  schichtNames: Map<string, string>
  dashboardToken?: string
  onBrowseMore: () => void
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function OverviewSuccessScreen({
  results,
  schichtNames,
  dashboardToken,
  onBrowseMore,
}: OverviewSuccessScreenProps) {
  const successResults = results.results.filter((r) => r.success)
  const failedResults = results.results.filter((r) => !r.success)
  const waitlistResults = results.results.filter((r) => r.waitlist)

  const handleIcsDownload = () => {
    const icsContents = successResults
      .map((result) => {
        const name = schichtNames.get(result.schichtId) || 'Helfereinsatz'
        return generateICalEvent({
          title: `Helfereinsatz: ${name}`,
          description: `Schicht: ${name}`,
          startDate: new Date(),
          endDate: new Date(),
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
          {results.results.length === 1 ? 'Schicht' : 'Schichten'} erfolgreich
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
            {successResults.map((r) => (
              <li key={r.schichtId} className="flex items-center gap-3 px-5 py-3">
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
                <span className="flex-1 text-gray-900">
                  {schichtNames.get(r.schichtId) || r.schichtId}
                </span>
                {r.waitlist && (
                  <span className="rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">
                    Warteliste
                  </span>
                )}
                {!r.waitlist && (
                  <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                    Bestätigt
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Waitlist Notice */}
      {waitlistResults.length > 0 && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          {waitlistResults.length === 1
            ? 'Eine Schicht wurde auf die Warteliste gesetzt. Du wirst benachrichtigt, falls ein Platz frei wird.'
            : `${waitlistResults.length} Schichten wurden auf die Warteliste gesetzt. Du wirst benachrichtigt, falls Plätze frei werden.`}
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
            {failedResults.map((r) => (
              <li key={r.schichtId} className="px-5 py-3">
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
                    {schichtNames.get(r.schichtId) || r.schichtId}
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
          Weitere Schichten buchen
        </button>
      </div>
    </div>
  )
}
