import { getUserProfile } from '@/lib/supabase/server'
import { getKalenderEvents, getProduktionenForFilter } from '@/lib/actions/kalender'
import { UnifiedCalendar } from '@/components/kalender'

export const metadata = {
  title: 'Kalender | BackstagePass',
  description: 'Gesamtübersicht aller Termine: Proben, Aufführungen, Veranstaltungen',
}

export default async function KalenderPage() {
  const profile = await getUserProfile()
  const userRole = profile?.role ?? 'FREUNDE'

  // Get events for the next 6 months by default
  const today = new Date()
  const startDatum = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString()
    .split('T')[0]
  const endDatum = new Date(today.getFullYear(), today.getMonth() + 6, 0)
    .toISOString()
    .split('T')[0]

  const [events, produktionen] = await Promise.all([
    getKalenderEvents(startDatum, endDatum),
    getProduktionenForFilter(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
        <p className="mt-1 text-gray-600">
          Gesamtübersicht aller Termine: Proben, Aufführungen, Veranstaltungen
        </p>
      </div>

      <UnifiedCalendar
        initialEvents={events}
        produktionen={produktionen}
        userRole={userRole}
      />
    </div>
  )
}
