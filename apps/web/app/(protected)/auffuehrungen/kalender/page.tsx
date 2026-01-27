import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { getVeranstaltungen } from '@/lib/actions/veranstaltungen'
import { AuffuehrungKalender } from '@/components/auffuehrungen/AuffuehrungKalender'

export default async function AuffuehrungenKalenderPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  const allVeranstaltungen = await getVeranstaltungen()
  const auffuehrungen = allVeranstaltungen.filter(
    (v) => v.typ === 'auffuehrung'
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Aufführungskalender
            </h1>
            <p className="mt-1 text-gray-600">
              Übersicht aller Aufführungen im Kalender
            </p>
          </div>
          <Link
            href="/auffuehrungen"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Listenansicht
          </Link>
        </div>

        {/* Calendar */}
        <AuffuehrungKalender auffuehrungen={auffuehrungen} />

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/auffuehrungen"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zu Aufführungen
          </Link>
        </div>
      </div>
    </main>
  )
}
