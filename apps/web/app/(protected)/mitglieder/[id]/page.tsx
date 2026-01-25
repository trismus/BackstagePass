import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPerson } from '@/lib/actions/personen'
import { MitgliedForm } from '@/components/mitglieder/MitgliedForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MitgliedEditPage({ params }: PageProps) {
  const { id } = await params
  const person = await getPerson(id)

  if (!person) {
    notFound()
  }

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
            {person.vorname} {person.nachname}
          </h1>
          <p className="text-gray-600 mt-1">Mitglied bearbeiten</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <MitgliedForm person={person} mode="edit" />
        </div>
      </div>
    </main>
  )
}
