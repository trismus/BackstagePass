import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagementRole } from '@/lib/navigation'

export default async function PartnerPortalPage() {
  const profile = await getUserProfile()
  const role = profile?.role ?? 'FREUNDE'

  // Only PARTNER or Management can access this page
  if (role !== 'PARTNER' && !isManagementRole(role)) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Partner-Portal
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Willkommen im Partner-Portal der Theatergruppe Widen.
        </p>
      </div>

      {/* Partner Info Card */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-medium text-neutral-900">Ihre Partnerdaten</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-neutral-500">Organisation</p>
            <p className="text-neutral-900">—</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Kontaktperson</p>
            <p className="text-neutral-900">{profile?.display_name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">E-Mail</p>
            <p className="text-neutral-900">{profile?.email || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Status</p>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Aktiv
            </span>
          </div>
        </div>
        <div className="mt-6">
          <a
            href="/partner-portal/daten"
            className="text-sm font-medium text-neutral-900 hover:underline"
          >
            Daten bearbeiten →
          </a>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-medium text-neutral-900">Aktuelle Veranstaltungen</h2>
        <div className="mt-4">
          <p className="text-sm text-neutral-500">
            Keine aktuellen Veranstaltungen mit Ihrer Beteiligung.
          </p>
          <a
            href="/veranstaltungen"
            className="mt-4 inline-block text-sm font-medium text-neutral-900 hover:underline"
          >
            Alle Veranstaltungen ansehen →
          </a>
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-medium text-neutral-900">Kontakt</h2>
        <div className="mt-4">
          <p className="text-sm text-neutral-500">
            Bei Fragen wenden Sie sich bitte an:
          </p>
          <div className="mt-3">
            <p className="font-medium text-neutral-900">Theatergruppe Widen</p>
            <p className="text-sm text-neutral-500">vorstand@tgwiden.ch</p>
          </div>
        </div>
      </div>
    </div>
  )
}
