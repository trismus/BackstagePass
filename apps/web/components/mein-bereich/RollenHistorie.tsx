import { USER_ROLE_LABELS, type UserRole } from '@/lib/supabase/types'
import type { RollenHistorieEintrag } from '@/lib/actions/historie'

interface RollenHistorieProps {
  historie: RollenHistorieEintrag[]
}

export function RollenHistorie({ historie }: RollenHistorieProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleLabel = (role: string | null) => {
    if (!role) return 'Unbekannt'
    return USER_ROLE_LABELS[role as UserRole] || role
  }

  if (historie.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-purple-100 bg-purple-50 px-4 py-3">
          <h3 className="font-medium text-purple-900">Rollen-Historie</h3>
        </div>
        <div className="p-4 text-center text-sm text-neutral-500">
          Keine Rollenänderungen vorhanden
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-purple-100 bg-purple-50 px-4 py-3">
        <h3 className="font-medium text-purple-900">Rollen-Historie</h3>
      </div>
      <div className="divide-y divide-neutral-100">
        {historie.map((eintrag) => (
          <div key={eintrag.id} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {getRoleLabel(eintrag.oldRole)}
              </span>
              <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                {getRoleLabel(eintrag.newRole)}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {formatDate(eintrag.changedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { RollenHistorieProps }
