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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Veranstaltungskalender</h1>
            <p className="text-gray-600 mt-1">
              Alle Vereinsveranstaltungen im Überblick
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/veranstaltungen"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
            >
              Listenansicht
            </Link>
            <Link
              href="/veranstaltungen/neu"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + Neue Veranstaltung
            </Link>
          </div>
        </div>

        {/* Calendar */}
        <EventKalender veranstaltungen={veranstaltungen} />

        {/* Legend */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h3 className="font-medium text-gray-900 mb-3">Legende</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Vereinsevent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600">Probe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm text-gray-600">Aufführung</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-500" />
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
