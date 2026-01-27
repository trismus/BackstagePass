import Link from 'next/link'
import { getHelfereinsaetze } from '@/lib/actions/helfereinsaetze'
import { HelfereinsatzKalender } from '@/components/helfereinsaetze/HelfereinsatzKalender'

export const metadata = {
  title: 'Helfereinsatz-Kalender',
  description: 'Kalenderansicht aller Helfereinsätze',
}

export default async function HelfereinsaetzeKalenderPage() {
  const helfereinsaetze = await getHelfereinsaetze()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Helfereinsatz-Kalender</h1>
            <p className="text-gray-600 mt-1">
              Alle Helfereinsätze im Überblick
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/helfereinsaetze"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
            >
              Listenansicht
            </Link>
            <Link
              href="/helfereinsaetze/neu"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + Neuer Helfereinsatz
            </Link>
          </div>
        </div>

        {/* Calendar */}
        <HelfereinsatzKalender helfereinsaetze={helfereinsaetze} />

        {/* Legend */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h3 className="font-medium text-gray-900 mb-3">Status-Legende</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Offen</span>
              <span className="text-sm text-gray-600">Noch nicht bestätigt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Bestätigt</span>
              <span className="text-sm text-gray-600">Vom Partner bestätigt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Abgeschlossen</span>
              <span className="text-sm text-gray-600">Durchgeführt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Abgesagt</span>
              <span className="text-sm text-gray-600">Storniert</span>
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
