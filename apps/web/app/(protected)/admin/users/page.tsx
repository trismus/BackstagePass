import { getUser } from '@/lib/supabase/server'
import { getAllUsers } from '@/app/actions/profile'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { UserRoleSelect } from '@/components/admin/UserRoleSelect'

export const metadata = {
  title: 'Benutzerverwaltung',
  description: 'Verwalte Benutzer und Rollen',
}

export default async function AdminUsersPage() {
  const user = await getUser()
  const users = await getAllUsers()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Benutzerverwaltung</h1>
        <p className="mt-1 text-neutral-600">
          Verwalte Benutzer und deren Rollen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Benutzer</CardTitle>
          <CardDescription>
            {users.length} Benutzer registriert
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                    Name
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                    E-Mail
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                    Rolle
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                    Registriert
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 text-sm text-neutral-900">
                      {u.display_name || '-'}
                    </td>
                    <td className="py-3 text-sm text-neutral-600">{u.email}</td>
                    <td className="py-3">
                      <UserRoleSelect
                        userId={u.id}
                        currentRole={u.role}
                        disabled={u.id === user?.id}
                      />
                    </td>
                    <td className="py-3 text-sm text-neutral-500">
                      {new Date(u.created_at).toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
