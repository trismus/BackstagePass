import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { isManagement } from '@/lib/supabase/permissions'
import {
  getStundenkontoForPerson,
  getStundensaldo,
} from '@/lib/actions/stundenkonto'
import { StundenkontoTable } from '@/components/mein-bereich/StundenkontoTable'
import { HelpButton } from '@/components/help'

export const metadata = {
  title: 'Stundenkonto | BackstagePass',
  description: 'Dein persönliches Stundenkonto',
}

export default async function VorstandStundenkontoPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login' as never)
  }

  if (!isManagement(profile.role)) {
    redirect('/dashboard' as never)
  }

  const supabase = await createClient()
  const { data: person } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück
          </Link>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">
            Dein Account ist noch nicht mit einem Mitgliederprofil verknüpft.
          </p>
        </div>
      </div>
    )
  }

  const entries = await getStundenkontoForPerson(person.id)
  const saldo = await getStundensaldo(person.id)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Mein Stundenkonto
            </h1>
            <HelpButton contextKey="stundenkonto" />
          </div>
          <p className="mt-1 text-gray-600">
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 text-center shadow">
          <p className="text-2xl font-bold text-blue-600">
            {entries.filter((e) => e.typ === 'helfereinsatz').length}
          </p>
          <p className="text-xs text-gray-500">Helfereinsätze</p>
        </div>
        <div className="rounded-lg bg-white p-4 text-center shadow">
          <p className="text-2xl font-bold text-purple-600">
            {entries.filter((e) => e.typ === 'vereinsevent').length}
          </p>
          <p className="text-xs text-gray-500">Vereinsevents</p>
        </div>
        <div className="rounded-lg bg-white p-4 text-center shadow">
          <p className="text-2xl font-bold text-green-600">
            {entries
              .filter((e) => e.stunden > 0)
              .reduce((sum, e) => sum + e.stunden, 0)
              .toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">Stunden gutgeschrieben</p>
        </div>
        <div className="rounded-lg bg-white p-4 text-center shadow">
          <p className="text-2xl font-bold text-gray-600">{entries.length}</p>
          <p className="text-xs text-gray-500">Einträge gesamt</p>
        </div>
      </div>

      {/* Table */}
      <StundenkontoTable entries={entries} />
    </div>
  )
}
