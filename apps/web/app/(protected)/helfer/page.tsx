import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagementRole } from '@/lib/navigation'

export default async function HelferDashboardPage() {
  const profile = await getUserProfile()
  const role = profile?.role ?? 'FREUNDE'

  // Only HELFER or Management can access this page
  if (role !== 'HELFER' && !isManagementRole(role)) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Helfer-Bereich
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Willkommen! Hier siehst du deine Einsätze und kannst dich für neue anmelden.
        </p>
      </div>

      {/* Next Shift Card */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-medium text-neutral-900">Nächster Einsatz</h2>
        <div className="mt-4">
          <p className="text-sm text-neutral-500">
            Du hast aktuell keine anstehenden Einsätze.
          </p>
          <a
            href="/helfer/einsaetze"
            className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Verfügbare Einsätze ansehen
          </a>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Meine Schichten</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">0</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Geleistete Stunden</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">0h</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Verfügbare Einsätze</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">0</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-medium text-neutral-900">Meine Schichten</h2>
        <div className="mt-4">
          <p className="text-sm text-neutral-500">
            Keine Schichten vorhanden. Melde dich für einen Einsatz an!
          </p>
        </div>
      </div>
    </div>
  )
}
