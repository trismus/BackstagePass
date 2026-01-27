import Link from 'next/link'
import { getVeranstaltungen } from '@/lib/actions/veranstaltungen'
import { EventKalender } from '@/components/veranstaltungen/EventKalender'

export const metadata = {
  title: 'Veranstaltungskalender',
  description: 'Kalenderansicht aller Vereinsveranstaltungen',
}

export default async function VeranstaltungenKalenderPage() {
  const veranstaltungen = await getVeranstaltungen()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Veranstaltungskalender
            </h1>
            <p className="mt-1 text-gray-600">
              Alle Vereinsveranstaltungen im Überblick
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/veranstaltungen"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
            >
              Listenansicht
            </Link>
            <Link
              href="/veranstaltungen/neu"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              + Neue Veranstaltung
            </Link>
          </div>
        </div>

        {/* Calendar */}
        <EventKalender veranstaltungen={veranstaltungen} />

        {/* Legend */}
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <h3 className="mb-3 font-medium text-gray-900">Legende</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Vereinsevent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600">Probe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-purple-500" />
              <span className="text-sm text-gray-600">Aufführung</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-gray-500" />
              <span className="text-sm text-gray-600">Sonstiges</span>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            &larr; Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
