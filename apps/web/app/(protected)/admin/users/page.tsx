import { getUser } from '@/lib/supabase/server'
import { getAllUsers } from '@/app/actions/profile'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui'
import { UsersTable } from '@/components/admin/UsersTable'

export const metadata = {
  title: 'Benutzerverwaltung',
  description: 'Verwalte Benutzer und Rollen',
}

interface PageProps {
  searchParams: Promise<{ search?: string }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''

  const user = await getUser()
  const users = await getAllUsers(search)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Benutzerverwaltung
        </h1>
        <p className="mt-1 text-neutral-600">
          Verwalte Benutzer und deren Rollen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Benutzer</CardTitle>
          <CardDescription>
            {users.length} Benutzer{' '}
            {search ? `gefunden für "${search}"` : 'registriert'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable
            users={users}
            currentUserId={user?.id || ''}
            initialSearch={search}
          />
        </CardContent>
      </Card>
    </div>
  )
}
