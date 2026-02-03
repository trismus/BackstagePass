import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getProduktion, getSerien } from '@/lib/actions/produktionen'
import { getUserProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/supabase/permissions'
import { createClient } from '@/lib/supabase/server'
import {
  ProduktionStatusBadge,
  ProduktionStatusSelect,
} from '@/components/produktionen'
import { PRODUKTION_STATUS_LABELS, SERIE_STATUS_LABELS } from '@/lib/supabase/types'
import type { Stueck, Person, Auffuehrungsserie } from '@/lib/supabase/types'

interface ProduktionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProduktionDetailPage({
  params,
}: ProduktionDetailPageProps) {
  const { id } = await params
  const [produktion, serien, profile] = await Promise.all([
    getProduktion(id),
    getSerien(id),
    getUserProfile(),
  ])

  if (!produktion) {
    notFound()
  }

  const canEdit = profile
    ? hasPermission(profile.role, 'produktionen:write')
    : false

  // Fetch related data
  const supabase = await createClient()
  let stueck: Pick<Stueck, 'id' | 'titel'> | null = null
  let leitung: Pick<Person, 'id' | 'vorname' | 'nachname'> | null = null

  if (produktion.stueck_id) {
    const { data } = await supabase
      .from('stuecke')
      .select('id, titel')
      .eq('id', produktion.stueck_id)
      .single()
    stueck = data
  }

  if (produktion.produktionsleitung_id) {
    const { data } = await supabase
      .from('personen')
      .select('id, vorname, nachname')
      .eq('id', produktion.produktionsleitung_id)
      .single()
    leitung = data
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '–'
    return new Date(dateStr).toLocaleDateString('de-CH')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={'/produktionen' as Route}
            className="text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zur Übersicht
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {produktion.titel}
              </h1>
              <ProduktionStatusBadge status={produktion.status} />
            </div>
            <p className="mt-1 text-gray-600">Saison {produktion.saison}</p>
          </div>
          {canEdit && (
            <Link
              href={`/produktionen/${id}/bearbeiten` as Route}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Bearbeiten
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Beschreibung */}
            {produktion.beschreibung && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                  Beschreibung
                </h2>
                <p className="whitespace-pre-wrap text-gray-600">
                  {produktion.beschreibung}
                </p>
              </div>
            )}

            {/* Status Workflow */}
            {canEdit && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                  Status ändern
                </h2>
                <ProduktionStatusSelect
                  produktionId={produktion.id}
                  currentStatus={produktion.status}
                />
              </div>
            )}

            {/* Aufführungsserien */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Aufführungsserien
                </h2>
              </div>
              {serien.length === 0 ? (
                <p className="text-gray-500">
                  Noch keine Aufführungsserien vorhanden.
                </p>
              ) : (
                <div className="space-y-3">
                  {serien.map((serie: Auffuehrungsserie) => (
                    <div
                      key={serie.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {serie.name}
                          </h3>
                          {serie.standard_ort && (
                            <p className="text-sm text-gray-500">
                              {serie.standard_ort}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {SERIE_STATUS_LABELS[serie.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Details
              </h2>
              <dl className="space-y-3">
                {stueck && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stück</dt>
                    <dd className="text-sm text-gray-900">
                      <Link
                        href={`/stuecke/${stueck.id}` as Route}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        {stueck.titel}
                      </Link>
                    </dd>
                  </div>
                )}
                {leitung && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Produktionsleitung
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {leitung.vorname} {leitung.nachname}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Probenstart
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(produktion.proben_start)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Premiere
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(produktion.premiere)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Dernière
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(produktion.derniere)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Timeline */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Zeitplan
              </h2>
              <div className="space-y-3">
                {[
                  {
                    label: 'Probenstart',
                    date: produktion.proben_start,
                  },
                  { label: 'Premiere', date: produktion.premiere },
                  { label: 'Dernière', date: produktion.derniere },
                ]
                  .filter((item) => item.date)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary-500" />
                      <span className="font-medium text-gray-700">
                        {item.label}:
                      </span>
                      <span className="text-gray-600">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  ))}
                {!produktion.proben_start &&
                  !produktion.premiere &&
                  !produktion.derniere && (
                    <p className="text-sm text-gray-500">
                      Noch keine Termine festgelegt.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
