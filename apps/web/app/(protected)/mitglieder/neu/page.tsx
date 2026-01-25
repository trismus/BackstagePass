import Link from 'next/link'
import { MitgliedForm } from '@/components/mitglieder/MitgliedForm'

export default function NeuesMitgliedPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/mitglieder"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            &larr; Zurück zur Liste
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Neues Mitglied
          </h1>
          <p className="text-gray-600 mt-1">Füge ein neues Mitglied hinzu</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <MitgliedForm mode="create" />
        </div>
      </div>
    </main>
  )
}
