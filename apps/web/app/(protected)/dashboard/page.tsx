import Link from 'next/link'
import { getUser, getUserProfile } from '@/lib/supabase/server'
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
} from '@/components/dashboard'
import { getAktuelleProduktionFuerDashboard } from '@/lib/actions/produktionen'

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

export default async function DashboardPage() {
  const user = await getUser()
  const profile = await getUserProfile()
  const supabase = await createClient()

  const isVorstand = profile?.role ? isManagement(profile.role) : false
  const today = new Date().toISOString().split('T')[0]

  // Parallel data fetching
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

  // =============================================================================
  // Vorstand Dashboard (3-Säulen-Layout)
  // =============================================================================

  if (isVorstand) {
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
  // Standard Dashboard (für nicht-Vorstand)
  // =============================================================================

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <HelpButton contextKey="dashboard" />
        </div>
        <p className="mt-1 text-neutral-600">
          Willkommen zurück
          {profile?.display_name ? `, ${profile.display_name}` : ''}!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={'/mitglieder' as never}>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300">
            <h3 className="text-sm font-medium text-neutral-500">Mitglieder</h3>
            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {mitgliederAktiv ?? 0}
            </p>
            <p className="mt-1 text-sm text-neutral-500">Aktive Personen</p>
          </div>
        </Link>
        <Link href={'/partner' as never}>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300">
            <h3 className="text-sm font-medium text-neutral-500">Partner</h3>
            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {partnerCount ?? 0}
            </p>
            <p className="mt-1 text-sm text-neutral-500">Partnerorganisationen</p>
          </div>
        </Link>
        <Link href={'/veranstaltungen' as never}>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300">
            <h3 className="text-sm font-medium text-neutral-500">Diese Woche</h3>
            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {upcomingEvents?.length ?? 0}
            </p>
            <p className="mt-1 text-sm text-neutral-500">Anstehende Events</p>
          </div>
        </Link>
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="text-sm font-medium text-neutral-500">Helfer</h3>
          <p className="mt-2 text-3xl font-bold text-neutral-900">
            {helferCount ?? 0}
          </p>
          <p className="mt-1 text-sm text-neutral-500">Aktive Zusagen</p>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">
            Anstehende Veranstaltungen
          </h2>
          <Link
            href="/veranstaltungen"
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Alle ansehen &rarr;
          </Link>
        </div>
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/veranstaltungen/${event.id}` as never}
                className="flex items-center justify-between py-3 transition-colors hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium text-neutral-900">{event.titel}</p>
                  <p className="text-sm text-neutral-500">
                    {formatDate(event.datum)}
                  </p>
                </div>
                <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                  {event.typ}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-4 text-neutral-500">
            Keine Veranstaltungen in den nächsten 7 Tagen.
          </p>
        )}
      </div>

      {/* Profile Summary */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">Dein Profil</h2>
          <Link
            href="/profile"
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Bearbeiten &rarr;
          </Link>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-neutral-500">E-Mail</dt>
            <dd className="mt-1 font-medium text-neutral-900">{user?.email}</dd>
          </div>
          {profile && (
            <>
              <div>
                <dt className="text-neutral-500">Name</dt>
                <dd className="mt-1 font-medium text-neutral-900">
                  {profile.display_name || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Rolle</dt>
                <dd className="mt-1 font-medium text-neutral-900">
                  {profile.role}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>
    </div>
  )
}
