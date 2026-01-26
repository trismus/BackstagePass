import Link from 'next/link'
import { getUser, getUserProfile } from '@/lib/supabase/server'

export const metadata = {
  title: 'Dashboard',
  description: 'Dein BackstagePass Dashboard',
}

export default async function DashboardPage() {
  const user = await getUser()
  const profile = await getUserProfile()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-neutral-600">
          Willkommen zurück
          {profile?.display_name ? `, ${profile.display_name}` : ''}!
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-neutral-900">Mitglieder</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Aktiv
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            Verwalte die Mitglieder deines Theatervereins
          </p>
          <Link
            href="/mitglieder"
            className="mt-4 inline-flex text-sm font-medium text-neutral-900 hover:text-neutral-600"
          >
            Mitglieder ansehen &rarr;
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-neutral-900">Produktionen</h2>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
              Bald
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            Plane und verwalte deine Theaterproduktionen
          </p>
          <span className="mt-4 inline-flex text-sm text-neutral-400">
            Kommt bald
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-neutral-900">Proben</h2>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
              Bald
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            Koordiniere Probentermine und Verfuegbarkeiten
          </p>
          <span className="mt-4 inline-flex text-sm text-neutral-400">
            Kommt bald
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="font-medium text-neutral-900">Dein Profil</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">E-Mail</dt>
            <dd className="font-medium text-neutral-900">{user?.email}</dd>
          </div>
          {profile && (
            <>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Name</dt>
                <dd className="font-medium text-neutral-900">
                  {profile.display_name || '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Rolle</dt>
                <dd className="font-medium text-neutral-900">{profile.role}</dd>
              </div>
            </>
          )}
        </dl>
      </div>
    </div>
  )
}
