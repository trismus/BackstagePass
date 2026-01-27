import Link from 'next/link'
import type { Route } from 'next'
import { StueckForm } from '@/components/stuecke'

export default function NeuesStueckPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
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
          <p className="text-gray-600 mt-1">
            Erstelle ein neues Theaterstück mit Szenen und Rollen
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <StueckForm mode="create" />
        </div>
      </div>
    </main>
  )
}
