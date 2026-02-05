import { Metadata } from 'next'
import { getPublicHelferlisteByToken } from '@/lib/actions/external-registration'
import { PublicHelferlisteView } from '@/components/public-registration'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const result = await getPublicHelferlisteByToken(token)

  if ('error' in result) {
    return {
      title: 'Helfer gesucht | Theatergruppe Widen',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `Helfer gesucht: ${result.veranstaltung.titel} | Theatergruppe Widen`,
    description: `Melde dich als Helfer für "${result.veranstaltung.titel}" an.`,
    openGraph: {
      title: `Helfer gesucht: ${result.veranstaltung.titel}`,
      description: `Wir suchen Helfer für unsere Veranstaltung am ${new Date(result.veranstaltung.datum).toLocaleDateString('de-CH')}`,
      type: 'website',
    },
    robots: { index: false, follow: false }, // Privacy: don't index token URLs
  }
}

export default async function PublicHelferAnmeldungPage({ params }: PageProps) {
  const { token } = await params
  const result = await getPublicHelferlisteByToken(token)

  // Handle errors
  if ('error' in result) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
              <svg
                className="h-8 w-8 text-warning-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              {result.error}
            </h1>
            <p className="mt-3 text-gray-600">
              Falls du einen gültigen Anmeldelink erwartest, wende dich bitte an
              den Veranstalter.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-sm text-gray-500">
            <p>Theatergruppe Widen</p>
          </div>
        </div>
      </main>
    )
  }

  const { veranstaltung, zeitbloecke, infoBloecke } = result

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
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1 text-sm font-medium text-primary-700">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Helfer gesucht
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {veranstaltung.titel}
          </h1>
        </div>

        {/* Event Details */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Datum</dt>
              <dd className="mt-1 text-gray-900">
                {formatDate(veranstaltung.datum)}
              </dd>
            </div>
            {veranstaltung.startzeit && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Zeit</dt>
                <dd className="mt-1 text-gray-900">
                  {formatTime(veranstaltung.startzeit)}
                  {veranstaltung.endzeit &&
                    ` - ${formatTime(veranstaltung.endzeit)}`}{' '}
                  Uhr
                </dd>
              </div>
            )}
            {veranstaltung.ort && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Ort</dt>
                <dd className="mt-1 text-gray-900">{veranstaltung.ort}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Public Helferliste View */}
        <PublicHelferlisteView
          data={{ veranstaltung, zeitbloecke, infoBloecke }}
          token={token}
        />

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Theatergruppe Widen</p>
          <p className="mt-1">
            <a href="/datenschutz" className="text-primary-600 hover:underline">
              Datenschutzerklärung
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
