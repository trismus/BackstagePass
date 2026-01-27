import { createClient, getUserProfile } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { getProbe, getProbeSzenen } from '@/lib/actions/proben'
import { getSzenen } from '@/lib/actions/stuecke'
import { canEdit as checkCanEdit } from '@/lib/supabase/auth-helpers'
import { ProbeForm } from '@/components/proben'

interface ProbeBearbeitenPageProps {
  params: Promise<{ id: string }>
}

export default async function ProbeBearbeitenPage({
  params,
}: ProbeBearbeitenPageProps) {
  const { id } = await params
  const profile = await getUserProfile()
  const canEdit = profile ? checkCanEdit(profile.role) : false

  if (!canEdit) {
    redirect('/proben' as Route)
  }

  const probe = await getProbe(id)
  if (!probe) {
    notFound()
  }

  const supabase = await createClient()

  // Hole Stück-Details
  const { data: stueck } = await supabase
    .from('stuecke')
    .select('id, titel')
    .eq('id', probe.stueck_id)
    .single()

  // Hole alle Szenen des Stücks
  const szenen = await getSzenen(probe.stueck_id)

  // Hole aktuell zugewiesene Szenen
  const probeSzenen = await getProbeSzenen(id)
  const selectedSzenenIds = probeSzenen.map(
    (ps: { szene_id: string }) => ps.szene_id
  )

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <Link
            href={`/proben/${id}` as Route}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zur Probe
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Probe bearbeiten</h1>
        <p className="mt-1 text-gray-600">
          {stueck?.titel} - {probe.titel}
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <ProbeForm
          mode="edit"
          stueckId={probe.stueck_id}
          szenen={szenen}
          probe={probe}
          selectedSzenenIds={selectedSzenenIds}
        />
      </div>
    </div>
  )
}
