import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import { getAnmeldungenForPerson } from '@/lib/actions/anmeldungen'
import type { AnmeldungMitVeranstaltung, AnmeldungStatus, VeranstaltungTyp } from '@/lib/supabase/types'

export const metadata = {
  title: 'Meine Anmeldungen | BackstagePass',
  description: 'Deine Anmeldungen zu Veranstaltungen',
}

const STATUS_CONFIG: Record<AnmeldungStatus, { label: string; className: string }> = {
  angemeldet: { label: 'Angemeldet', className: 'bg-green-100 text-green-700' },
  warteliste: { label: 'Warteliste', className: 'bg-yellow-100 text-yellow-700' },
  teilgenommen: { label: 'Teilgenommen', className: 'bg-blue-100 text-blue-700' },
  abgemeldet: { label: 'Abgemeldet', className: 'bg-neutral-100 text-neutral-500' },
}

const TYP_LABELS: Record<VeranstaltungTyp, string> = {
  vereinsevent: 'Vereinsevent',
  probe: 'Probe',
  auffuehrung: 'Auffuehrung',
  sonstiges: 'Sonstiges',
  meeting: 'Meeting',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function AnmeldungCard({ anmeldung, isPast }: { anmeldung: AnmeldungMitVeranstaltung; isPast: boolean }) {
  const { veranstaltung } = anmeldung
  const statusConfig = STATUS_CONFIG[anmeldung.status]

  return (
    <Link
      href={`/veranstaltungen/${veranstaltung.id}` as never}
      className={`block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50 ${
        isPast ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-neutral-900">
            {veranstaltung.titel}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
            <span>{formatDate(veranstaltung.datum)}</span>
            {veranstaltung.ort && (
              <span>{veranstaltung.ort}</span>
            )}
            <span className="text-xs text-neutral-400">
              {TYP_LABELS[veranstaltung.typ]}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
        >
          {statusConfig.label}
        </span>
      </div>
    </Link>
  )
}

export default async function MeineAnmeldungenPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Find the person linked to this profile via email
  const supabase = await createClient()
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meine Anmeldungen</h1>
          <p className="mt-1 text-gray-600">
            Deine Anmeldungen zu Veranstaltungen
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-neutral-500">
          Dein Profil ist noch nicht mit einer Person verknuepft. Bitte wende dich an den Vorstand.
        </div>
      </div>
    )
  }

  const anmeldungen = await getAnmeldungenForPerson(person.id)

  const today = new Date().toISOString().split('T')[0]

  const upcoming = anmeldungen
    .filter((a) => a.veranstaltung.datum >= today)
    .sort((a, b) => a.veranstaltung.datum.localeCompare(b.veranstaltung.datum))

  const past = anmeldungen
    .filter((a) => a.veranstaltung.datum < today)
    .sort((a, b) => b.veranstaltung.datum.localeCompare(a.veranstaltung.datum))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meine Anmeldungen</h1>
        <p className="mt-1 text-gray-600">
          Deine Anmeldungen zu Veranstaltungen
        </p>
      </div>

      {anmeldungen.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-neutral-500">
          Du hast noch keine Anmeldungen.
          <div className="mt-3">
            <Link
              href="/veranstaltungen"
              className="text-sm font-medium text-primary-600 hover:text-primary-800"
            >
              Zu den Veranstaltungen &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-neutral-800">
                Anstehend ({upcoming.length})
              </h2>
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <AnmeldungCard key={a.id} anmeldung={a} isPast={false} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-neutral-800">
                Vergangen ({past.length})
              </h2>
              <div className="space-y-2">
                {past.map((a) => (
                  <AnmeldungCard key={a.id} anmeldung={a} isPast={true} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
