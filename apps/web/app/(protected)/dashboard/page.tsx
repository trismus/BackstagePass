import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { isManagement } from '@/lib/supabase/auth-helpers'
import { HelpButton } from '@/components/help'
import { TourButton } from '@/components/tours'
import {
  VorstandModul,
  ModulStat,
  ModulAktivitaet,
  HandlungsbedarfCard,
  ProduktionDashboardWidget,
  CircularProgress,
  BarChart,
  MetricCard,
} from '@/components/dashboard'
import { getAktuelleProduktionFuerDashboard } from '@/lib/actions/produktionen'
import { getAnmeldungenForPerson } from '@/lib/actions/anmeldungen'
import { getStundenkontoSummary } from '@/lib/actions/stundenkonto'
import { getRollenHistorie, getHelfereinsatzHistorie } from '@/lib/actions/historie'
import { getUpcomingMitgliederHelferEvents } from '@/lib/actions/helferliste'
import { MiniKalender } from '@/components/mein-bereich/MiniKalender'
import { EditableProfileCard } from '@/components/mein-bereich/EditableProfileCard'
import { RollenHistorie } from '@/components/mein-bereich/RollenHistorie'
import { HelfereinsatzHistorie } from '@/components/mein-bereich/HelfereinsatzHistorie'
import {
  UpcomingEventsWidget,
  StundenWidget,
  HelferEinsaetzeWidget,
  MitgliederHelferEventsWidget,
} from '@/components/mein-bereich/DashboardWidgets'
import type { KalenderTermin } from '@/components/mein-bereich/MiniKalender'

export const metadata = {
  title: 'Dashboard',
  description: 'Dein BackstagePass Dashboard',
}

// =============================================================================
// Helper Components
// =============================================================================

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href as never}
      className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
    >
      <span className="text-neutral-500">{icon}</span>
      <span className="text-sm font-medium text-neutral-900">{label}</span>
    </Link>
  )
}

// =============================================================================
// Icons
// =============================================================================

const icons = {
  users: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  theater: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  ),
  calendar: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
}

