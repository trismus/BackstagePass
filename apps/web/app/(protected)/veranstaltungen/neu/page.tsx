import Link from 'next/link'
import { VeranstaltungForm } from '@/components/veranstaltungen/VeranstaltungForm'

export default function NeueVeranstaltungPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/veranstaltungen"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zur Übersicht
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Neue Veranstaltung
          </h1>
          <p className="mt-1 text-gray-600">
            Erstelle ein neues Vereinsevent, eine Probe oder Aufführung
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <VeranstaltungForm mode="create" />
        </div>
      </div>
    </main>
  )
}
