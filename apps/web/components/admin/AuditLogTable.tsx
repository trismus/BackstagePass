'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface AuditLog {
  id: string
  user_email: string | null
  action: string
  details: Record<string, unknown>
  created_at: string
}

interface AuditLogTableProps {
  logs: AuditLog[]
  count: number
  initialFilters?: {
    action?: string
    startDate?: string
    endDate?: string
  }
}

const actionLabels: Record<string, string> = {
  'auth.login': 'Anmeldung',
  'auth.logout': 'Abmeldung',
  'auth.signup': 'Registrierung',
  'profile.updated': 'Profil aktualisiert',
  'role.assigned': 'Rolle zugewiesen',
  'role.removed': 'Rolle entfernt',
  'user.disabled': 'Benutzer deaktiviert',
  'user.enabled': 'Benutzer aktiviert',
}

const actionOptions = [
  { value: '', label: 'Alle Aktionen' },
  { value: 'auth.login', label: 'Anmeldung' },
  { value: 'auth.logout', label: 'Abmeldung' },
  { value: 'auth.signup', label: 'Registrierung' },
  { value: 'profile.updated', label: 'Profil aktualisiert' },
  { value: 'role.assigned', label: 'Rolle zugewiesen' },
  { value: 'user.disabled', label: 'Benutzer deaktiviert' },
  { value: 'user.enabled', label: 'Benutzer aktiviert' },
]

function getActionLabel(action: string): string {
  return actionLabels[action] || action
}

function formatDetails(details: Record<string, unknown>): string {
  if (!details || Object.keys(details).length === 0) return '-'

  const parts: string[] = []

  if (details.display_name) {
    parts.push(`Name: ${details.display_name}`)
  }
  if (details.old_role && details.new_role) {
    parts.push(`${details.old_role} → ${details.new_role}`)
  }
  if (details.target_email) {
    parts.push(`(${details.target_email})`)
  }

  return parts.length > 0 ? parts.join(' ') : JSON.stringify(details)
}

export function AuditLogTable({
  logs,
  count,
  initialFilters = {},
}: AuditLogTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [action, setAction] = useState(initialFilters.action || '')
  const [startDate, setStartDate] = useState(initialFilters.startDate || '')
  const [endDate, setEndDate] = useState(initialFilters.endDate || '')

  function handleFilter(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams()
      if (action) params.set('action', action)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      router.push(
        `/admin/audit${params.toString() ? `?${params.toString()}` : ''}` as never
      )
    })
  }

  function handleReset() {
    setAction('')
    setStartDate('')
    setEndDate('')
    router.push('/admin/audit' as never)
  }

  function handleExport() {
    // Create CSV content
    const headers = ['Zeitpunkt', 'Benutzer', 'Aktion', 'Details']
    const rows = logs.map((log) => [
      new Date(log.created_at).toLocaleString('de-DE'),
      log.user_email || '-',
      getActionLabel(log.action),
      formatDetails(log.details),
    ])

    const csv = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
    ].join('\n')

    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasFilters = action || startDate || endDate

  return (
    <div className="space-y-4">
      {/* Filters */}
      <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Aktion</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Von</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Bis</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending ? 'Filtern...' : 'Filtern'}
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800"
          >
            Zurücksetzen
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          CSV Export
        </button>
      </form>

      {/* Table */}
      {logs.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          Keine Aktivitäten gefunden.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                  Zeitpunkt
                </th>
                <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                  Benutzer
                </th>
                <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                  Aktion
                </th>
                <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 text-sm text-neutral-500">
                    {new Date(log.created_at).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 text-sm text-neutral-600">
                    {log.user_email || '-'}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-neutral-600">
                    {formatDetails(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Count */}
      <p className="text-sm text-neutral-500">
        Zeige {logs.length} von {count} Einträgen
      </p>
    </div>
  )
}
