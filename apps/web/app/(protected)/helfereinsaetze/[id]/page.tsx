import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getHelfereinsatz,
  getHelferrollen,
} from '@/lib/actions/helfereinsaetze'
import { getHelferschichtenForEinsatz } from '@/lib/actions/helferschichten'
import { getActivePartner } from '@/lib/actions/partner'
import { HelfereinsatzStatusBadge } from '@/components/helfereinsaetze/HelfereinsatzStatusBadge'
import { HelferschichtenListe } from '@/components/helfereinsaetze/HelferschichtenListe'
import { HelfereinsatzForm } from '@/components/helfereinsaetze/HelfereinsatzForm'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}

export default async function HelfereinsatzDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { edit } = await searchParams

  const helfereinsatz = await getHelfereinsatz(id)

  if (!helfereinsatz) {
    notFound()
  }

  const isEditMode = edit === 'true'

  if (isEditMode) {
    const partner = await getActivePartner()
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* Back Link */}
          <div className="mb-6">
            <Link
              href={`/helfereinsaetze/${id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              &larr; Zurück zu Details
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Helfereinsatz bearbeiten
            </h1>
          </div>

          {/* Form */}
          <div className="rounded-lg bg-white p-6 shadow">
            <HelfereinsatzForm
              helfereinsatz={helfereinsatz}
              partner={partner}
              mode="edit"
            />
          </div>
        </div>
      </main>
    )
  }

  const rollen = await getHelferrollen(id)
  const schichten = await getHelferschichtenForEinsatz(id)

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
            href="/helfereinsaetze"
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
                <HelfereinsatzStatusBadge status={helfereinsatz.status} />
                {helfereinsatz.partner && (
                  <span className="text-sm text-gray-500">
                    Partner: {helfereinsatz.partner.name}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {helfereinsatz.titel}
              </h1>
            </div>
            <Link
              href={`/helfereinsaetze/${id}?edit=true`}
              className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Bearbeiten
            </Link>
          </div>

          {helfereinsatz.beschreibung && (
            <p className="mb-4 text-gray-600">{helfereinsatz.beschreibung}</p>
          )}

          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div>
              <span className="text-gray-500">Datum:</span>
              <span className="ml-2 font-medium">
                {formatDate(helfereinsatz.datum)}
              </span>
            </div>
            {helfereinsatz.startzeit && (
              <div>
                <span className="text-gray-500">Zeit:</span>
                <span className="ml-2 font-medium">
                  {formatTime(helfereinsatz.startzeit)}
                  {helfereinsatz.endzeit &&
                    ` - ${formatTime(helfereinsatz.endzeit)}`}
                </span>
              </div>
            )}
            {helfereinsatz.ort && (
              <div>
                <span className="text-gray-500">Ort:</span>
                <span className="ml-2 font-medium">{helfereinsatz.ort}</span>
              </div>
            )}
            {helfereinsatz.stundenlohn_verein && (
              <div>
                <span className="text-gray-500">Stundenlohn Verein:</span>
                <span className="ml-2 font-medium">
                  CHF {helfereinsatz.stundenlohn_verein.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Benötigte Rollen */}
        {rollen.length > 0 && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Benötigte Rollen
            </h2>
            <div className="flex flex-wrap gap-2">
              {rollen.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  {r.rolle}
                  {r.anzahl_benoetigt > 1 && (
                    <span className="ml-1 text-gray-500">
                      (x{r.anzahl_benoetigt})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Helfer */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Zugewiesene Helfer
          </h2>
          <HelferschichtenListe schichten={schichten} canEdit={true} />
        </div>
      </div>
    </main>
  )
}
