import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { getRaeume, getRaum } from '@/lib/actions/raeume'
import { RaeumeTable } from '@/components/raeume/RaeumeTable'
import { RaumForm } from '@/components/raeume/RaumForm'

interface PageProps {
  searchParams: Promise<{ edit?: string }>
}

export default async function RaeumePage({ searchParams }: PageProps) {
  const profile = await getUserProfile()

  // Only ADMIN can access this page
  if (!profile || profile.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const params = await searchParams
  const raeume = await getRaeume()
  const editRaum = params.edit ? await getRaum(params.edit) : null

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Räume verwalten</h1>
          <p className="mt-1 text-gray-600">
            Räume für Aufführungen und Veranstaltungen verwalten
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Room List */}
          <div className="lg:col-span-2">
            <RaeumeTable raeume={raeume} />
          </div>

          {/* Form */}
          <div>
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-4 font-medium text-gray-900">
                {editRaum ? 'Raum bearbeiten' : 'Neuer Raum'}
              </h2>
              <RaumForm
                key={editRaum?.id || 'create'}
                raum={editRaum || undefined}
                mode={editRaum ? 'edit' : 'create'}
              />
              {editRaum && (
                <div className="mt-4 border-t pt-4">
                  <Link
                    href="/raeume"
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Abbrechen
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

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
