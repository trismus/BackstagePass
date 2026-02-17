import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import {
  getProduktion,
  getSerien,
  getAllAuffuehrungenForProduktion,
} from '@/lib/actions/produktionen'
import { getRollenMitProduktionsBesetzungen } from '@/lib/actions/produktions-besetzungen'
import { getProduktionDashboardData } from '@/lib/actions/produktions-dashboard'
import { getLatestDokumente } from '@/lib/actions/produktions-dokumente'
import {
  getProduktionsStab,
  getStabFunktionen,
} from '@/lib/actions/produktions-stab'
import { getChecklistItems } from '@/lib/actions/produktions-checklisten'
import { getUserProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/supabase/permissions'
import { createClient } from '@/lib/supabase/server'
import {
  ProduktionStatusBadge,
  ProduktionStatusSelect,
  BesetzungsMatrix,
  ProduktionDokumenteSection,
  ProduktionStabSection,
  ProduktionChecklistSection,
  SerieManager,
  ProduktionDashboardSection,
} from '@/components/produktionen'
import type { Stueck, Person, AuffuehrungTemplate } from '@/lib/supabase/types'

interface ProduktionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProduktionDetailPage({
  params,
}: ProduktionDetailPageProps) {
  const { id } = await params
  const [produktion, serien, profile, dokumente, serienAuffuehrungen] =
    await Promise.all([
      getProduktion(id),
      getSerien(id),
      getUserProfile(),
      getLatestDokumente(id),
      getAllAuffuehrungenForProduktion(id),
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

  // Fetch Stab + Funktionen + Personen + Checkliste + Templates in parallel
  const [stabData, funktionenData, personenData, checklistItems, templatesData] =
    await Promise.all([
      getProduktionsStab(id),
      getStabFunktionen(),
      supabase
        .from('personen')
        .select('id, vorname, nachname')
        .eq('aktiv', true)
        .order('nachname', { ascending: true }),
      getChecklistItems(id),
      supabase
        .from('auffuehrung_templates')
        .select('id, name')
        .eq('archiviert', false)
        .order('name', { ascending: true }),
    ])
  const aktivePersonen =
    (personenData.data as Pick<Person, 'id' | 'vorname' | 'nachname'>[]) || []
  const templates =
    (templatesData.data as Pick<AuffuehrungTemplate, 'id' | 'name'>[]) || []

  // Fetch Besetzung data if Stück is linked
  let rollenMitBesetzungen: Awaited<
    ReturnType<typeof getRollenMitProduktionsBesetzungen>
  > = []

  if (produktion.stueck_id) {
    rollenMitBesetzungen = await getRollenMitProduktionsBesetzungen(
      id,
      produktion.stueck_id
    )
  }

  // Dashboard data (reuses already-fetched data where possible)
  const dashboardData = await getProduktionDashboardData(
    id,
    produktion.stueck_id,
    rollenMitBesetzungen,
    serienAuffuehrungen
  )

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

        {/* Dashboard */}
        <div className="mb-8">
          <ProduktionDashboardSection data={dashboardData} />
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

            {/* Checkliste */}
            <ProduktionChecklistSection
              produktionId={id}
              currentStatus={produktion.status}
              items={checklistItems}
              canEdit={canEdit}
            />

            {/* Produktionsteam */}
            <ProduktionStabSection
              produktionId={id}
              stab={stabData}
              funktionen={funktionenData}
              personen={aktivePersonen}
              canEdit={canEdit}
            />

            {/* Besetzung */}
            {produktion.stueck_id && (
              <BesetzungsMatrix
                produktionId={id}
                stueckId={produktion.stueck_id}
                rollen={rollenMitBesetzungen}
                personen={aktivePersonen}
                canEdit={canEdit}
              />
            )}

            {/* Dokumente */}
            <ProduktionDokumenteSection
              produktionId={id}
              dokumente={dokumente}
              canEdit={canEdit}
            />

            {/* Aufführungsserien */}
            <SerieManager
              produktionId={id}
              serien={serien}
              auffuehrungen={serienAuffuehrungen}
              templates={templates}
              canEdit={canEdit}
            />
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
