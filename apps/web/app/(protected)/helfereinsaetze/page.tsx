import Link from 'next/link'
import { getHelfereinsaetze } from '@/lib/actions/helfereinsaetze'
import { HelfereinsaetzeTable } from '@/components/helfereinsaetze/HelfereinsaetzeTable'

export const metadata = {
  title: 'Helfereinsätze',
  description: 'Externe Helfereinsätze bei Partnerorganisationen verwalten',
}

export default async function HelfereinsaetzePage() {
  const helfereinsaetze = await getHelfereinsaetze()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Helfereinsätze</h1>
            <p className="text-gray-600 mt-1">
              Externe Helfereinsätze bei Partnerorganisationen verwalten
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/helfereinsaetze/kalender"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
            >
              Kalenderansicht
            </Link>
            <Link
              href="/helfereinsaetze/neu"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + Neuer Helfereinsatz
            </Link>
          </div>
        </div>

        {/* Table */}
        <HelfereinsaetzeTable helfereinsaetze={helfereinsaetze} />

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
