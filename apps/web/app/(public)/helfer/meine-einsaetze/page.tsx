import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getUserProfile } from '@/lib/supabase/server'
import { getAuthenticatedHelferDashboard } from '@/lib/actions/helfer-dashboard'
import { HelferDashboardView } from '@/components/helfer-dashboard/HelferDashboardView'
import { Card, CardContent } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Meine Einsätze',
  description: 'Übersicht deiner Helfer-Einsätze',
  robots: { index: false },
}

export default async function MeineEinsaetzePage() {
  const profile = await getUserProfile()
  if (!profile) redirect('/login' as never)

  const data = await getAuthenticatedHelferDashboard()
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-medium text-neutral-700">
              Kein Helfer-Profil gefunden
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Dein Konto konnte keinem Helfer-Profil zugeordnet werden.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <HelferDashboardView data={data} />
    </div>
  )
}
