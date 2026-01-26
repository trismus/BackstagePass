'use client'

import { useState, useTransition } from 'react'
import { updateUserRole } from '@/app/actions/profile'

interface UserRoleSelectProps {
  userId: string
  currentRole: string
  disabled?: boolean
}

export function UserRoleSelect({ userId, currentRole, disabled }: UserRoleSelectProps) {
  const [role, setRole] = useState(currentRole)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER'
    setError(null)

    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)

      if (result.error) {
        setError(result.error)
        setRole(currentRole) // Revert on error
      } else {
        setRole(newRole)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={handleChange}
        disabled={disabled || isPending}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:bg-neutral-100"
      >
        <option value="ADMIN">Admin</option>
        <option value="EDITOR">Editor</option>
        <option value="VIEWER">Viewer</option>
      </select>
      {isPending && (
        <span className="text-xs text-neutral-500">Speichern...</span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
