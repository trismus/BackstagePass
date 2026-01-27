import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagementRole } from '@/lib/navigation'

export default async function VerfuegbareEinsaetzePage() {
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
          Verfügbare Einsätze
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Hier findest du alle Einsätze, für die du dich anmelden kannst.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
          <option value="all">Alle Einsätze</option>
          <option value="week">Diese Woche</option>
          <option value="month">Diesen Monat</option>
        </select>
      </div>

      {/* Available Events List */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="p-6 text-center">
          <p className="text-sm text-neutral-500">
            Aktuell sind keine Einsätze verfügbar.
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            Schau später wieder vorbei oder kontaktiere den Vorstand.
          </p>
        </div>
      </div>
    </div>
  )
}
