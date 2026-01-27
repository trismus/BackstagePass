import { getAuditLogs } from '@/lib/audit'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { AuditLogTable } from '@/components/admin/AuditLogTable'

export const metadata = {
  title: 'Audit Log',
  description: 'Aktivitätsprotokoll anzeigen',
}

interface PageProps {
  searchParams: Promise<{
    action?: string
    startDate?: string
    endDate?: string
  }>
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const params = await searchParams

  const { data: logs, count } = await getAuditLogs({
    action: params.action,
    startDate: params.startDate,
    endDate: params.endDate,
    limit: 100,
  })

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
          <AuditLogTable
            logs={logs}
            count={count}
            initialFilters={{
              action: params.action,
              startDate: params.startDate,
              endDate: params.endDate,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
