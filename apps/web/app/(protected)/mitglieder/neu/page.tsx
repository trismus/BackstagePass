import Link from 'next/link'
import { MitgliedForm } from '@/components/mitglieder/MitgliedForm'

export default function NeuesMitgliedPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/mitglieder"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zur Liste
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Neues Mitglied
          </h1>
          <p className="mt-1 text-gray-600">Füge ein neues Mitglied hinzu</p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <MitgliedForm mode="create" />
        </div>
      </div>
    </main>
  )
}
