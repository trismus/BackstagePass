import Link from 'next/link'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Dashboard',
  description: 'Dein BackstagePass Dashboard',
}

// Stats Card Component
function StatCard({
  title,
  value,
  description,
  href,
  trend,
}: {
  title: string
  value: number | string
  description: string
  href?: string
  trend?: { value: number; label: string }
}) {
  const content = (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.value >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value} {trend.label}
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold text-neutral-900">{value}</p>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  )

  if (href) {
    return <Link href={href as never}>{content}</Link>
  }
  return content
}

// Quick Action Button
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

// Event Row Component
function EventRow({
  title,
  date,
  type,
  href,
}: {
  title: string
  date: string
  type: string
  href: string
}) {
  const typeColors: Record<string, string> = {
    auffuehrung: 'bg-purple-100 text-purple-700',
    veranstaltung: 'bg-blue-100 text-blue-700',
    probe: 'bg-yellow-100 text-yellow-700',
    helfereinsatz: 'bg-green-100 text-green-700',
  }

  return (
    <Link
      href={href as never}
      className="-mx-2 flex items-center justify-between rounded border-b border-neutral-100 px-2 py-3 transition-colors last:border-0 hover:bg-neutral-50"
    >
      <div>
        <p className="font-medium text-neutral-900">{title}</p>
        <p className="text-sm text-neutral-500">{date}</p>
      </div>
      <span
        className={`rounded px-2 py-1 text-xs font-medium ${
          typeColors[type] || 'bg-neutral-100 text-neutral-700'
        }`}
      >
        {type === 'auffuehrung'
          ? 'Aufführung'
          : type === 'veranstaltung'
            ? 'Event'
            : type === 'probe'
              ? 'Probe'
              : type === 'helfereinsatz'
                ? 'Helfer'
                : type}
      </span>
    </Link>
  )
}

export default async function DashboardPage() {
  const user = await getUser()
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Get stats
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // Parallel data fetching
  const [
    { count: mitgliederCount },
    { count: partnerCount },
    { data: upcomingEvents },
    { count: offeneAnmeldungen },
  ] = await Promise.all([
    supabase.from('personen').select('*', { count: 'exact', head: true }),
    supabase.from('partner').select('*', { count: 'exact', head: true }),
    supabase
      .from('veranstaltungen')
      .select('id, titel, datum, typ')
      .gte('datum', today)
      .lte('datum', nextWeek)
      .order('datum', { ascending: true })
      .limit(5),
    supabase
      .from('anmeldungen')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'angemeldet'),
  ])

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-CH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-neutral-600">
          Willkommen zurück
          {profile?.display_name ? `, ${profile.display_name}` : ''}!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Mitglieder"
          value={mitgliederCount ?? 0}
          description="Aktive Personen"
          href="/mitglieder"
        />
        <StatCard
          title="Partner"
          value={partnerCount ?? 0}
          description="Partnerorganisationen"
          href="/partner"
        />
        <StatCard
          title="Anmeldungen"
          value={offeneAnmeldungen ?? 0}
          description="Offene Anmeldungen"
          href="/veranstaltungen"
        />
        <StatCard
          title="Diese Woche"
          value={upcomingEvents?.length ?? 0}
          description="Anstehende Events"
          href="/veranstaltungen/kalender"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Events - Takes 2 columns */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 lg:col-span-2">
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
            <div>
              {upcomingEvents.map((event) => (
                <EventRow
                  key={event.id}
                  title={event.titel}
                  date={formatDate(event.datum)}
                  type={event.typ}
                  href={`/veranstaltungen/${event.id}`}
                />
              ))}
            </div>
          ) : (
            <p className="py-4 text-neutral-500">
              Keine Veranstaltungen in den nächsten 7 Tagen.
            </p>
          )}
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-neutral-900">
            Schnellaktionen
          </h2>
          <div className="space-y-3">
            <QuickAction
              href="/veranstaltungen/neu"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              label="Neue Veranstaltung"
            />
            <QuickAction
              href="/mitglieder/neu"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              }
              label="Neues Mitglied"
            />
            <QuickAction
              href="/helfereinsaetze/neu"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
              label="Neuer Helfereinsatz"
            />
            <QuickAction
              href="/stuecke/neu"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              }
              label="Neues Stück"
            />
          </div>
        </div>
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
