import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getVeranstaltung,
  getAnmeldungCount,
} from '@/lib/actions/veranstaltungen'
import { getAnmeldungenForEvent } from '@/lib/actions/anmeldungen'
import { getRessourcenReservierungen } from '@/lib/actions/ressourcen-bedarf'
import { StatusBadge, TypBadge } from '@/components/veranstaltungen/StatusBadge'
import { TeilnehmerListe } from '@/components/veranstaltungen/TeilnehmerListe'
import { VeranstaltungForm } from '@/components/veranstaltungen/VeranstaltungForm'
import { RessourcenBedarfManager } from '@/components/veranstaltungen/RessourcenBedarfManager'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}

export default async function VeranstaltungDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { edit } = await searchParams

  const veranstaltung = await getVeranstaltung(id)

  if (!veranstaltung) {
    notFound()
  }

  const isEditMode = edit === 'true'

  if (isEditMode) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* Back Link */}
          <div className="mb-6">
            <Link
              href={`/veranstaltungen/${id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              &larr; Zurück zu Details
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Veranstaltung bearbeiten
            </h1>
          </div>

          {/* Form */}
          <div className="rounded-lg bg-white p-6 shadow">
            <VeranstaltungForm veranstaltung={veranstaltung} mode="edit" />
          </div>
        </div>
      </main>
    )
  }

  const anmeldungen = await getAnmeldungenForEvent(id)
  const anmeldungCount = await getAnmeldungCount(id)
  const ressourcenReservierungen = await getRessourcenReservierungen(id)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null
    return timeStr.slice(0, 5)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/veranstaltungen"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zur Übersicht
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <TypBadge typ={veranstaltung.typ} />
                <StatusBadge status={veranstaltung.status} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {veranstaltung.titel}
              </h1>
            </div>
            <Link
              href={`/veranstaltungen/${id}?edit=true`}
              className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Bearbeiten
            </Link>
          </div>

          {veranstaltung.beschreibung && (
            <p className="mb-4 text-gray-600">{veranstaltung.beschreibung}</p>
          )}

          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div>
              <span className="text-gray-500">Datum:</span>
              <span className="ml-2 font-medium">
                {formatDate(veranstaltung.datum)}
              </span>
            </div>
            {veranstaltung.startzeit && (
              <div>
                <span className="text-gray-500">Zeit:</span>
                <span className="ml-2 font-medium">
                  {formatTime(veranstaltung.startzeit)}
                  {veranstaltung.endzeit &&
                    ` - ${formatTime(veranstaltung.endzeit)}`}
                </span>
              </div>
            )}
            {veranstaltung.ort && (
              <div>
                <span className="text-gray-500">Ort:</span>
                <span className="ml-2 font-medium">{veranstaltung.ort}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Teilnehmer:</span>
              <span className="ml-2 font-medium">
                {anmeldungCount}
                {veranstaltung.max_teilnehmer &&
                  ` / ${veranstaltung.max_teilnehmer}`}
              </span>
            </div>
          </div>
        </div>

        {/* Ressourcenbedarf */}
        <div className="mb-6">
          <RessourcenBedarfManager
            veranstaltungId={id}
            reservierungen={ressourcenReservierungen}
            canEdit={true}
          />
        </div>

        {/* Teilnehmer */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Teilnehmer</h2>
          <TeilnehmerListe
            anmeldungen={anmeldungen}
            maxTeilnehmer={veranstaltung.max_teilnehmer}
            canEdit={true}
          />
        </div>
      </div>
    </main>
  )
}
