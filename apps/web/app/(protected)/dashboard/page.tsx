import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { isManagementRole, getStartPageForRole } from '@/lib/navigation'
import { USER_ROLE_LABELS } from '@/lib/supabase/types'

export const metadata = {
  title: 'Dashboard',
  description: 'Management Dashboard',
}

export default async function DashboardPage() {
  const user = await getUser()
  const profile = await getUserProfile()
  const role = profile?.role ?? 'FREUNDE'

  // Redirect non-management to their respective start pages
  if (!isManagementRole(role)) {
    redirect(getStartPageForRole(role))
  }

  const supabase = await createClient()

  // Fetch quick stats
  const [
    { count: mitgliederCount },
    { count: veranstaltungenCount },
    { count: partnerCount },
  ] = await Promise.all([
    supabase.from('personen').select('*', { count: 'exact', head: true }).eq('aktiv', true),
    supabase.from('veranstaltungen').select('*', { count: 'exact', head: true }),
    supabase.from('partner').select('*', { count: 'exact', head: true }).eq('aktiv', true),
  ])

  // Fetch upcoming events (next 7 days)
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: upcomingEvents } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, typ, status')
    .gte('datum', today)
    .lte('datum', nextWeek)
    .order('datum', { ascending: true })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Willkommen zurück{profile?.display_name ? `, ${profile.display_name}` : ''}!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Aktive Mitglieder</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{mitgliederCount ?? 0}</p>
          <Link href="/mitglieder" className="mt-2 inline-block text-xs text-neutral-500 hover:text-neutral-900">
            Alle ansehen →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Veranstaltungen</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{veranstaltungenCount ?? 0}</p>
          <Link href="/veranstaltungen" className="mt-2 inline-block text-xs text-neutral-500 hover:text-neutral-900">
            Alle ansehen →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Partner</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{partnerCount ?? 0}</p>
          <Link href="/partner" className="mt-2 inline-block text-xs text-neutral-500 hover:text-neutral-900">
            Alle ansehen →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Deine Rolle</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {USER_ROLE_LABELS[role]}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-neutral-900">Nächste 7 Tage</h2>
            <Link href="/veranstaltungen" className="text-sm text-neutral-500 hover:text-neutral-900">
              Alle →
            </Link>
          </div>
          <div className="mt-4">
            {!upcomingEvents || upcomingEvents.length === 0 ? (
              <p className="text-sm text-neutral-500">Keine Veranstaltungen in den nächsten 7 Tagen.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/veranstaltungen/${event.id}` as never}
                      className="flex items-center justify-between rounded-lg border border-neutral-100 p-3 transition-colors hover:bg-neutral-50"
                    >
                      <div>
                        <p className="font-medium text-neutral-900">{event.titel}</p>
                        <p className="text-sm text-neutral-500">
                          {new Date(event.datum).toLocaleDateString('de-CH', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        event.status === 'bestaetigt'
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'abgesagt'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {event.typ}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-medium text-neutral-900">Schnellzugriff</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/veranstaltungen/neu"
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-neutral-900">Neue Veranstaltung</span>
            </Link>
            <Link
              href="/mitglieder/neu"
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-neutral-900">Neues Mitglied</span>
            </Link>
            <Link
              href="/auffuehrungen"
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-neutral-900">Aufführungen</span>
            </Link>
            <Link
              href="/helfereinsaetze"
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-neutral-900">Helfereinsätze</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-medium text-neutral-900">Dein Profil</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-neutral-500">E-Mail</dt>
            <dd className="mt-1 font-medium text-neutral-900">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">Name</dt>
            <dd className="mt-1 font-medium text-neutral-900">
              {profile?.display_name || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">Rolle</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-sm font-medium text-neutral-700">
                {USER_ROLE_LABELS[role]}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
