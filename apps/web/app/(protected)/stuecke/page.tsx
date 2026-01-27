import Link from 'next/link'
import type { Route } from 'next'
import { getStuecke } from '@/lib/actions/stuecke'
import { StueckeTable } from '@/components/stuecke'

export default async function StueckePage() {
  const stuecke = await getStuecke()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stücke</h1>
            <p className="text-gray-600 mt-1">
              Theaterstücke, Szenen und Rollen verwalten
            </p>
          </div>
          <Link
            href={'/stuecke/neu' as Route}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            + Neues Stück
          </Link>
        </div>

        {/* Table */}
        <StueckeTable stuecke={stuecke} />

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-800">
            &larr; Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
