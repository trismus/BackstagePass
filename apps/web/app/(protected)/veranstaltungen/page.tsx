import Link from 'next/link'
import { getVeranstaltungen } from '@/lib/actions/veranstaltungen'
import { VeranstaltungenTable } from '@/components/veranstaltungen/VeranstaltungenTable'

export const metadata = {
  title: 'Veranstaltungen',
  description: 'Vereinsevents, Proben und Aufführungen verwalten',
}

export default async function VeranstaltungenPage() {
  const veranstaltungen = await getVeranstaltungen()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Veranstaltungen
            </h1>
            <p className="mt-1 text-gray-600">
              Vereinsevents, Proben und Aufführungen verwalten
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/veranstaltungen/kalender"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
            >
              Kalenderansicht
            </Link>
            <Link
              href="/veranstaltungen/neu"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              + Neue Veranstaltung
            </Link>
          </div>
        </div>

        {/* Table */}
        <VeranstaltungenTable veranstaltungen={veranstaltungen} />

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
