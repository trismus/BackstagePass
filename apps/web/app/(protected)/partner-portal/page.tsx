import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export default async function PartnerPortalPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Try to find partner linked to this user's email
  const { data: partner } = await supabase
    .from('partner')
    .select('id, name, typ, kontakt_email')
    .eq('kontakt_email', profile?.email ?? '')
    .single()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Partner-Portal</h1>
          <p className="text-gray-600 mt-1">
            {partner
              ? `Willkommen, ${partner.name}!`
              : 'Ihr Zugang zu den TGW-Partnerinformationen'}
          </p>
        </div>

        {!partner && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Ihr Account ist noch nicht mit einer Partnerorganisation
              verknüpft. Bitte wenden Sie sich an die Theatergruppe Widen.
            </p>
          </div>
        )}

        {partner && (
          <>
            {/* Partner Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ihre Partnerdaten
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Organisation
                  </dt>
                  <dd className="text-gray-900">{partner.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Typ</dt>
                  <dd className="text-gray-900 capitalize">{partner.typ}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Kontakt-E-Mail
                  </dt>
                  <dd className="text-gray-900">{partner.kontakt_email}</dd>
                </div>
              </dl>
            </div>
          </>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={'/partner-portal/daten' as never}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Meine Daten</h3>
            <p className="text-gray-600 text-sm">
              Ihre Kontakt- und Organisationsdaten bearbeiten
            </p>
          </Link>

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
            href={'/partner-portal/kontakt' as never}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Kontakt</h3>
            <p className="text-gray-600 text-sm">
              Kontaktieren Sie die Theatergruppe Widen
            </p>
          </Link>
        </div>

        {/* Profile Link */}
        <div className="mt-8">
          <Link
            href="/profile"
            className="text-blue-600 hover:text-blue-800"
          >
            Ihr Benutzerprofil bearbeiten &rarr;
          </Link>
        </div>
      </div>
    </main>
  )
}
