import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagementRole } from '@/lib/navigation'

export default async function MeineSchichtenPage() {
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
          Meine Schichten
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Übersicht über alle deine zugewiesenen Schichten.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
          <option value="upcoming">Anstehend</option>
          <option value="past">Vergangen</option>
          <option value="all">Alle</option>
        </select>
      </div>

      {/* Shifts List */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="p-6 text-center">
          <p className="text-sm text-neutral-500">
            Du hast noch keine Schichten.
          </p>
          <a
            href="/helfer/einsaetze"
            className="mt-4 inline-block text-sm font-medium text-neutral-900 hover:underline"
          >
            Jetzt für Einsätze anmelden
          </a>
        </div>
      </div>
    </div>
  )
}
