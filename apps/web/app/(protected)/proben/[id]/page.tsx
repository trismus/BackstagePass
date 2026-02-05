import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import {
  getProbe,
  getProbeSzenen,
  getProbeTeilnehmer,
} from '@/lib/actions/proben'
import {
  getProbenProtokoll,
  getProtokollTemplates,
} from '@/lib/actions/proben-protokoll'
import { canEdit as checkCanEdit } from '@/lib/supabase/auth-helpers'
import { ProbeStatusBadge, TeilnehmerList, ProbenProtokoll } from '@/components/proben'
import type { ProbeSzene, Szene, Person } from '@/lib/supabase/types'

interface ProbeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProbeDetailPage({
  params,
}: ProbeDetailPageProps) {
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

  // Hole Protokoll-Daten für Management
  const protokoll = canEdit ? await getProbenProtokoll(id) : null
  const templates = canEdit ? await getProtokollTemplates() : []

  // Hole alle Szenen des Stücks für das Protokoll
  const { data: alleSzenen } = await supabase
    .from('szenen')
    .select('*')
    .eq('stueck_id', probe.stueck_id)
    .order('nummer')

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
          <div className="mb-2 flex items-center gap-3">
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
          <p className="mt-1 text-gray-600">
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
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
          >
            Bearbeiten
          </Link>
        )}
      </div>

      {/* Info-Karten */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Ort */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Ort</h3>
          <p className="text-lg text-gray-900">
            {probe.ort || (
              <span className="text-gray-400">Nicht angegeben</span>
            )}
          </p>
        </div>

        {/* Szenen */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Szenen</h3>
          <p className="text-lg text-gray-900">
            {probeSzenen.length > 0 ? (
              `${probeSzenen.length} Szene${probeSzenen.length !== 1 ? 'n' : ''}`
            ) : (
              <span className="text-gray-400">Keine Szenen</span>
            )}
          </p>
        </div>

        {/* Teilnehmer */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Teilnehmer</h3>
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
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Beschreibung
          </h2>
          <p className="whitespace-pre-wrap text-gray-700">
            {probe.beschreibung}
          </p>
        </div>
      )}

      {/* Szenen der Probe */}
      {probeSzenen.length > 0 && (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Zu probende Szenen
            </h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {probeSzenen.map(
              (
                ps: ProbeSzene & {
                  szene: Pick<
                    Szene,
                    'id' | 'nummer' | 'titel' | 'dauer_minuten'
                  >
                }
              ) => (
                <li key={ps.id} className="flex items-center gap-3 px-6 py-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                    {ps.szene.nummer}
                  </span>
                  <div>
                    <span className="font-medium text-gray-900">
                      {ps.szene.titel}
                    </span>
                    {ps.szene.dauer_minuten && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({ps.szene.dauer_minuten} Min.)
                      </span>
                    )}
                  </div>
                </li>
              )
            )}
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
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="mb-3 text-lg font-semibold text-yellow-800">
            Interne Notizen
          </h2>
          <p className="whitespace-pre-wrap text-yellow-900">{probe.notizen}</p>
        </div>
      )}

      {/* Proben-Protokoll (nur für Management) */}
      {canEdit && (
        <ProbenProtokoll
          probeId={id}
          protokoll={protokoll}
          templates={templates}
          szenen={alleSzenen ?? []}
          teilnehmer={teilnehmer.map((t) => ({
            person: t.person as Person,
          }))}
        />
      )}
    </div>
  )
}