// =============================================================================
// Main Component
// =============================================================================

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ansicht?: string }>
}) {
  const profile = await getUserProfile()
  const supabase = await createClient()
  const params = await searchParams

  const isVorstand = profile?.role ? isManagement(profile.role) : false
  const today = new Date().toISOString().split('T')[0]

  // =============================================================================
  // Vorstand Dashboard (3-Säulen-Layout)
  // =============================================================================

  if (isVorstand && params.ansicht !== 'mitglied') {
    // Parallel data fetching for Vorstand
    const [
      { count: mitgliederTotal },
      { count: mitgliederAktiv },
      { count: partnerCount },
      { count: helferCount },
      { data: upcomingEvents },
      { data: aktivesStuck },
      { data: offeneSchichten },
      aktuelleProduktion,
    ] = await Promise.all([
      supabase.from('personen').select('*', { count: 'exact', head: true }),
      supabase.from('personen').select('*', { count: 'exact', head: true }).eq('aktiv', true),
      supabase.from('partner').select('*', { count: 'exact', head: true }),
      supabase.from('helferschichten').select('*', { count: 'exact', head: true }).eq('status', 'zugesagt'),
      supabase
        .from('veranstaltungen')
        .select('id, titel, datum, typ')
        .gte('datum', today)
        .order('datum', { ascending: true })
        .limit(5),
      supabase
        .from('stuecke')
        .select('id, titel, status, premiere_datum')
        .in('status', ['in_planung', 'in_proben', 'aktiv'])
        .order('premiere_datum', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('auffuehrung_schichten')
        .select('id, rolle, anzahl_benoetigt')
        .limit(10),
      getAktuelleProduktionFuerDashboard(),
    ])

    // Calculate warnings
    const offeneHelferPositionen = offeneSchichten?.length || 0

    // Format date helper
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('de-CH', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-neutral-900">
                Vorstand Dashboard
              </h1>
              <div data-tour="help-button">
                <HelpButton contextKey="dashboard" />
              </div>
            </div>
            <p className="mt-1 text-neutral-600">
              Willkommen zurück
              {profile?.display_name ? `, ${profile.display_name}` : ''}!
            </p>
          </div>
          <div>
            <TourButton
              tourId="dashboard:vorstand-overview"
              label="Dashboard-Tour"
              variant="secondary"
              size="sm"
            />
          </div>
        </div>

        {/* Modern Widgets Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Bar Chart: Veranstaltungen diese Woche */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <BarChart
              title="Veranstaltungen diese Woche"
              data={[
                { label: 'Mo', value: 2 },
                { label: 'Di', value: 1 },
                { label: 'Mi', value: 3 },
                { label: 'Do', value: 1 },
                { label: 'Fr', value: 2 },
                { label: 'Sa', value: 4 },
                { label: 'So', value: 1 },
              ]}
              color="primary"
              height={140}
            />
          </div>

          {/* Circular Progress: Mitglieder-Aktivität */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <CircularProgress
              title="Mitglieder-Aktivität"
              value={mitgliederAktiv || 0}
              max={mitgliederTotal || 1}
              subtitle={`${mitgliederAktiv || 0} von ${mitgliederTotal || 0} aktiv`}
              size="md"
              color="success"
            />
          </div>

          {/* Metric Card: Offene Aufgaben */}
          <MetricCard
            title="Offene Helfer-Positionen"
            value={offeneHelferPositionen}
            subtitle={offeneHelferPositionen > 0 ? 'Benötigen Zuweisung' : 'Alle besetzt'}
            variant={offeneHelferPositionen > 0 ? 'warning' : 'success'}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />

          {/* Metric Card: Anstehende Events */}
          <MetricCard
            title="Nächste 7 Tage"
            value={upcomingEvents?.length || 0}
            subtitle="Anstehende Veranstaltungen"
            variant="default"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* 3-Säulen Grid */}
        <div className="grid gap-6 lg:grid-cols-3" data-tour="dashboard-modules">
          {/* Modul 1: Mitglieder & Helfer */}
          <VorstandModul
            titel="Mitglieder & Helfer"
            icon={icons.users}
            quickLinks={[
              { href: '/mitglieder', label: 'Mitglieder' },
              { href: '/helfereinsaetze', label: 'Helfereinsätze' },
              { href: '/admin/gruppen', label: 'Gruppen' },
            ]}
          >
            <div className="space-y-4">
              {/* Stats */}
              <div className="space-y-1">
                <ModulStat
                  label="Mitglieder"
                  value={mitgliederAktiv || 0}
                  subValue={`/ ${mitgliederTotal || 0}`}
                />
                <ModulStat label="Partner" value={partnerCount || 0} />
                <ModulStat label="Aktive Helfer" value={helferCount || 0} />
              </div>

              {/* Handlungsbedarf */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Handlungsbedarf
                </p>
                {offeneHelferPositionen > 0 ? (
                  <HandlungsbedarfCard
                    prioritaet="warnung"
                    titel="Offene Positionen"
                    beschreibung="Helferschichten nicht besetzt"
                    href="/helfereinsaetze"
                    count={offeneHelferPositionen}
                  />
                ) : (
                  <HandlungsbedarfCard
                    prioritaet="ok"
                    titel="Alles besetzt"
                    beschreibung="Keine offenen Positionen"
                  />
                )}
              </div>
            </div>
          </VorstandModul>

          {/* Modul 2: Künstlerische Produktion */}
          <VorstandModul
            titel="Künstlerische Produktion"
            icon={icons.theater}
            quickLinks={[
              { href: '/stuecke', label: 'Stücke' },
              { href: '/proben', label: 'Probenplan' },
            ]}
          >
            <div className="space-y-4">
              {/* Aktives Stück */}
              {aktivesStuck ? (
                <div className="rounded-lg bg-neutral-50 p-3">
                  <p className="text-xs text-neutral-500">Aktuelles Stück</p>
                  <p className="font-semibold text-neutral-900">
                    {aktivesStuck.titel}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        aktivesStuck.status === 'aktiv'
                          ? 'bg-green-100 text-green-800'
                          : aktivesStuck.status === 'in_proben'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {aktivesStuck.status === 'in_planung'
                        ? 'In Planung'
                        : aktivesStuck.status === 'in_proben'
                          ? 'In Proben'
                          : 'Aktiv'}
                    </span>
                    {aktivesStuck.premiere_datum && (
                      <span className="text-xs text-neutral-500">
                        Premiere: {formatDate(aktivesStuck.premiere_datum)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-neutral-50 p-3 text-center text-sm text-neutral-500">
                  Kein aktives Stück
                </div>
              )}

              {/* Handlungsbedarf */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Handlungsbedarf
                </p>
                <HandlungsbedarfCard
                  prioritaet="ok"
                  titel="Keine Probleme"
                  beschreibung="Produktion läuft planmässig"
                />
              </div>
            </div>
          </VorstandModul>

          {/* Modul 3: Produktion & Logistik */}
          <VorstandModul
            titel="Produktion & Logistik"
            icon={icons.calendar}
            quickLinks={[
              { href: '/auffuehrungen', label: 'Aufführungen' },
              { href: '/veranstaltungen', label: 'Veranstaltungen' },
              { href: '/raeume', label: 'Räume' },
            ]}
          >
            <div className="space-y-4">
              {/* Stats */}
              <div className="space-y-1">
                <ModulStat
                  label="Veranstaltungen (7 Tage)"
                  value={upcomingEvents?.length || 0}
                />
              </div>

              {/* Nächste Events */}
              {upcomingEvents && upcomingEvents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Nächste Termine
                  </p>
                  <div className="space-y-1">
                    {upcomingEvents.slice(0, 3).map((event) => (
                      <ModulAktivitaet
                        key={event.id}
                        text={event.titel}
                        datum={formatDate(event.datum)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Handlungsbedarf */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Handlungsbedarf
                </p>
                <HandlungsbedarfCard
                  prioritaet="ok"
                  titel="Alles bereit"
                  beschreibung="Keine offenen Aufgaben"
                />
              </div>
            </div>
          </VorstandModul>
        </div>

        {/* Aktuelle Produktion Widget */}
        <ProduktionDashboardWidget
          produktion={aktuelleProduktion.produktion}
          probenStats={aktuelleProduktion.probenStats ?? undefined}
          besetzungStats={aktuelleProduktion.besetzungStats ?? undefined}
          naechsteTermine={aktuelleProduktion.naechsteTermine}
        />

        {/* Quick Actions */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6" data-tour="quick-actions">
          <h2 className="mb-4 font-semibold text-neutral-900">
            Schnellaktionen
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              href="/veranstaltungen/neu"
              icon={icons.calendar}
              label="Neue Veranstaltung"
            />
            <QuickAction
              href="/mitglieder/neu"
              icon={icons.users}
              label="Neues Mitglied"
            />
            <QuickAction
              href="/helfereinsaetze/neu"
              icon={icons.users}
              label="Neuer Helfereinsatz"
            />
            <QuickAction
              href="/stuecke/neu"
              icon={icons.theater}
              label="Neues Stück"
            />
          </div>
        </div>
      </div>
    )
  }

  // =============================================================================
  // Mitglieder Dashboard (persönlicher Bereich)
  // =============================================================================

  if (!profile) {
    return (
      <div className="space-y-8">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">
            Bitte melde dich an, um dein Dashboard zu sehen.
          </p>
        </div>
      </div>
    )
  }

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

  // Get member-only helper events (helferliste system)
  const mitgliederHelferEvents = !isPassiveMember
    ? await getUpcomingMitgliederHelferEvents()
    : []

  // Get history data (only for active members)
  const rollenHistorie = !isPassiveMember ? await getRollenHistorie() : []
  const helfereinsatzHistorie =
    person && !isPassiveMember
      ? await getHelfereinsatzHistorie(person.id)
      : []

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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Hallo{person ? `, ${person.vorname}` : ''}!
          </h1>
          <HelpButton contextKey="dashboard" />
        </div>
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
                  href="/mein-bereich/verfuegbarkeit"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="text-red-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Verfügbarkeit
                </Link>
                <Link
                  href="/mein-bereich/einstellungen"
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
              <MitgliederHelferEventsWidget events={mitgliederHelferEvents} />
            </div>

            {/* Stunden Widget - Full Width */}
            <StundenWidget
              total={stundenSummary.total}
              thisYear={stundenSummary.thisYear}
              lastEntries={stundenSummary.lastEntries}
            />

            {/* History Section */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <HelfereinsatzHistorie historie={helfereinsatzHistorie} />
              <RollenHistorie historie={rollenHistorie} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
