import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export default async function PartnerDatenPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Try to find partner linked to this user's email
  const { data: partner } = await supabase
    .from('partner')
    .select('*')
    .eq('kontakt_email', profile?.email ?? '')
    .single()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={'/partner-portal' as never}
            className="mb-2 inline-block text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Zurück zur Übersicht
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Meine Daten</h1>
          <p className="mt-1 text-gray-600">
            Ihre Organisations- und Kontaktdaten
          </p>
        </div>

        {!partner ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-yellow-800">
              Ihr Account ist noch nicht mit einer Partnerorganisation
              verknüpft. Bitte wenden Sie sich an die Theatergruppe Widen.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            {/* Organization Info */}
            <div className="border-b border-gray-200 p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Organisation
              </h2>
              <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-gray-900">{partner.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Typ</dt>
                  <dd className="capitalize text-gray-900">{partner.typ}</dd>
                </div>
                {partner.beschreibung && (
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Beschreibung
                    </dt>
                    <dd className="text-gray-900">{partner.beschreibung}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Contact Info */}
            <div className="border-b border-gray-200 p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Kontaktdaten
              </h2>
              <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {partner.kontakt_person && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Ansprechperson
                    </dt>
                    <dd className="text-gray-900">{partner.kontakt_person}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
                  <dd className="text-gray-900">{partner.kontakt_email}</dd>
                </div>
                {partner.kontakt_telefon && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Telefon
                    </dt>
                    <dd className="text-gray-900">{partner.kontakt_telefon}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Address */}
            {(partner.strasse || partner.plz || partner.ort) && (
              <div className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Adresse
                </h2>
                <address className="not-italic text-gray-900">
                  {partner.strasse && <div>{partner.strasse}</div>}
                  {(partner.plz || partner.ort) && (
                    <div>
                      {partner.plz} {partner.ort}
                    </div>
                  )}
                </address>
              </div>
            )}
          </div>
        )}

        {/* Edit Note */}
        {partner && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              Möchten Sie Ihre Daten aktualisieren? Bitte kontaktieren Sie uns
              über die{' '}
              <Link
                href={'/partner-portal/kontakt' as never}
                className="font-medium underline"
              >
                Kontaktseite
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
