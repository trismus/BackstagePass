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
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-yellow-800">
          Bitte melde dich an, um deinen persönlichen Bereich zu sehen.
        </p>
      </div>
    )
  }

  const isPassiveMember = profile.role === 'MITGLIED_PASSIV'

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Hallo{person ? `, ${person.vorname}` : ''}!
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isPassiveMember
            ? 'Schön, dass du vorbeischaust.'
            : 'Dein persönlicher Bereich bei BackstagePass'}
        </p>
      </div>

      {!person && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">
            Dein Account ist noch nicht mit einem Mitgliederprofil verknüpft.
            Bitte wende dich an einen Administrator.
          </p>
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Upcoming Events */}
        <UpcomingEventsWidget anmeldungen={upcomingAnmeldungen} />

        {/* Stundenkonto - only for active members */}
        {!isPassiveMember && (
          <StundenWidget
            total={stundenSummary.total}
            thisYear={stundenSummary.thisYear}
            lastEntries={stundenSummary.lastEntries}
          />
        )}

        {/* Quick Links */}
        <QuickLinksWidget />
      </div>

      {/* Additional sections for active members */}
      {!isPassiveMember && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Quick Actions */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-medium text-neutral-900">Schnellaktionen</h2>
            <div className="mt-4 space-y-3">
              <a
                href="/veranstaltungen"
                className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                  <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-neutral-900">Für Veranstaltung anmelden</p>
                  <p className="text-sm text-neutral-500">Termine einsehen und teilnehmen</p>
                </div>
              </a>
              <a
                href="/helfereinsaetze"
                className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                  <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-neutral-900">Helfen gehen</p>
                  <p className="text-sm text-neutral-500">Für Helfereinsätze anmelden</p>
                </div>
              </a>
            </div>
          </div>

          {/* My Schedule */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-medium text-neutral-900">Meine nächsten Termine</h2>
            <div className="mt-4">
              {upcomingAnmeldungen.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Keine anstehenden Termine.
                </p>
              ) : (
                <ul className="space-y-3">
                  {upcomingAnmeldungen.slice(0, 3).map((a) => (
                    <li key={a.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-900">{a.veranstaltung.titel}</p>
                        <p className="text-sm text-neutral-500">
                          {new Date(a.veranstaltung.datum).toLocaleDateString('de-CH')}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.status === 'angemeldet'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {a.status === 'angemeldet' ? 'Angemeldet' : 'Warteliste'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
