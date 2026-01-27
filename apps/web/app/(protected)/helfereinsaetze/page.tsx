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
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Helfereinsätze</h1>
            <p className="mt-1 text-gray-600">
              Externe Helfereinsätze bei Partnerorganisationen verwalten
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/helfereinsaetze/kalender"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
            >
              Kalenderansicht
            </Link>
            <Link
              href="/helfereinsaetze/neu"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
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
