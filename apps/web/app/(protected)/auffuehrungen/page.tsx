import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { getVeranstaltungen } from '@/lib/actions/veranstaltungen'
import { AuffuehrungenTable } from '@/components/auffuehrungen/AuffuehrungenTable'
import { canEdit } from '@/lib/supabase/auth-helpers'

export default async function AuffuehrungenPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  const allVeranstaltungen = await getVeranstaltungen()
  const auffuehrungen = allVeranstaltungen.filter(
    (v) => v.typ === 'auffuehrung'
  )
  const userCanEdit = canEdit(profile.role)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aufführungen</h1>
            <p className="mt-1 text-gray-600">
              Aufführungen mit Zeitblöcken, Schichten und Ressourcen verwalten
            </p>
          </div>
          <div className="flex gap-3">
            {userCanEdit && (
              <Link
                href="/auffuehrungen/neu"
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Neue Aufführung
              </Link>
            )}
            <Link
              href="/auffuehrungen/kalender"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Kalender
            </Link>
          </div>
        </div>

        {/* Quick Links for Admin */}
        {profile.role === 'ADMIN' && (
          <div className="mb-6 flex gap-4">
            <Link
              href="/raeume"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Räume verwalten &rarr;
            </Link>
            <Link
              href="/ressourcen"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ressourcen verwalten &rarr;
            </Link>
            <Link
              href={'/templates' as never}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Vorlagen verwalten &rarr;
            </Link>
          </div>
        )}

        {/* Aufführungen Table */}
        <AuffuehrungenTable auffuehrungen={auffuehrungen} />

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
