import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getAnmeldungenForPerson } from '@/lib/actions/anmeldungen'
import { getStundenkontoSummary } from '@/lib/actions/stundenkonto'
import { MiniKalender } from '@/components/mein-bereich/MiniKalender'
import { ProfileCard } from '@/components/mein-bereich/ProfileCard'
import { EditableProfileCard } from '@/components/mein-bereich/EditableProfileCard'
import {
  UpcomingEventsWidget,
  StundenWidget,
  HelferEinsaetzeWidget,
} from '@/components/mein-bereich/DashboardWidgets'
import type { KalenderTermin } from '@/components/mein-bereich/MiniKalender'

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
    .select('id, vorname, nachname, email, telefon, strasse, plz, ort, geburtsdatum')
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
        .limit(5)
    : { data: [] }

  // Build calendar events from all sources
  const kalenderTermine: KalenderTermin[] = []

  // Add anmeldungen as calendar events
  anmeldungen.forEach((a) => {
    kalenderTermine.push({
      id: a.id,
      datum: a.veranstaltung.datum,
      titel: a.veranstaltung.titel,
      typ: 'veranstaltung',
      href: `/veranstaltungen/${a.veranstaltung.id}`,
    })
  })

  // Add helper events
  if (verfuegbareEinsaetze) {
    verfuegbareEinsaetze.forEach((e) => {
      kalenderTermine.push({
        id: e.id,
        datum: e.datum,
        titel: e.titel,
        typ: 'helfereinsatz',
        href: `/helfereinsaetze/${e.id}`,
      })
    })
  }

  // Filter to upcoming events only
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
        <p className="mt-1 text-neutral-600">
          {isPassiveMember
            ? 'Dein Überblick über die Theatergruppe Widen'
            : 'Dein persönlicher Bereich bei BackstagePass'}
        </p>
      </div>

      {/* Outlook-Style 2-Column Layout */}
      {isPassiveMember ? (
        // Passive Member View - Simplified 2-column
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-1">
            <MiniKalender termine={kalenderTermine} />
          </div>

          {/* Right Column - Profile & Events */}
          <div className="space-y-6 lg:col-span-2">
            <EditableProfileCard person={person} role={profile.role} />
            <UpcomingEventsWidget anmeldungen={upcomingAnmeldungen} />

            {/* CTA for passive members */}
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
          </div>
        </div>
      ) : (
        // Active Member View - Full Outlook-Style Layout
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Sidebar - Calendar */}
          <div className="space-y-6 lg:col-span-4 xl:col-span-3">
            <MiniKalender termine={kalenderTermine} />

            {/* Quick Stats */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-medium text-neutral-500">Übersicht</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Anstehende Termine</span>
                  <span className="font-semibold text-neutral-900">{upcomingAnmeldungen.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Stunden gesamt</span>
                  <span className="font-semibold text-neutral-900">{stundenSummary.total.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Dieses Jahr</span>
                  <span className="font-semibold text-green-600">{stundenSummary.thisYear.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Offene Einsätze</span>
                  <span className="font-semibold text-blue-600">{verfuegbareEinsaetze?.length ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-medium text-neutral-500">Schnellzugriff</h3>
              <div className="space-y-1">
                <Link
                  href="/veranstaltungen"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="text-blue-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Veranstaltungen
                </Link>
                <Link
                  href="/helfereinsaetze"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="text-amber-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  Helfereinsätze
                </Link>
                <Link
                  href="/mein-bereich/stundenkonto"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="text-green-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Stundenkonto
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="text-purple-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  Einstellungen
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="space-y-6 lg:col-span-8 xl:col-span-9">
            {/* Profile Card */}
            <EditableProfileCard
              person={person}
              role={profile.role}
              stundenTotal={stundenSummary.total}
              stundenThisYear={stundenSummary.thisYear}
            />

            {/* Content Widgets */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <UpcomingEventsWidget anmeldungen={upcomingAnmeldungen} />
              <HelferEinsaetzeWidget einsaetze={verfuegbareEinsaetze ?? []} />
            </div>

            {/* Stunden Widget - Full Width */}
            <StundenWidget
              total={stundenSummary.total}
              thisYear={stundenSummary.thisYear}
              lastEntries={stundenSummary.lastEntries}
            />
          </div>
        </div>
      )}
    </div>
  )
}
