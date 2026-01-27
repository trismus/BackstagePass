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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Partner-Portal</h1>
        <p className="mt-1 text-neutral-600">
          {partner
            ? `Willkommen, ${partner.name}!`
            : 'Ihr Zugang zu den TGW-Partnerinformationen'}
        </p>
      </div>

      {!partner && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">
            Ihr Account ist noch nicht mit einer Partnerorganisation
            verknüpft. Bitte wenden Sie sich an die Theatergruppe Widen.
          </p>
        </div>
      )}

      {partner && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Ihre Partnerdaten
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-neutral-500">
                Organisation
              </dt>
              <dd className="text-neutral-900">{partner.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500">Typ</dt>
              <dd className="capitalize text-neutral-900">{partner.typ}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500">
                Kontakt-E-Mail
              </dt>
              <dd className="text-neutral-900">{partner.kontakt_email}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={'/partner-portal/daten' as never}
          className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
        >
          <h3 className="mb-2 font-semibold text-neutral-900">Meine Daten</h3>
          <p className="text-sm text-neutral-600">
            Ihre Kontakt- und Organisationsdaten bearbeiten
          </p>
        </Link>

        <Link
          href="/veranstaltungen"
          className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
        >
          <h3 className="mb-2 font-semibold text-neutral-900">
            Veranstaltungen
          </h3>
          <p className="text-sm text-neutral-600">
            Aktuelle und kommende Veranstaltungen der TGW
          </p>
        </Link>

        <Link
          href={'/partner-portal/kontakt' as never}
          className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
        >
          <h3 className="mb-2 font-semibold text-neutral-900">Kontakt</h3>
          <p className="text-sm text-neutral-600">
            Kontaktieren Sie die Theatergruppe Widen
          </p>
        </Link>
      </div>

      {/* Profile Link */}
      <div>
        <Link href="/profile" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          Ihr Benutzerprofil bearbeiten &rarr;
        </Link>
      </div>
    </div>
  )
}
