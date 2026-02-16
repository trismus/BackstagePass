import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { isManagement } from '@/lib/supabase/permissions'
import { getAuthenticatedHelferDashboard } from '@/lib/actions/helfer-dashboard'
import { HelferDashboardView } from '@/components/helfer-dashboard/HelferDashboardView'

type HelfereinsatzData = {
  id: string
  titel: string
  datum: string
  startzeit?: string | null
  endzeit?: string | null
  ort?: string | null
}

type LegacySchicht = {
  id: string
  status: string
  notiz: string | null
  helfereinsatz: HelfereinsatzData | null
}

export const metadata = {
  title: 'Meine Einsätze | BackstagePass',
  description: 'Übersicht deiner Helfer-Einsätze',
}

export default async function VorstandEinsaetzePage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login' as never)
  }

  if (!isManagement(profile.role)) {
    redirect('/dashboard' as never)
  }

  const supabase = await createClient()

  // Find person for this user
  const { data: person } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .eq('email', profile.email)
    .single()

  // Fetch both systems in parallel
  const [helferDashboardData, legacyResult] = await Promise.all([
    getAuthenticatedHelferDashboard(),
    person
      ? supabase
          .from('helferschichten')
          .select(
            `
            id,
            status,
            notiz,
            helfereinsatz:helfereinsaetze (
              id,
              titel,
              datum,
              startzeit,
              endzeit,
              ort
            )
          `
          )
          .eq('person_id', person.id)
          .order('helfereinsatz(datum)', { ascending: false })
      : Promise.resolve({ data: [] as LegacySchicht[] }),
  ])

  const legacySchichten = (legacyResult.data ?? []) as unknown as LegacySchicht[]

  const today = new Date().toISOString().split('T')[0]
  const upcomingLegacy = legacySchichten.filter(
    (s) => s.helfereinsatz && s.helfereinsatz.datum >= today
  )
  const pastLegacy = legacySchichten.filter(
    (s) => s.helfereinsatz && s.helfereinsatz.datum < today
  )

  const hasNewSystem = helferDashboardData && helferDashboardData.anmeldungen.length > 0
  const hasLegacySystem = legacySchichten.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Meine Einsätze</h1>
        <p className="mt-1 text-neutral-600">
          Übersicht aller deiner Helfer-Einsätze
        </p>
      </div>

      {/* New Helfer System (helfer_anmeldungen) */}
      {helferDashboardData && (
        <section>
          {hasLegacySystem && (
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
              Helferliste-Einsätze
            </h2>
          )}
          <HelferDashboardView data={helferDashboardData} showHeader={false} />
        </section>
      )}

      {/* Legacy System (helferschichten) */}
      {hasLegacySystem && (
        <section>
          {hasNewSystem && (
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
              Helfereinsätze (Legacy)
            </h2>
          )}

          {/* Upcoming Legacy Shifts */}
          <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">
              Anstehende Einsätze ({upcomingLegacy.length})
            </h3>
            {upcomingLegacy.length > 0 ? (
              <div className="space-y-4">
                {upcomingLegacy.map((schicht) => (
                  <div
                    key={schicht.id}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-900">
                          {schicht.helfereinsatz?.titel ?? 'Einsatz'}
                        </h4>
                        <p className="mt-1 text-sm text-neutral-600">
                          {schicht.helfereinsatz?.datum ?? ''}
                          {schicht.helfereinsatz?.startzeit &&
                            ` | ${schicht.helfereinsatz.startzeit}`}
                          {schicht.helfereinsatz?.endzeit &&
                            ` - ${schicht.helfereinsatz.endzeit}`}
                        </p>
                        {schicht.helfereinsatz?.ort && (
                          <p className="text-sm text-neutral-500">
                            {schicht.helfereinsatz.ort}
                          </p>
                        )}
                        {schicht.notiz && (
                          <p className="mt-2 text-sm italic text-neutral-500">
                            &quot;{schicht.notiz}&quot;
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          schicht.status === 'bestaetigt'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {schicht.status === 'bestaetigt'
                          ? 'Bestätigt'
                          : 'Angefragt'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500">Keine anstehenden Einsätze.</p>
            )}
          </div>

          {/* Past Legacy Shifts */}
          {pastLegacy.length > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-neutral-900">
                Vergangene Einsätze ({pastLegacy.length})
              </h3>
              <div className="space-y-3">
                {pastLegacy.slice(0, 10).map((schicht) => (
                  <div
                    key={schicht.id}
                    className="flex items-center justify-between border-b border-neutral-100 pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <span className="text-neutral-900">
                        {schicht.helfereinsatz?.titel ?? 'Einsatz'}
                      </span>
                      <span className="ml-2 text-neutral-500">
                        {schicht.helfereinsatz?.datum ?? ''}
                      </span>
                    </div>
                    <span className="text-neutral-500">
                      {schicht.status === 'bestaetigt'
                        ? 'Abgeschlossen'
                        : schicht.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {!hasNewSystem && !hasLegacySystem && (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-neutral-700">
            Noch keine Einsätze vorhanden
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Sobald du dich für einen Helfer-Einsatz anmeldest, siehst du hier
            deine Übersicht.
          </p>
        </div>
      )}
    </div>
  )
}
