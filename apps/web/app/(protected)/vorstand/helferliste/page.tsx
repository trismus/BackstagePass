import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagement } from '@/lib/supabase/permissions'
import { getHelferEventsMitBelegung } from '@/lib/actions/helferliste-management'
import { HelferlisteOverview } from '@/components/vorstand/helferliste/HelferlisteOverview'

export const metadata = {
  title: 'Helferliste | BackstagePass',
  description: 'Verwaltung der Helferliste',
}

export default async function VorstandHelferlistePage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login' as never)
  }

  if (!isManagement(profile.role)) {
    redirect('/dashboard' as never)
  }

  const result = await getHelferEventsMitBelegung()

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Helferliste verwalten
        </h1>
        <p className="mt-1 text-neutral-600">
          Übersicht aller Helfer-Events mit Belegungsstatus
        </p>
      </div>

      <HelferlisteOverview
        events={result.success ? result.data ?? [] : []}
        error={result.success ? undefined : result.error}
      />
    </div>
  )
}
