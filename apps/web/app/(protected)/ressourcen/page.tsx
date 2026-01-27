import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { getRessourcen, getRessource } from '@/lib/actions/ressourcen'
import { RessourcenTable } from '@/components/ressourcen/RessourcenTable'
import { RessourceForm } from '@/components/ressourcen/RessourceForm'

interface PageProps {
  searchParams: Promise<{ edit?: string }>
}

export default async function RessourcenPage({ searchParams }: PageProps) {
  const profile = await getUserProfile()

  // Only ADMIN can access this page
  if (!profile || profile.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const params = await searchParams
  const ressourcen = await getRessourcen()
  const editRessource = params.edit ? await getRessource(params.edit) : null

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Ressourcen verwalten
          </h1>
          <p className="mt-1 text-gray-600">
            Equipment und Material für Aufführungen verwalten
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Resource List */}
          <div className="lg:col-span-2">
            <RessourcenTable ressourcen={ressourcen} />
          </div>

          {/* Form */}
          <div>
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-4 font-medium text-gray-900">
                {editRessource ? 'Ressource bearbeiten' : 'Neue Ressource'}
              </h2>
              <RessourceForm
                key={editRessource?.id || 'create'}
                ressource={editRessource || undefined}
                mode={editRessource ? 'edit' : 'create'}
              />
              {editRessource && (
                <div className="mt-4 border-t pt-4">
                  <Link
                    href="/ressourcen"
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
