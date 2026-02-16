'use client'

import { useState } from 'react'
import { inviteExistingPerson } from '@/lib/actions/personen'
import { Alert } from '@/components/ui/Alert'
import type { Rolle, UserRole } from '@/lib/supabase/types'

const appRollenOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'MITGLIED_PASSIV', label: 'Passives Mitglied', description: 'Nur eigenes Profil' },
  { value: 'MITGLIED_AKTIV', label: 'Aktives Mitglied', description: 'Anmeldungen, Stundenkonto' },
  { value: 'VORSTAND', label: 'Vorstand', description: 'Alle operativen Module' },
  { value: 'ADMIN', label: 'Administrator', description: 'Vollzugriff inkl. System' },
]

function getDefaultAppRole(rolle: Rolle): UserRole {
  switch (rolle) {
    case 'vorstand':
      return 'VORSTAND'
    case 'mitglied':
    case 'regie':
    case 'technik':
      return 'MITGLIED_AKTIV'
    case 'gast':
      return 'MITGLIED_PASSIV'
    default:
      return 'MITGLIED_AKTIV'
  }
}

interface InviteButtonProps {
  personId: string
  personRolle: Rolle
  personEmail: string
}

export function InviteButton({ personId, personRolle, personEmail }: InviteButtonProps) {
  const [appRole, setAppRole] = useState<UserRole>(getDefaultAppRole(personRolle))
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleInvite() {
    setStatus('loading')
    setErrorMessage('')

    const result = await inviteExistingPerson(personId, appRole)

    if (result.success) {
      setStatus('success')
    } else {
      setStatus('error')
      setErrorMessage(result.error || 'Unbekannter Fehler')
    }
  }

  if (status === 'success') {
    return (
      <Alert variant="success">
        Einladung wurde an <strong>{personEmail}</strong> gesendet.
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <Alert variant="info">
        <div className="space-y-3">
          <p>
            Dieses Mitglied hat noch keinen App-Zugang. Eine Einladung wird an{' '}
            <strong>{personEmail}</strong> gesendet.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="app-rolle" className="mb-1 block text-xs font-medium">
                App-Rolle
              </label>
              <select
                id="app-rolle"
                value={appRole}
                onChange={(e) => setAppRole(e.target.value as UserRole)}
                className="rounded border border-info-300 bg-white px-2 py-1 text-sm text-gray-900"
                disabled={status === 'loading'}
              >
                {appRollenOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleInvite}
              disabled={status === 'loading'}
              className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'loading' ? 'Wird gesendet...' : 'Einladen'}
            </button>
          </div>
        </div>
      </Alert>
      {status === 'error' && (
        <Alert variant="error">{errorMessage}</Alert>
      )}
    </div>
  )
}
