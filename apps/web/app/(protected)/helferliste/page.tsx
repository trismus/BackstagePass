import Link from 'next/link'
import { getHelferEvents } from '@/lib/actions/helferliste'
import { HelferEventTable } from '@/components/helferliste/HelferEventTable'

export const metadata = {
  title: 'Helferliste',
  description: 'Helfer für Aufführungen und Veranstaltungen verwalten',
}

export default async function HelferlistePage() {
  const events = await getHelferEvents()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Helferliste</h1>
            <p className="mt-1 text-gray-600">
              Helfer für Aufführungen und Veranstaltungen koordinieren
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={'/helferliste/templates' as never}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
            >
              Vorlagen
            </Link>
            <Link
              href={'/helferliste/neu' as never}
              className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
            >
              + Neuer Helfer-Event
            </Link>
          </div>
        </div>

        {/* Table */}
        <HelferEventTable events={events} />

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
