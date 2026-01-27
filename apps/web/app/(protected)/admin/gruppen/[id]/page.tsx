import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/supabase/auth-helpers'
import { getGruppeById } from '@/lib/actions/gruppen'
import { GruppenTypBadge } from '@/components/gruppen'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { GruppeMitgliederListe } from './GruppeMitgliederListe'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const gruppe = await getGruppeById(id)
  return {
    title: gruppe ? `Gruppe: ${gruppe.name}` : 'Gruppe nicht gefunden',
  }
}

export default async function GruppeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission('mitglieder:write')
  const { id } = await params
  const gruppe = await getGruppeById(id)

  if (!gruppe) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900">
              {gruppe.name}
            </h1>
            <GruppenTypBadge typ={gruppe.typ} />
            {!gruppe.aktiv && (
              <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                Inaktiv
              </span>
            )}
          </div>
          {gruppe.beschreibung && (
            <p className="mt-1 text-neutral-600">{gruppe.beschreibung}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/gruppen/${id}/bearbeiten` as never}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Bearbeiten
          </Link>
          <Link
            href={'/admin/gruppen' as never}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
          >
            Zurück
          </Link>
        </div>
      </div>

      {/* Stück-Verknüpfung */}
      {gruppe.stueck && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Verknüpftes Stück:</span>
              <Link
                href={`/stuecke/${gruppe.stueck.id}` as never}
                className="font-medium text-primary-600 hover:text-primary-800"
              >
                {gruppe.stueck.titel}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mitglieder */}
      <Card>
        <CardHeader>
          <CardTitle>
            Mitglieder ({gruppe.mitglieder?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GruppeMitgliederListe
            gruppeId={gruppe.id}
            mitglieder={gruppe.mitglieder || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
