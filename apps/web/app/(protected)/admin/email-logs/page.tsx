import { getEmailLogs } from '@/lib/actions/email-logs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import type { EmailLogStatus } from '@/lib/supabase/types'
import { EMAIL_TEMPLATE_TYP_LABELS } from '@/lib/supabase/types'
import type { EmailTemplateTyp } from '@/lib/supabase/types'

export const metadata = {
  title: 'E-Mail Logs',
  description: 'Übersicht über alle versendeten E-Mails',
}

const STATUS_CONFIG: Record<EmailLogStatus, { label: string; classes: string }> = {
  sent: {
    label: 'Gesendet',
    classes: 'bg-success-50 text-success-700 border border-success-200',
  },
  failed: {
    label: 'Fehlgeschlagen',
    classes: 'bg-error-50 text-error-700 border border-error-200',
  },
  pending: {
    label: 'Ausstehend',
    classes: 'bg-warning-50 text-warning-700 border border-warning-200',
  },
  retrying: {
    label: 'Wiederholung',
    classes: 'bg-orange-50 text-orange-700 border border-orange-200',
  },
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTemplateTypLabel(typ: string): string {
  if (typ in EMAIL_TEMPLATE_TYP_LABELS) {
    return EMAIL_TEMPLATE_TYP_LABELS[typ as EmailTemplateTyp]
  }
  return typ
}

export default async function EmailLogsPage() {
  const logs = await getEmailLogs()

  const sentCount = logs.filter((l) => l.status === 'sent').length
  const failedCount = logs.filter((l) => l.status === 'failed').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          E-Mail Logs
        </h1>
        <p className="mt-1 text-neutral-600">
          Übersicht der letzten 100 versendeten E-Mails
        </p>
      </div>

      <Card padding="none">
        <CardHeader className="px-6 pt-6">
          <CardTitle>Versandprotokoll</CardTitle>
          <CardDescription>
            {sentCount} gesendet, {failedCount} fehlgeschlagen — {logs.length} Einträge total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center text-neutral-500">
              Keine E-Mail-Logs vorhanden.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    <th className="px-6 py-3">Datum/Zeit</th>
                    <th className="px-6 py-3">Empfänger</th>
                    <th className="px-6 py-3">Template-Typ</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Fehlermeldung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {logs.map((log) => {
                    const statusConfig = STATUS_CONFIG[log.status]
                    return (
                      <tr key={log.id} className="hover:bg-neutral-50">
                        <td className="whitespace-nowrap px-6 py-3 text-neutral-700">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-6 py-3 text-neutral-900">
                          <div>{log.recipient_email}</div>
                          {log.recipient_name && (
                            <div className="text-xs text-neutral-500">{log.recipient_name}</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-neutral-700">
                          {getTemplateTypLabel(log.template_typ)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.classes}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-6 py-3 text-neutral-500">
                          {log.error_message ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
