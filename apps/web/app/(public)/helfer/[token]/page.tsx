import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicEventByToken } from '@/lib/actions/helferliste'
import { PublicEventView } from '@/components/helferliste/PublicEventView'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params
  const event = await getPublicEventByToken(token)
  return {
    title: event?.name ? `Helfer gesucht: ${event.name}` : 'Helfer gesucht',
    description: event?.beschreibung || 'Melde dich als Helfer an',
  }
}

export default async function PublicHelferPage({ params }: PageProps) {
  const { token } = await params
  const event = await getPublicEventByToken(token)

  if (!event) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          {event.beschreibung && (
            <p className="mt-2 text-gray-600">{event.beschreibung}</p>
          )}
        </div>

        {/* Event Details */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">Datum</dt>
              <dd className="font-medium text-gray-900">
                {new Date(event.datum_start).toLocaleDateString('de-CH', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Zeit</dt>
              <dd className="font-medium text-gray-900">
                {new Date(event.datum_start).toLocaleTimeString('de-CH', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' - '}
                {new Date(event.datum_end).toLocaleTimeString('de-CH', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
            {event.ort && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-gray-500">Ort</dt>
                <dd className="font-medium text-gray-900">{event.ort}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Public Roles */}
        <PublicEventView event={event} />

        {/* Cross-Link to /mitmachen */}
        <div className="mt-8 rounded-lg border border-primary-200 bg-primary-50 p-4 text-center">
          <p className="text-sm text-primary-800">
            Du möchtest auch bei anderen Veranstaltungen helfen?
          </p>
          <Link
            href={'/mitmachen' as never}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline"
          >
            Alle offenen Schichten ansehen
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Theatergruppe Widen</p>
        </div>
      </div>
    </main>
  )
}
