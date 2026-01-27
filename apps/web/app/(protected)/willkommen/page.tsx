import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'

export default async function WillkommenPage() {
  const profile = await getUserProfile()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Willkommen bei BackstagePass
          </h1>
          <p className="mt-1 text-gray-600">
            Das Verwaltungssystem der Theatergruppe Widen
          </p>
        </div>

        {/* Welcome Card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Hallo{profile?.email ? ` ${profile.email}` : ''}!
          </h2>
          <p className="mb-4 text-gray-600">
            Du bist als Freund der Theatergruppe Widen registriert. Hier kannst
            du unsere aktuellen Veranstaltungen einsehen und dich über unser
            Programm informieren.
          </p>
          <p className="text-gray-600">
            Möchtest du aktiver mitmachen? Wende dich gerne an uns - wir freuen
            uns immer über neue Helfer und Mitglieder!
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/veranstaltungen"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-gray-300"
          >
            <h3 className="mb-2 font-semibold text-gray-900">
              Veranstaltungen
            </h3>
            <p className="text-sm text-gray-600">
              Aktuelle und kommende Veranstaltungen der TGW
            </p>
          </Link>

          <Link
            href="/profile"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-gray-300"
          >
            <h3 className="mb-2 font-semibold text-gray-900">Mein Profil</h3>
            <p className="text-sm text-gray-600">
              Deine Kontaktdaten und Einstellungen verwalten
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
