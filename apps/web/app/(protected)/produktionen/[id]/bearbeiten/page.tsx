import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getProduktion } from '@/lib/actions/produktionen'
import { getActiveStuecke } from '@/lib/actions/stuecke'
import { createClient } from '@/lib/supabase/server'
import { ProduktionForm } from '@/components/produktionen'
import type { Person } from '@/lib/supabase/types'

interface BearbeitenPageProps {
  params: Promise<{ id: string }>
}

export default async function ProduktionBearbeitenPage({
  params,
}: BearbeitenPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [produktion, stuecke, { data: personen }] = await Promise.all([
    getProduktion(id),
    getActiveStuecke(),
    supabase
      .from('personen')
      .select('id, vorname, nachname, email')
      .eq('aktiv', true)
      .order('nachname', { ascending: true }),
  ])

  if (!produktion) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={`/produktionen/${id}` as Route}
            className="text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zur Produktion
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Produktion bearbeiten
          </h1>
          <p className="mt-1 text-gray-600">{produktion.titel}</p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <ProduktionForm
            mode="edit"
            produktion={produktion}
            stuecke={stuecke}
            personen={(personen as Person[]) || []}
          />
        </div>
      </div>
    </main>
  )
}
