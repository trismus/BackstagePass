import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/supabase/auth-helpers'
import { createClient } from '@/lib/supabase/server'
import { getGruppeById } from '@/lib/actions/gruppen'
import { GruppeForm } from '@/components/gruppen'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const gruppe = await getGruppeById(id)
  return {
    title: gruppe ? `${gruppe.name} bearbeiten` : 'Gruppe nicht gefunden',
  }
}

export default async function GruppeBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission('mitglieder:write')
  const { id } = await params

  const [gruppe, supabase] = await Promise.all([
    getGruppeById(id),
    createClient(),
  ])

  if (!gruppe) {
    notFound()
  }

  // Stücke für Produktion-Gruppen laden
  const { data: stuecke } = await supabase
    .from('stuecke')
    .select('id, titel')
    .order('titel')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Gruppe bearbeiten
        </h1>
        <p className="mt-1 text-neutral-600">
          {gruppe.name}
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Gruppendaten</CardTitle>
        </CardHeader>
        <CardContent>
          <GruppeForm gruppe={gruppe} stuecke={stuecke || []} />
        </CardContent>
      </Card>
    </div>
  )
}
