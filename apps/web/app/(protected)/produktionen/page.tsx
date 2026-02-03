import Link from 'next/link'
import type { Route } from 'next'
import { getProduktionen } from '@/lib/actions/produktionen'
import { getUserProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/supabase/permissions'
import { ProduktionenViewToggle } from '@/components/produktionen'

export default async function ProduktionenPage() {
  const [produktionen, profile] = await Promise.all([
    getProduktionen(),
    getUserProfile(),
  ])

  const canEdit = profile
    ? hasPermission(profile.role, 'produktionen:write')
    : false
  const canDelete = profile
    ? hasPermission(profile.role, 'produktionen:delete')
    : false

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Produktionen</h1>
            <p className="mt-1 text-gray-600">
              Theaterprojekte planen und verwalten
            </p>
          </div>
          {canEdit && (
            <Link
              href={'/produktionen/neu' as Route}
              className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
            >
              + Neue Produktion
            </Link>
          )}
        </div>

        {/* Dashboard with View Toggle */}
        <ProduktionenViewToggle
          produktionen={produktionen}
          canEdit={canEdit}
          canDelete={canDelete}
        />

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
