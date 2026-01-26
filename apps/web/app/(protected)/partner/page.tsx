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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Partner verwalten</h1>
          <p className="text-gray-600 mt-1">
            Externe Partnerorganisationen für Helfereinsätze verwalten
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Partner List */}
          <div className="lg:col-span-2">
            {/* Active Partners */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h2 className="font-medium text-gray-900">
                  Aktive Partner ({activePartner.length})
                </h2>
              </div>
              {activePartner.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {activePartner.map((p) => (
                    <div key={p.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{p.name}</h3>
                          {p.kontakt_name && (
                            <p className="text-sm text-gray-600">
                              Kontakt: {p.kontakt_name}
                            </p>
                          )}
                          <div className="flex gap-4 mt-1 text-sm text-gray-500">
                            {p.kontakt_email && <span>{p.kontakt_email}</span>}
                            {p.kontakt_telefon && <span>{p.kontakt_telefon}</span>}
                          </div>
                        </div>
                        <Link
                          href={`/partner?edit=${p.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
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
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h2 className="font-medium text-gray-500">
                    Inaktive Partner ({inactivePartner.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {inactivePartner.map((p) => (
                    <div key={p.id} className="p-4 opacity-60">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-700">{p.name}</h3>
                        </div>
                        <Link
                          href={`/partner?edit=${p.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
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
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="font-medium text-gray-900 mb-4">Neuer Partner</h2>
              <PartnerForm mode="create" />
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/helfereinsaetze" className="text-blue-600 hover:text-blue-800">
            &larr; Zurück zu Helfereinsätze
          </Link>
        </div>
      </div>
    </main>
  )
}
