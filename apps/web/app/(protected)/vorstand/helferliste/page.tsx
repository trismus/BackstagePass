import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagement } from '@/lib/supabase/permissions'
import { getSchichtenDashboard } from '@/lib/actions/schichten-dashboard'
import { getHelferEventsMitBelegung } from '@/lib/actions/helferliste-management'
import { SchichtenDashboard } from '@/components/vorstand/schichten-dashboard'

export const metadata = {
  title: 'Schichten-Dashboard | BackstagePass',
  description: 'Übersicht aller Schichten über alle kommenden Aufführungen',
}

export default async function VorstandHelferlistePage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login' as never)
  }

  if (!isManagement(profile.role)) {
    redirect('/dashboard' as never)
  }

  // Fetch both System B and System A data in parallel
  const [dashboardResult, legacyResult] = await Promise.all([
    getSchichtenDashboard(),
    getHelferEventsMitBelegung(),
  ])

  // Handle System B error
  if (!dashboardResult.success || !dashboardResult.data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Schichten-Dashboard
          </h1>
          <p className="mt-1 text-neutral-600">
            Übersicht aller Schichten über alle kommenden Aufführungen
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800">
            {dashboardResult.error || 'Fehler beim Laden der Daten'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Schichten-Dashboard
        </h1>
        <p className="mt-1 text-neutral-600">
          Übersicht aller Schichten über alle kommenden Aufführungen
        </p>
      </div>

      <SchichtenDashboard
        dashboardData={dashboardResult.data}
        legacyEvents={legacyResult.success ? legacyResult.data ?? [] : []}
        legacyError={legacyResult.success ? undefined : legacyResult.error}
      />
    </div>
  )
}
