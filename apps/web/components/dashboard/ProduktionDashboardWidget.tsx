'use client'

import Link from 'next/link'
import type { Route } from 'next'
import type { Produktion, ProduktionStatus } from '@/lib/supabase/types'
import { PRODUKTION_STATUS_LABELS } from '@/lib/supabase/types'

interface ProduktionDashboardWidgetProps {
  produktion: Produktion | null
  probenStats?: {
    total: number
    absolviert: number
  }
  besetzungStats?: {
    total: number
    besetzt: number
  }
  naechsteTermine?: {
    id: string
    titel: string
    datum: string
    typ: string
  }[]
}

const STATUS_COLORS: Record<ProduktionStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  planung: 'bg-blue-100 text-blue-700',
  casting: 'bg-amber-100 text-amber-700',
  proben: 'bg-indigo-100 text-indigo-700',
  premiere: 'bg-purple-100 text-purple-700',
  laufend: 'bg-green-100 text-green-700',
  abgeschlossen: 'bg-gray-100 text-gray-500',
  abgesagt: 'bg-red-100 text-red-700',
}

function ProgressBar({
  label,
  current,
  total,
  color = 'bg-primary-500',
}: {
  label: string
  current: number
  total: number
  color?: string
}) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {current} / {total}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function ProduktionDashboardWidget({
  produktion,
  probenStats,
  besetzungStats,
  naechsteTermine = [],
}: ProduktionDashboardWidgetProps) {
  if (!produktion) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-neutral-900">
          Aktuelle Produktion
        </h2>
        <p className="text-neutral-500">Keine aktive Produktion vorhanden.</p>
        <Link
          href={'/produktionen/neu' as Route}
          className="mt-4 inline-block text-sm text-primary-600 hover:text-primary-800"
        >
          Neue Produktion erstellen &rarr;
        </Link>
      </div>
    )
  }

  const daysUntilPremiere = produktion.premiere
    ? Math.ceil(
        (new Date(produktion.premiere).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Aktuelle Produktion
          </p>
          <h2 className="mt-1 text-lg font-semibold text-neutral-900">
            {produktion.titel}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[produktion.status]}`}
            >
              {PRODUKTION_STATUS_LABELS[produktion.status]}
            </span>
            <span className="text-sm text-neutral-500">
              Saison {produktion.saison}
            </span>
          </div>
        </div>
        <Link
          href={`/produktionen/${produktion.id}` as Route}
          className="text-sm text-primary-600 hover:text-primary-800"
        >
          Details &rarr;
        </Link>
      </div>

      {/* Countdown */}
      {daysUntilPremiere !== null && daysUntilPremiere > 0 && (
        <div className="mb-4 rounded-lg bg-gradient-to-r from-primary-50 to-secondary-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tage bis Premiere</p>
              <p className="text-3xl font-bold text-primary-700">
                {daysUntilPremiere}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              {formatDate(produktion.premiere!)}
            </div>
          </div>
        </div>
      )}

      {/* Progress Stats */}
      <div className="mb-4 space-y-3">
        {probenStats && probenStats.total > 0 && (
          <ProgressBar
            label="Proben"
            current={probenStats.absolviert}
            total={probenStats.total}
            color="bg-indigo-500"
          />
        )}
        {besetzungStats && besetzungStats.total > 0 && (
          <ProgressBar
            label="Besetzung"
            current={besetzungStats.besetzt}
            total={besetzungStats.total}
            color="bg-green-500"
          />
        )}
      </div>

      {/* Key Dates */}
      <div className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
        {produktion.proben_start && (
          <div className="rounded bg-gray-50 p-2">
            <p className="text-xs text-gray-500">Probenstart</p>
            <p className="font-medium text-gray-900">
              {formatDate(produktion.proben_start)}
            </p>
          </div>
        )}
        {produktion.premiere && (
          <div className="rounded bg-purple-50 p-2">
            <p className="text-xs text-purple-600">Premiere</p>
            <p className="font-medium text-purple-900">
              {formatDate(produktion.premiere)}
            </p>
          </div>
        )}
        {produktion.derniere && (
          <div className="rounded bg-gray-50 p-2">
            <p className="text-xs text-gray-500">Derniere</p>
            <p className="font-medium text-gray-900">
              {formatDate(produktion.derniere)}
            </p>
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      {naechsteTermine.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Naechste Termine
          </p>
          <div className="space-y-2">
            {naechsteTermine.slice(0, 3).map((termin) => (
              <Link
                key={termin.id}
                href={`/veranstaltungen/${termin.id}` as Route}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm transition-colors hover:bg-gray-100"
              >
                <span className="font-medium text-gray-900">{termin.titel}</span>
                <span className="text-gray-500">{formatDate(termin.datum)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        <Link
          href={`/produktionen/${produktion.id}` as Route}
          className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
        >
          Zur Produktion
        </Link>
        {produktion.stueck_id && (
          <Link
            href={`/stuecke/${produktion.stueck_id}` as Route}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Zum Stueck
          </Link>
        )}
        <Link
          href={'/proben' as Route}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          Probenplan
        </Link>
      </div>
    </div>
  )
}
