import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { getProbe, getProbeSzenen, getProbeTeilnehmer } from '@/lib/actions/proben'
import { canEdit as checkCanEdit } from '@/lib/supabase/auth-helpers'
import { ProbeStatusBadge, TeilnehmerList } from '@/components/proben'
import type { ProbeSzene, Szene } from '@/lib/supabase/types'

interface ProbeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProbeDetailPage({ params }: ProbeDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const profile = await getUserProfile()
  const canEdit = profile ? checkCanEdit(profile.role) : false

  const probe = await getProbe(id)
  if (!probe) {
    notFound()
  }

  // Hole Stück-Details
  const { data: stueck } = await supabase
    .from('stuecke')
    .select('id, titel')
    .eq('id', probe.stueck_id)
    .single()

  // Hole Szenen der Probe
  const probeSzenen = await getProbeSzenen(id)

  // Hole Teilnehmer
  const teilnehmer = await getProbeTeilnehmer(id)

  // Hole alle verfügbaren Personen für Teilnehmer-Auswahl
  const { data: personen } = await supabase
    .from('personen')
    .select('*')
    .eq('aktiv', true)
    .order('nachname')

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/stuecke/${probe.stueck_id}` as Route}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              {stueck?.titel}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-500">Probe</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{probe.titel}</h1>
            <ProbeStatusBadge status={probe.status} />
          </div>
          <p className="text-gray-600 mt-1">
            {formatDate(probe.datum)}
            {probe.startzeit && (
              <span className="ml-2">
                {formatTime(probe.startzeit)}
                {probe.endzeit && ` - ${formatTime(probe.endzeit)}`}
              </span>
            )}
          </p>
        </div>
        {canEdit && (
          <Link
            href={`/proben/${id}/bearbeiten` as Route}
            className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Bearbeiten
          </Link>
        )}
      </div>

      {/* Info-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ort */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Ort</h3>
          <p className="text-lg text-gray-900">
            {probe.ort || <span className="text-gray-400">Nicht angegeben</span>}
          </p>
        </div>

        {/* Szenen */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Szenen</h3>
          <p className="text-lg text-gray-900">
            {probeSzenen.length > 0 ? (
              `${probeSzenen.length} Szene${probeSzenen.length !== 1 ? 'n' : ''}`
            ) : (
              <span className="text-gray-400">Keine Szenen</span>
            )}
          </p>
        </div>

        {/* Teilnehmer */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Teilnehmer</h3>
          <p className="text-lg text-gray-900">
            {teilnehmer.length > 0 ? (
              `${teilnehmer.length} eingeladen`
            ) : (
              <span className="text-gray-400">Keine Teilnehmer</span>
            )}
          </p>
        </div>
      </div>

      {/* Beschreibung */}
      {probe.beschreibung && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Beschreibung</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{probe.beschreibung}</p>
        </div>
      )}

      {/* Szenen der Probe */}
      {probeSzenen.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Zu probende Szenen</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {probeSzenen.map((ps: ProbeSzene & { szene: Pick<Szene, 'id' | 'nummer' | 'titel' | 'dauer_minuten'> }) => (
              <li key={ps.id} className="px-6 py-3 flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                  {ps.szene.nummer}
                </span>
                <div>
                  <span className="font-medium text-gray-900">{ps.szene.titel}</span>
                  {ps.szene.dauer_minuten && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({ps.szene.dauer_minuten} Min.)
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Teilnehmer */}
      <TeilnehmerList
        probeId={id}
        teilnehmer={teilnehmer}
        personen={personen ?? []}
        canEdit={canEdit}
        hasSzenen={probeSzenen.length > 0}
      />

      {/* Notizen (nur für Regie) */}
      {canEdit && probe.notizen && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">Interne Notizen</h2>
          <p className="text-yellow-900 whitespace-pre-wrap">{probe.notizen}</p>
        </div>
      )}
    </div>
  )
}
