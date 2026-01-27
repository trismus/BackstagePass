import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'

export default async function WillkommenPage() {
  const profile = await getUserProfile()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Willkommen bei BackstagePass
          </h1>
          <p className="text-gray-600 mt-1">
            Das Verwaltungssystem der Theatergruppe Widen
          </p>
        </div>

        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hallo{profile?.email ? ` ${profile.email}` : ''}!
          </h2>
          <p className="text-gray-600 mb-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/veranstaltungen"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Veranstaltungen</h3>
            <p className="text-gray-600 text-sm">
              Aktuelle und kommende Veranstaltungen der TGW
            </p>
          </Link>

          <Link
            href="/profile"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Mein Profil</h3>
            <p className="text-gray-600 text-sm">
              Deine Kontaktdaten und Einstellungen verwalten
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
