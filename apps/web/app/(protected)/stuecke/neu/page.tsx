import Link from 'next/link'
import type { Route } from 'next'
import { StueckForm } from '@/components/stuecke'

export default function NeuesStueckPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={'/stuecke' as Route}
            className="text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zur Übersicht
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Neues Stück</h1>
          <p className="mt-1 text-gray-600">
            Erstelle ein neues Theaterstück mit Szenen und Rollen
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <StueckForm mode="create" />
        </div>
      </div>
    </main>
  )
}
