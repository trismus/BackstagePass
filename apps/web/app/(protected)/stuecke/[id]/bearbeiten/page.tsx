import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getStueck } from '@/lib/actions/stuecke'
import { StueckForm } from '@/components/stuecke'

interface BearbeitenPageProps {
  params: Promise<{ id: string }>
}

export default async function BearbeitenPage({ params }: BearbeitenPageProps) {
  const { id } = await params
  const stueck = await getStueck(id)

  if (!stueck) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={`/stuecke/${id}` as Route}
            className="text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zum Stück
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Stück bearbeiten</h1>
          <p className="text-gray-600 mt-1">{stueck.titel}</p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <StueckForm mode="edit" stueck={stueck} />
        </div>
      </div>
    </main>
  )
}
