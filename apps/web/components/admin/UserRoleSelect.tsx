'use client'

import { useState, useTransition } from 'react'
import { updateUserRole } from '@/app/actions/profile'
import type { UserRole } from '@/lib/supabase/types'

interface UserRoleSelectProps {
  userId: string
  currentRole: UserRole
  disabled?: boolean
}

/**
 * Role options with German labels for UI display
 */
const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] =
  [
    { value: 'ADMIN', label: 'Administrator', description: 'Vollzugriff' },
    {
      value: 'VORSTAND',
      label: 'Vorstand',
      description: 'Alle operativen Module',
    },
    {
      value: 'MITGLIED_AKTIV',
      label: 'Aktives Mitglied',
      description: 'Anmeldungen, Stundenkonto',
    },
    {
      value: 'MITGLIED_PASSIV',
      label: 'Passives Mitglied',
      description: 'Nur Profil',
    },
    { value: 'HELFER', label: 'Helfer', description: 'Zugewiesene Einsätze' },
    { value: 'PARTNER', label: 'Partner', description: 'Partnerdaten' },
    { value: 'FREUNDE', label: 'Freunde', description: 'Nur lesen' },
  ]

export function UserRoleSelect({
  userId,
  currentRole,
  disabled,
}: UserRoleSelectProps) {
  const [role, setRole] = useState<UserRole>(currentRole)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole
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
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="text-xs text-neutral-500">Speichern...</span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
