import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { getStueck, getSzenen } from '@/lib/actions/stuecke'
import { getUserProfile } from '@/lib/supabase/server'
import { canEdit as checkCanEdit } from '@/lib/supabase/auth-helpers'
import { ProbeForm } from '@/components/proben'

interface NeueProbePageProps {
  params: Promise<{ id: string }>
}

export default async function NeueProbePagePage({
  params,
}: NeueProbePageProps) {
  const { id: stueckId } = await params
  const profile = await getUserProfile()
  const canEdit = profile ? checkCanEdit(profile.role) : false

  if (!canEdit) {
    redirect(`/stuecke/${stueckId}` as Route)
  }

  const stueck = await getStueck(stueckId)
  if (!stueck) {
    notFound()
  }

  // Hole alle Szenen des Stücks
  const szenen = await getSzenen(stueckId)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <Link
            href={`/stuecke/${stueckId}` as Route}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zum Stück
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Neue Probe erstellen
        </h1>
        <p className="mt-1 text-gray-600">{stueck.titel}</p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <ProbeForm mode="create" stueckId={stueckId} szenen={szenen} />
      </div>
    </div>
  )
}
