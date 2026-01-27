import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { canEdit as canEditFn } from '@/lib/supabase/auth-helpers'
import { getVeranstaltung } from '@/lib/actions/veranstaltungen'
import { getZeitbloecke } from '@/lib/actions/zeitbloecke'
import {
  getSchichten,
  getBedarfUebersicht,
  getZuweisungenForVeranstaltung,
} from '@/lib/actions/auffuehrung-schichten'
import {
  getRaumReservierungen,
  getRessourcenReservierungen,
} from '@/lib/actions/reservierungen'
import { getPersonen } from '@/lib/actions/personen'
import { StatusBadge } from '@/components/veranstaltungen/StatusBadge'
import { ZeitblockEditor } from '@/components/auffuehrungen/ZeitblockEditor'
import { SchichtEditor } from '@/components/auffuehrungen/SchichtEditor'
import { BedarfUebersicht } from '@/components/auffuehrungen/BedarfUebersicht'
import { SchichtZuweisungListe } from '@/components/auffuehrungen/SchichtZuweisungListe'
import { RaumReservierungPicker } from '@/components/reservierungen/RaumReservierungPicker'
import { RessourcenPicker } from '@/components/reservierungen/RessourcenPicker'
import { getAktiveRaeume } from '@/lib/actions/raeume'
import { getAktiveRessourcen } from '@/lib/actions/ressourcen'
import { getTemplates } from '@/lib/actions/templates'
import { TemplateApplyDialog } from '@/components/templates/TemplateApplyDialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AuffuehrungDetailPage({ params }: PageProps) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  const { id } = await params
  const veranstaltung = await getVeranstaltung(id)

  if (!veranstaltung || veranstaltung.typ !== 'auffuehrung') {
    notFound()
  }

  const canEdit = canEditFn(profile.role)
  const isAdmin = profile.role === 'ADMIN'

  // Fetch all related data in parallel
  const [
    zeitbloecke,
    schichten,
    bedarf,
    zuweisungen,
    raumReservierungen,
    ressourcenReservierungen,
    personen,
    raeume,
    ressourcen,
    templates,
  ] = await Promise.all([
    getZeitbloecke(id),
    getSchichten(id),
    getBedarfUebersicht(id),
    getZuweisungenForVeranstaltung(id),
    getRaumReservierungen(id),
    getRessourcenReservierungen(id),
    getPersonen(),
    getAktiveRaeume(),
    getAktiveRessourcen(),
    getTemplates(),
  ])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-'
    return timeStr.slice(0, 5)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {veranstaltung.titel}
                </h1>
                <StatusBadge status={veranstaltung.status} />
              </div>
              <p className="text-gray-600">
                {formatDate(veranstaltung.datum)}
                {veranstaltung.startzeit && (
                  <span className="ml-2">
                    {formatTime(veranstaltung.startzeit)}
                    {veranstaltung.endzeit &&
                      ` - ${formatTime(veranstaltung.endzeit)}`}
                  </span>
                )}
                {veranstaltung.ort && (
                  <span className="ml-4">{veranstaltung.ort}</span>
                )}
              </p>
              {veranstaltung.beschreibung && (
                <p className="mt-2 text-gray-500">
                  {veranstaltung.beschreibung}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {canEdit && (
                <Link
                  href={`/veranstaltungen/${id}/bearbeiten` as never}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Bearbeiten
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Template Apply (only if no zeitbloecke yet) */}
        {canEdit &&
          templates.length > 0 &&
          zeitbloecke.length === 0 &&
          veranstaltung.startzeit && (
            <div className="mb-6">
              <TemplateApplyDialog
                veranstaltungId={id}
                startzeit={veranstaltung.startzeit}
                templates={templates}
              />
            </div>
          )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Zeitblöcke */}
            <ZeitblockEditor
              veranstaltungId={id}
              zeitbloecke={zeitbloecke}
              canEdit={canEdit}
            />

            {/* Schichten */}
            <SchichtEditor
              veranstaltungId={id}
              schichten={schichten}
              zeitbloecke={zeitbloecke}
              canEdit={canEdit}
            />

            {/* Räume Reservierung */}
            <RaumReservierungPicker
              veranstaltungId={id}
              datum={veranstaltung.datum}
              reservierungen={raumReservierungen}
              raeume={raeume}
              canEdit={canEdit}
            />

            {/* Ressourcen Reservierung */}
            <RessourcenPicker
              veranstaltungId={id}
              datum={veranstaltung.datum}
              reservierungen={ressourcenReservierungen}
              ressourcen={ressourcen}
              canEdit={canEdit}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Bedarf Übersicht */}
            <BedarfUebersicht bedarf={bedarf} />

            {/* Zuweisungen */}
            <SchichtZuweisungListe
              schichten={schichten}
              zuweisungen={zuweisungen}
              personen={personen}
              canEdit={canEdit}
            />
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="mt-8 border-t pt-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              Admin-Aktionen
            </h3>
            <div className="flex gap-3">
              <Link
                href="/raeume"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Räume verwalten
              </Link>
              <Link
                href="/ressourcen"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ressourcen verwalten
              </Link>
              <Link
                href={'/templates' as never}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Vorlagen verwalten
              </Link>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/auffuehrungen"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zu Aufführungen
          </Link>
        </div>
      </div>
    </main>
  )
}
