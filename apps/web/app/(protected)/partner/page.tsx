import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { getPartner } from '@/lib/actions/partner'
import { PartnerForm } from '@/components/partner/PartnerForm'

export default async function PartnerPage() {
  const profile = await getUserProfile()

  // Only ADMIN can access this page
  if (!profile || profile.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const partner = await getPartner()
  const activePartner = partner.filter((p) => p.aktiv)
  const inactivePartner = partner.filter((p) => !p.aktiv)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Partner verwalten
          </h1>
          <p className="mt-1 text-gray-600">
            Externe Partnerorganisationen für Helfereinsätze verwalten
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Partner List */}
          <div className="lg:col-span-2">
            {/* Active Partners */}
            <div className="mb-6 overflow-hidden rounded-lg bg-white shadow">
              <div className="border-b bg-gray-50 px-4 py-3">
                <h2 className="font-medium text-gray-900">
                  Aktive Partner ({activePartner.length})
                </h2>
              </div>
              {activePartner.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {activePartner.map((p) => (
                    <div key={p.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {p.name}
                          </h3>
                          {p.kontakt_name && (
                            <p className="text-sm text-gray-600">
                              Kontakt: {p.kontakt_name}
                            </p>
                          )}
                          <div className="mt-1 flex gap-4 text-sm text-gray-500">
                            {p.kontakt_email && <span>{p.kontakt_email}</span>}
                            {p.kontakt_telefon && (
                              <span>{p.kontakt_telefon}</span>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/partner?edit=${p.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Bearbeiten
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Noch keine Partner vorhanden
                </div>
              )}
            </div>

            {/* Inactive Partners */}
            {inactivePartner.length > 0 && (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="border-b bg-gray-50 px-4 py-3">
                  <h2 className="font-medium text-gray-500">
                    Inaktive Partner ({inactivePartner.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {inactivePartner.map((p) => (
                    <div key={p.id} className="p-4 opacity-60">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-700">
                            {p.name}
                          </h3>
                        </div>
                        <Link
                          href={`/partner?edit=${p.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Reaktivieren
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* New Partner Form */}
          <div>
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-4 font-medium text-gray-900">Neuer Partner</h2>
              <PartnerForm mode="create" />
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/helfereinsaetze"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zu Helfereinsätze
          </Link>
        </div>
      </div>
    </main>
  )
}
