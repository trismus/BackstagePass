import Link from 'next/link'
import { requirePermission } from '@/lib/supabase/auth-helpers'
import { getGruppen } from '@/lib/actions/gruppen'
import { GruppenTable } from '@/components/gruppen'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export const metadata = {
  title: 'Gruppen verwalten',
  description: 'Teams, Gremien und Produktions-Casts verwalten',
}

export default async function GruppenPage() {
  const profile = await requirePermission('mitglieder:write')
  const gruppen = await getGruppen()

  const isAdmin = profile.role === 'ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Gruppen verwalten
          </h1>
          <p className="mt-1 text-neutral-600">
            Teams, Gremien und Produktions-Casts
          </p>
        </div>
        <Link
          href={'/admin/gruppen/neu' as never}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Neue Gruppe
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Gruppen ({gruppen.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <GruppenTable
            gruppen={gruppen}
            canEdit={true}
            canDelete={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  )
}
