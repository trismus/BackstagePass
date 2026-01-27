import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Route } from 'next'
import { ProbeStatusBadge } from '@/components/proben'

export const metadata = {
  title: 'Proben | BackstagePass',
}

export default async function ProbenPage() {
  const supabase = await createClient()

  // Hole alle Proben mit Stück-Info
  const { data: proben } = await supabase
    .from('proben')
    .select(
      `
      *,
      stueck:stuecke(id, titel)
    `
    )
    .order('datum', { ascending: true })

  const today = new Date().toISOString().split('T')[0]
  const kommendeProben =
    proben?.filter(
      (p) =>
        p.datum >= today &&
        p.status !== 'abgeschlossen' &&
        p.status !== 'abgesagt'
    ) ?? []
  const vergangeneProben =
    proben?.filter(
      (p) =>
        p.datum < today ||
        p.status === 'abgeschlossen' ||
        p.status === 'abgesagt'
    ) ?? []

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proben</h1>
          <p className="mt-1 text-gray-600">Übersicht aller Proben</p>
        </div>
      </div>

      {/* Kommende Proben */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Kommende Proben
          </h2>
          <p className="text-sm text-gray-500">
            {kommendeProben.length} Probe{kommendeProben.length !== 1 && 'n'}
          </p>
        </div>

        {kommendeProben.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Keine kommenden Proben geplant
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {kommendeProben.map((probe) => (
              <li key={probe.id}>
                <Link
                  href={`/proben/${probe.id}` as Route}
                  className="block px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="min-w-[60px] text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {new Date(probe.datum).getDate()}
                        </div>
                        <div className="text-xs uppercase text-gray-500">
                          {new Date(probe.datum).toLocaleDateString('de-CH', {
                            weekday: 'short',
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {probe.titel}
                          </span>
                          <ProbeStatusBadge status={probe.status} />
                        </div>
                        <div className="mt-0.5 text-sm text-gray-500">
                          {probe.stueck && (
                            <span className="text-primary-600">
                              {probe.stueck.titel}
                            </span>
                          )}
                          {probe.startzeit && (
                            <span className="ml-3">
                              {formatTime(probe.startzeit)}
                              {probe.endzeit &&
                                ` - ${formatTime(probe.endzeit)}`}
                            </span>
                          )}
                          {probe.ort && (
                            <span className="ml-3">{probe.ort}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400"
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
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Vergangene Proben */}
      {vergangeneProben.length > 0 && (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Vergangene Proben
            </h2>
            <p className="text-sm text-gray-500">
              {vergangeneProben.length} Probe
              {vergangeneProben.length !== 1 && 'n'}
            </p>
          </div>

          <ul className="divide-y divide-gray-200">
            {vergangeneProben.slice(0, 10).map((probe) => (
              <li key={probe.id}>
                <Link
                  href={`/proben/${probe.id}` as Route}
                  className="block px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="min-w-[60px] text-center">
                        <div className="text-lg font-medium text-gray-600">
                          {formatDate(probe.datum).split(',')[0]}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">
                            {probe.titel}
                          </span>
                          <ProbeStatusBadge status={probe.status} />
                        </div>
                        {probe.stueck && (
                          <span className="text-sm text-gray-500">
                            {probe.stueck.titel}
                          </span>
                        )}
                      </div>
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400"
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
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {vergangeneProben.length > 10 && (
            <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-500">
              + {vergangeneProben.length - 10} weitere vergangene Proben
            </div>
          )}
        </div>
      )}
    </div>
  )
}
