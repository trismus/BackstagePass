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
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Helfereinsatz-Kalender
            </h1>
            <p className="mt-1 text-gray-600">
              Alle Helfereinsätze im Überblick
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/helfereinsaetze"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
            >
              Listenansicht
            </Link>
            <Link
              href="/helfereinsaetze/neu"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              + Neuer Helfereinsatz
            </Link>
          </div>
        </div>

        {/* Calendar */}
        <HelfereinsatzKalender helfereinsaetze={helfereinsaetze} />

        {/* Legend */}
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <h3 className="mb-3 font-medium text-gray-900">Status-Legende</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                Offen
              </span>
              <span className="text-sm text-gray-600">
                Noch nicht bestätigt
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Bestätigt
              </span>
              <span className="text-sm text-gray-600">
                Vom Partner bestätigt
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                Abgeschlossen
              </span>
              <span className="text-sm text-gray-600">Durchgeführt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                Abgesagt
              </span>
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
