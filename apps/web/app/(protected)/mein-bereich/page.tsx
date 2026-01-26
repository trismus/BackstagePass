import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getAnmeldungenForPerson } from '@/lib/actions/anmeldungen'
import { getStundenkontoSummary } from '@/lib/actions/stundenkonto'
import {
  UpcomingEventsWidget,
  StundenWidget,
  QuickLinksWidget,
} from '@/components/mein-bereich/DashboardWidgets'

export default async function MeinBereichPage() {
  const profile = await getUserProfile()

  if (!profile) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Bitte melde dich an, um deinen persönlichen Bereich zu sehen.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Try to find the person linked to this user
  const supabase = await createClient()
  const { data: person } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .eq('email', profile.email)
    .single()

  // Get data if person is linked
  const anmeldungen = person ? await getAnmeldungenForPerson(person.id) : []
  const stundenSummary = person
    ? await getStundenkontoSummary(person.id)
    : { total: 0, thisYear: 0, lastEntries: [] }

  // Filter to upcoming events only
  const today = new Date().toISOString().split('T')[0]
  const upcomingAnmeldungen = anmeldungen.filter(
    (a) =>
      a.veranstaltung.datum >= today &&
      (a.status === 'angemeldet' || a.status === 'warteliste')
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hallo{person ? `, ${person.vorname}` : ''}!
          </h1>
          <p className="text-gray-600 mt-1">
            Dein persönlicher Bereich bei BackstagePass
          </p>
        </div>

        {!person && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Dein Account ist noch nicht mit einem Mitgliederprofil verknüpft.
              Bitte wende dich an einen Administrator.
            </p>
          </div>
        )}

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <UpcomingEventsWidget anmeldungen={upcomingAnmeldungen} />

          {/* Stundenkonto */}
          <StundenWidget
            total={stundenSummary.total}
            thisYear={stundenSummary.thisYear}
            lastEntries={stundenSummary.lastEntries}
          />

          {/* Quick Links */}
          <QuickLinksWidget />
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            &larr; Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
