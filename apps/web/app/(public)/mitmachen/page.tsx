import type { Metadata } from 'next'
import { getPublicShiftOverview } from '@/lib/actions/public-overview'
import { PublicOverviewView } from '@/components/public-overview'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mitmachen | Theatergruppe Widen',
  description:
    'Unterstütze die Theatergruppe Widen als Helfer! Wähle aus verschiedenen Schichten und melde dich direkt an.',
  openGraph: {
    title: 'Mitmachen bei der Theatergruppe Widen',
    description:
      'Wir suchen Helferinnen und Helfer für unsere Veranstaltungen. Melde dich jetzt an!',
    type: 'website',
  },
}

export default async function MitmachenPage() {
  const data = await getPublicShiftOverview()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
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
            Mitmachen bei der Theatergruppe Widen
          </h1>
          <p className="mt-2 text-gray-600">
            Unterstütze uns bei unseren Veranstaltungen — jede helfende Hand
            zählt!
          </p>
        </div>

        {/* Content */}
        {data.events.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900">
              Aktuell keine offenen Schichten
            </h2>
            <p className="mt-2 text-gray-500">
              Derzeit suchen wir keine Helfer. Schau bald wieder vorbei — neue
              Veranstaltungen werden hier veröffentlicht.
            </p>
          </div>
        ) : (
          <PublicOverviewView data={data} />
        )}

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
