import Link from 'next/link'
import type { Route } from 'next'
import { getStuecke } from '@/lib/actions/stuecke'
import { StueckeTable } from '@/components/stuecke'
import { HelpButton } from '@/components/help'

export default async function StueckePage() {
  const stuecke = await getStuecke()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Stücke</h1>
              <HelpButton contextKey="stuecke" />
            </div>
            <p className="mt-1 text-gray-600">
              Theaterstücke, Szenen und Rollen verwalten
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={'/stuecke/dashboard' as Route}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Produktions-Dashboard
            </Link>
            <Link
              href={'/stuecke/neu' as Route}
              className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
            >
              + Neues Stück
            </Link>
          </div>
        </div>

        {/* Table */}
        <StueckeTable stuecke={stuecke} />

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
