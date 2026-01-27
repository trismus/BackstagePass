'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserRoleSelect } from './UserRoleSelect'
import { toggleUserActive } from '@/app/actions/profile'
import type { UserRole } from '@/lib/supabase/types'

interface Profile {
  id: string
  email: string
  display_name: string | null
  role: string
  is_active?: boolean
  created_at: string
}

interface UsersTableProps {
  users: Profile[]
  currentUserId: string
  initialSearch?: string
}

export function UsersTable({
  users,
  currentUserId,
  initialSearch = '',
}: UsersTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [isPending, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams()
      if (search.trim()) {
        params.set('search', search.trim())
      }
      router.push(
        `/admin/users${params.toString() ? `?${params.toString()}` : ''}` as never
      )
    })
  }

  async function handleToggleActive(userId: string) {
    const result = await toggleUserActive(userId)
    if (result.error) {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Name oder E-Mail suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending ? 'Suche...' : 'Suchen'}
        </button>
        {initialSearch && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              router.push('/admin/users' as never)
            }}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800"
          >
            Zurücksetzen
          </button>
        )}
      </form>

      {/* Table */}
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
                Status
              </th>
              <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                Registriert
              </th>
              <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((u) => (
              <tr
                key={u.id}
                className={u.is_active === false ? 'opacity-50' : ''}
              >
                <td className="py-3 text-sm text-neutral-900">
                  {u.display_name || '-'}
                </td>
                <td className="py-3 text-sm text-neutral-600">{u.email}</td>
                <td className="py-3">
                  <UserRoleSelect
                    userId={u.id}
                    currentRole={u.role as UserRole}
                    disabled={u.id === currentUserId}
                  />
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.is_active === false
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {u.is_active === false ? 'Deaktiviert' : 'Aktiv'}
                  </span>
                </td>
                <td className="py-3 text-sm text-neutral-500">
                  {new Date(u.created_at).toLocaleDateString('de-DE')}
                </td>
                <td className="py-3">
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className={`text-sm ${
                        u.is_active === false
                          ? 'text-green-600 hover:text-green-800'
                          : 'text-red-600 hover:text-red-800'
                      }`}
                    >
                      {u.is_active === false ? 'Aktivieren' : 'Deaktivieren'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-500">
                  Keine Benutzer gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
