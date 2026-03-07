'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui'
import { ShiftCard } from './ShiftCard'
import type {
  HelferDashboardData,
  HelferDashboardAnmeldung,
} from '@/lib/supabase/types'

interface HelferDashboardViewProps {
  data: HelferDashboardData
  showHeader?: boolean
}

function canCancelAnmeldung(anmeldung: HelferDashboardAnmeldung): boolean {
  if (!anmeldung.abmeldung_token) return false

  const now = new Date()

  if (anmeldung.event_abmeldung_frist) {
    return now <= new Date(anmeldung.event_abmeldung_frist)
  }

  // Fallback: 6 hours before event start
  const eventStart = new Date(anmeldung.event_datum_start)
  const hoursUntilEvent =
    (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilEvent >= 6
}

export function HelferDashboardView({ data, showHeader = true }: HelferDashboardViewProps) {
  const [showPast, setShowPast] = useState(false)
  const [showCancelled, setShowCancelled] = useState(false)

  const now = new Date()
  const cancelled = data.anmeldungen.filter(
    (a) => a.status === 'abgelehnt'
  )
  const active = data.anmeldungen.filter(
    (a) => a.status !== 'abgelehnt'
  )
  const upcoming = active.filter(
    (a) => new Date(a.event_datum_start) >= now
  )
  const past = active.filter(
    (a) => new Date(a.event_datum_start) < now
  )

  return (
    <div className="space-y-8">
      {showHeader && (
        <>
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Meine Einsätze</h1>
            <p className="mt-1 text-neutral-600">
              Übersicht deiner Helfer-Anmeldungen
            </p>
          </div>

          {/* Helper Info */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-neutral-600">Angemeldet als</p>
              <p className="font-semibold text-neutral-900">
                {data.helper.vorname} {data.helper.nachname}
              </p>
              <p className="text-sm text-neutral-500">{data.helper.email}</p>
            </CardContent>
          </Card>

          {/* CTA: Weitere Schichten buchen */}
          <Link
            href="/mitmachen"
            className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-5 py-4 transition-colors hover:bg-primary-100"
          >
            <div>
              <p className="font-semibold text-primary-900">
                Weitere Schichten buchen
              </p>
              <p className="text-sm text-primary-700">
                Alle offenen Helfer-Einsätze ansehen und dich anmelden
              </p>
            </div>
            <svg
              className="h-5 w-5 flex-shrink-0 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </>
      )}

      {/* Upcoming Shifts */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">
          Kommende Einsätze
          {upcoming.length > 0 && (
            <span className="ml-2 text-sm font-normal text-neutral-500">
              ({upcoming.length})
            </span>
          )}
        </h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-neutral-500">
                Du hast keine kommenden Einsätze.
              </p>
              <Link
                href="/mitmachen"
                className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Offene Einsätze ansehen
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((anmeldung) => (
              <ShiftCard
                key={anmeldung.id}
                anmeldung={anmeldung}
                canCancel={canCancelAnmeldung(anmeldung)}
                isPast={false}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past Shifts */}
      {past.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowPast(!showPast)}
            className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900"
          >
            <svg
              className={`h-5 w-5 text-neutral-500 transition-transform duration-200 ${
                showPast ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            Vergangene Einsätze
            <span className="text-sm font-normal text-neutral-500">
              ({past.length})
            </span>
          </button>
          {showPast && (
            <div className="space-y-3">
              {past.map((anmeldung) => (
                <ShiftCard
                  key={anmeldung.id}
                  anmeldung={anmeldung}
                  canCancel={false}
                  isPast={true}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Cancelled Shifts */}
      {cancelled.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowCancelled(!showCancelled)}
            className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900"
          >
            <svg
              className={`h-5 w-5 text-neutral-500 transition-transform duration-200 ${
                showCancelled ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            Abgemeldete Einsätze
            <span className="text-sm font-normal text-neutral-500">
              ({cancelled.length})
            </span>
          </button>
          {showCancelled && (
            <div className="space-y-3">
              {cancelled.map((anmeldung) => (
                <ShiftCard
                  key={anmeldung.id}
                  anmeldung={anmeldung}
                  canCancel={false}
                  isPast={true}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty state when no registrations at all */}
      {data.anmeldungen.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-medium text-neutral-700">
              Noch keine Einsätze vorhanden
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Sobald du dich für einen Helfer-Einsatz anmeldest, siehst du hier
              deine Übersicht.
            </p>
            <Link
              href="/mitmachen"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              Jetzt Schichten buchen
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
