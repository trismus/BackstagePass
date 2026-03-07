import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagement } from '@/lib/supabase/permissions'
import { getAuthenticatedHelferDashboard } from '@/lib/actions/helfer-dashboard'
import { HelferDashboardView } from '@/components/helfer-dashboard/HelferDashboardView'

export const metadata = {
  title: 'Meine Einsätze | BackstagePass',
  description: 'Übersicht deiner Helfer-Einsätze',
}

export default async function VorstandEinsaetzePage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login' as never)
  }

  if (!isManagement(profile.role)) {
    redirect('/dashboard' as never)
  }

  const helferDashboardData = await getAuthenticatedHelferDashboard()

  const hasData = helferDashboardData && helferDashboardData.anmeldungen.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Meine Einsätze</h1>
        <p className="mt-1 text-neutral-600">
          Übersicht aller deiner Helfer-Einsätze
        </p>
      </div>

      {/* Helfer System (helfer_anmeldungen) */}
      {helferDashboardData && (
        <section>
          <HelferDashboardView data={helferDashboardData} showHeader={false} />
        </section>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-neutral-700">
            Noch keine Einsätze vorhanden
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Sobald du dich für einen Helfer-Einsatz anmeldest, siehst du hier
            deine Übersicht.
          </p>
        </div>
      )}
    </div>
  )
}
