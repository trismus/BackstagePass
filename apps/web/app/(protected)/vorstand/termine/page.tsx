import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagement } from '@/lib/supabase/permissions'
import { getPersonalEvents, getPersonVerfuegbarkeiten } from '@/lib/actions/persoenlicher-kalender'
import { PersonalCalendar } from '@/components/mein-bereich/PersonalCalendar'

export const metadata = {
  title: 'Meine Termine | BackstagePass',
  description: 'Dein persönlicher Terminkalender',
}

export default async function VorstandTerminePage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login' as never)
  }

  if (!isManagement(profile.role)) {
    redirect('/dashboard' as never)
  }

  const today = new Date()
  const startDatum = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString()
    .split('T')[0]
  const endDatum = new Date(today.getFullYear() + 1, today.getMonth(), 0)
    .toISOString()
    .split('T')[0]

  const [events, verfuegbarkeiten] = await Promise.all([
    getPersonalEvents(startDatum, endDatum),
    getPersonVerfuegbarkeiten(undefined, startDatum, endDatum),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meine Termine</h1>
        <p className="mt-1 text-gray-600">
          Alle deine Veranstaltungen, Proben und Einsätze auf einen Blick
        </p>
      </div>

      <PersonalCalendar initialEvents={events} verfuegbarkeiten={verfuegbarkeiten} />
    </div>
  )
}
