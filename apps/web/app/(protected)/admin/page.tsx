import Link from 'next/link'
import { getAllUsers } from '@/app/actions/profile'
import { getAuditLogs } from '@/lib/audit'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Administrationsbereich',
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center`}>
            <span className="text-lg font-bold text-white">{value}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminDashboardPage() {
  const users = await getAllUsers()
  const { count: auditCount } = await getAuditLogs({ limit: 1 })

  const userCount = users.length
  const adminCount = users.filter((u) => u.role === 'ADMIN').length
  const editorCount = users.filter((u) => u.role === 'EDITOR').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Admin Dashboard</h1>
        <p className="mt-1 text-neutral-600">
          Übersicht der administrativen Funktionen
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/admin/users">
          <StatCard label="Benutzer" value={userCount} color="bg-blue-500" />
        </Link>
        <Link href="/admin/users">
          <StatCard label="Admins" value={adminCount} color="bg-purple-500" />
        </Link>
        <Link href="/admin/users">
          <StatCard label="Editoren" value={editorCount} color="bg-green-500" />
        </Link>
        <Link href="/admin/audit">
          <StatCard label="Audit-Einträge" value={auditCount || 0} color="bg-neutral-500" />
        </Link>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellzugriff</CardTitle>
          <CardDescription>Häufig verwendete Funktionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50"
            >
              <svg className="h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div>
                <p className="font-medium text-neutral-900">Benutzer verwalten</p>
                <p className="text-sm text-neutral-500">Rollen zuweisen</p>
              </div>
            </Link>
            <Link
              href="/admin/audit"
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50"
            >
              <svg className="h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="font-medium text-neutral-900">Audit Log</p>
                <p className="text-sm text-neutral-500">Aktivitäten prüfen</p>
              </div>
            </Link>
            <Link
              href="/partner"
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50"
            >
              <svg className="h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="font-medium text-neutral-900">Partner verwalten</p>
                <p className="text-sm text-neutral-500">Externe Partner</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Neueste Benutzer</CardTitle>
          <CardDescription>Zuletzt registrierte Benutzer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3">
                <div>
                  <p className="font-medium text-neutral-900">{user.display_name || user.email}</p>
                  <p className="text-sm text-neutral-500">{user.email}</p>
                </div>
                <span className="inline-flex rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link
              href="/admin/users"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Alle Benutzer anzeigen &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
