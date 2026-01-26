import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getStundenkontoForPerson, getStundensaldo } from '@/lib/actions/stundenkonto'
import { StundenkontoTable } from '@/components/mein-bereich/StundenkontoTable'

export default async function StundenkontoPage() {
  const profile = await getUserProfile()

  if (!profile) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Bitte melde dich an, um dein Stundenkonto zu sehen.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Try to find the person linked to this user
  const supabase = await createClient()
  const { data: person } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              href="/mein-bereich"
              className="text-blue-600 hover:text-blue-800"
            >
              &larr; Zurück
            </Link>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Dein Account ist noch nicht mit einem Mitgliederprofil verknüpft.
            </p>
          </div>
        </div>
      </main>
    )
  }

  const entries = await getStundenkontoForPerson(person.id)
  const saldo = await getStundensaldo(person.id)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/mein-bereich"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zur Übersicht
          </Link>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mein Stundenkonto</h1>
            <p className="text-gray-600 mt-1">
              Übersicht deiner geleisteten Helferstunden
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Aktueller Saldo</p>
            <p
              className={`text-3xl font-bold ${
                saldo >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {saldo >= 0 ? '+' : ''}
              {saldo.toFixed(1)}
            </p>
            <p className="text-sm text-gray-500">Stunden</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {entries.filter((e) => e.typ === 'helfereinsatz').length}
            </p>
            <p className="text-xs text-gray-500">Helfereinsätze</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {entries.filter((e) => e.typ === 'vereinsevent').length}
            </p>
            <p className="text-xs text-gray-500">Vereinsevents</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {entries
                .filter((e) => e.stunden > 0)
                .reduce((sum, e) => sum + e.stunden, 0)
                .toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">Stunden gutgeschrieben</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{entries.length}</p>
            <p className="text-xs text-gray-500">Einträge gesamt</p>
          </div>
        </div>

        {/* Table */}
        <StundenkontoTable entries={entries} />
      </div>
    </main>
  )
}
