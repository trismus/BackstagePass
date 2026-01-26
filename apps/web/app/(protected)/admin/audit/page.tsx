import { getAuditLogs } from '@/lib/audit'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'

export const metadata = {
  title: 'Audit Log',
  description: 'Aktivitätsprotokoll anzeigen',
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

export default async function AuditLogPage() {
  const { data: logs, count } = await getAuditLogs({ limit: 100 })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Audit Log</h1>
        <p className="mt-1 text-neutral-600">
          Aktivitätsprotokoll aller wichtigen Aktionen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktivitäten</CardTitle>
          <CardDescription>
            {count} Einträge insgesamt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-neutral-500">Noch keine Aktivitäten vorhanden.</p>
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
        </CardContent>
      </Card>
    </div>
  )
}
