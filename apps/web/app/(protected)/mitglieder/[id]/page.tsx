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
            {person.vorname} {person.nachname}
          </h1>
          <p className="mt-1 text-gray-600">Mitglied bearbeiten</p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <MitgliedForm person={person} mode="edit" />
        </div>
      </div>
    </main>
  )
}
