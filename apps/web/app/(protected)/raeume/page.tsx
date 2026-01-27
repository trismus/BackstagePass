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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Räume verwalten</h1>
          <p className="text-gray-600 mt-1">
            Räume für Aufführungen und Veranstaltungen verwalten
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room List */}
          <div className="lg:col-span-2">
            <RaeumeTable raeume={raeume} />
          </div>

          {/* Form */}
          <div>
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="font-medium text-gray-900 mb-4">
                {editRaum ? 'Raum bearbeiten' : 'Neuer Raum'}
              </h2>
              <RaumForm
                key={editRaum?.id || 'create'}
                raum={editRaum || undefined}
                mode={editRaum ? 'edit' : 'create'}
              />
              {editRaum && (
                <div className="mt-4 pt-4 border-t">
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
          <Link href="/auffuehrungen" className="text-blue-600 hover:text-blue-800">
            &larr; Zurück zu Aufführungen
          </Link>
        </div>
      </div>
    </main>
  )
}
