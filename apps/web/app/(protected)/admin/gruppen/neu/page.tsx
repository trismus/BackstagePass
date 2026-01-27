import { requirePermission } from '@/lib/supabase/auth-helpers'
import { createClient } from '@/lib/supabase/server'
import { GruppeForm } from '@/components/gruppen'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export const metadata = {
  title: 'Neue Gruppe erstellen',
  description: 'Eine neue Gruppe anlegen',
}

export default async function NeueGruppePage() {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  // Stücke für Produktion-Gruppen laden
  const { data: stuecke } = await supabase
    .from('stuecke')
    .select('id, titel')
    .order('titel')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Neue Gruppe erstellen
        </h1>
        <p className="mt-1 text-neutral-600">
          Lege ein neues Team, Gremium oder eine Produktions-Gruppe an
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Gruppendaten</CardTitle>
        </CardHeader>
        <CardContent>
          <GruppeForm stuecke={stuecke || []} />
        </CardContent>
      </Card>
    </div>
  )
}
