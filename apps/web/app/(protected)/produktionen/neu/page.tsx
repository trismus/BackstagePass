import Link from 'next/link'
import type { Route } from 'next'
import { getActiveStuecke } from '@/lib/actions/stuecke'
import { ProduktionForm } from '@/components/produktionen'
import { createClient } from '@/lib/supabase/server'
import type { Person } from '@/lib/supabase/types'

export default async function NeueProduktionPage() {
  const supabase = await createClient()

  const [stuecke, { data: personen }] = await Promise.all([
    getActiveStuecke(),
    supabase
      .from('personen')
      .select('id, vorname, nachname, email')
      .eq('aktiv', true)
      .order('nachname', { ascending: true }),
  ])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={'/produktionen' as Route}
            className="text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zur Übersicht
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Neue Produktion
          </h1>
          <p className="mt-1 text-gray-600">
            Erstelle ein neues Theaterprojekt
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <ProduktionForm
            mode="create"
            stuecke={stuecke}
            personen={(personen as Person[]) || []}
          />
        </div>
      </div>
    </main>
  )
}
