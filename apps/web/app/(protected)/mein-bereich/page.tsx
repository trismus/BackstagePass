import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getAnmeldungenForPerson } from '@/lib/actions/anmeldungen'
import { getStundenkontoSummary } from '@/lib/actions/stundenkonto'
import {
  UpcomingEventsWidget,
  StundenWidget,
  QuickLinksWidget,
  HelferEinsaetzeWidget,
} from '@/components/mein-bereich/DashboardWidgets'

export default async function MeinBereichPage() {
  const profile = await getUserProfile()

  if (!profile) {
    return (
      <div className="space-y-8">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">
            Bitte melde dich an, um deinen persönlichen Bereich zu sehen.
          </p>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Try to find the person linked to this user
  const { data: person } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .eq('email', profile.email)
    .single()

  // Check if user is passive member (reduced view)
  const isPassiveMember = profile.role === 'MITGLIED_PASSIV'

  // Get data if person is linked
  const anmeldungen = person ? await getAnmeldungenForPerson(person.id) : []
  const stundenSummary =
    person && !isPassiveMember
      ? await getStundenkontoSummary(person.id)
      : { total: 0, thisYear: 0, lastEntries: [] }

  // Get available helper events (only for active members)
  const today = new Date().toISOString().split('T')[0]
  const { data: verfuegbareEinsaetze } = !isPassiveMember
    ? await supabase
        .from('helfereinsaetze')
        .select(
          'id, titel, datum, startzeit, ort, helfer_max, helferschichten(id)'
        )
        .gte('datum', today)
        .order('datum', { ascending: true })
        .limit(3)
    : { data: [] }

  // Filter to upcoming events only
  const upcomingAnmeldungen = anmeldungen.filter(
    (a) =>
      a.veranstaltung.datum >= today &&
      (a.status === 'angemeldet' || a.status === 'warteliste')
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Hallo{person ? `, ${person.vorname}` : ''}!
        </h1>
        <p className="mt-1 text-neutral-600">
          {isPassiveMember
            ? 'Dein Überblick über die Theatergruppe Widen'
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

      {/* Widgets Grid - Different layout for passive vs active */}
      {isPassiveMember ? (
        // Passive Member View - Simplified
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <UpcomingEventsWidget anmeldungen={upcomingAnmeldungen} />
          <QuickLinksWidget variant="passive" />
        </div>
      ) : (
        // Active Member View - Full
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm text-neutral-500">Anstehende Termine</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {upcomingAnmeldungen.length}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm text-neutral-500">Stunden gesamt</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {stundenSummary.total.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm text-neutral-500">Dieses Jahr</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {stundenSummary.thisYear.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm text-neutral-500">Offene Einsätze</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {verfuegbareEinsaetze?.length ?? 0}
              </p>
            </div>
          </div>

          {/* Main Widgets */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <UpcomingEventsWidget anmeldungen={upcomingAnmeldungen} />
            <StundenWidget
              total={stundenSummary.total}
              thisYear={stundenSummary.thisYear}
              lastEntries={stundenSummary.lastEntries}
            />
            <HelferEinsaetzeWidget einsaetze={verfuegbareEinsaetze ?? []} />
          </div>

          {/* Quick Links */}
          <QuickLinksWidget variant="active" />
        </>
      )}

      {/* CTA for passive members */}
      {isPassiveMember && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900">Aktiver werden?</h3>
          <p className="mt-1 text-sm text-blue-700">
            Möchtest du aktiver in der Theatergruppe mitwirken? Als aktives
            Mitglied kannst du bei Aufführungen und Helfereinsätzen teilnehmen
            und Stunden sammeln.
          </p>
          <Link
            href="/profile"
            className="mt-3 inline-block text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            Mehr erfahren &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}
