import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getMeineKommendeVerfuegbarkeiten } from '@/lib/actions/verfuegbarkeiten'
import { VerfuegbarkeitListe } from '@/components/verfuegbarkeiten'

export default async function MeineVerfuegbarkeitPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Find the person linked to this user
  const { data: person } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Meine Verfügbarkeit
          </h1>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">
            Dein Profil ist noch nicht mit einem Mitgliederkonto verknüpft.
            Bitte wende dich an den Vorstand.
          </p>
        </div>
      </div>
    )
  }

  // Get all verfuegbarkeiten for this person
  const verfuegbarkeiten = await getMeineKommendeVerfuegbarkeiten()

  // Also get past entries for the complete list
  const { data: allVerfuegbarkeiten } = await supabase
    .from('verfuegbarkeiten')
    .select('id, mitglied_id, datum_von, datum_bis, zeitfenster_von, zeitfenster_bis, status, wiederholung, grund, notiz, created_at, updated_at')
    .eq('mitglied_id', person.id)
    .order('datum_von', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="mb-2 text-sm text-neutral-500">
            <Link href="/mein-bereich" className="hover:text-neutral-700">
              Mein Bereich
            </Link>
            <span className="mx-2">/</span>
            <span>Verfügbarkeit</span>
          </nav>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Meine Verfügbarkeit
          </h1>
          <p className="mt-1 text-neutral-600">
            Trage hier deine Abwesenheiten und eingeschränkten Zeiten ein, damit
            bei der Planung von Proben und Aufführungen darauf Rücksicht genommen
            werden kann.
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-medium text-blue-900">Wie funktioniert das?</h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>
            <strong>Nicht verfügbar</strong> - Du kannst an diesen Tagen nicht
            teilnehmen (z.B. Urlaub, Arbeit)
          </li>
          <li>
            <strong>Eingeschränkt</strong> - Du könntest notfalls teilnehmen,
            aber bevorzugst frei zu haben
          </li>
          <li>
            <strong>Verfügbar</strong> - Du bist verfügbar und kannst eingeplant
            werden
          </li>
        </ul>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-2xl font-bold text-red-600">
            {verfuegbarkeiten.filter((v) => v.status === 'nicht_verfuegbar').length}
          </div>
          <div className="text-sm text-neutral-600">Abwesenheiten eingetragen</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {verfuegbarkeiten.filter((v) => v.status === 'eingeschraenkt').length}
          </div>
          <div className="text-sm text-neutral-600">Eingeschränkte Zeiten</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-2xl font-bold text-neutral-600">
            {(allVerfuegbarkeiten?.length || 0) - verfuegbarkeiten.length}
          </div>
          <div className="text-sm text-neutral-600">Vergangene Einträge</div>
        </div>
      </div>

      {/* Main List */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <VerfuegbarkeitListe
          mitgliedId={person.id}
          verfuegbarkeiten={allVerfuegbarkeiten || []}
        />
      </div>
    </div>
  )
}
