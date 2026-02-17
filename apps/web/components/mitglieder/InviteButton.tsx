'use client'

import { useState } from 'react'
import { inviteExistingPerson, resendInvitation, getDefaultAppRole } from '@/lib/actions/personen'
import { Alert } from '@/components/ui/Alert'
import type { Rolle, UserRole } from '@/lib/supabase/types'

const RESEND_COOLDOWN_DAYS = 7

const appRollenOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'MITGLIED_PASSIV', label: 'Passives Mitglied', description: 'Nur eigenes Profil' },
  { value: 'MITGLIED_AKTIV', label: 'Aktives Mitglied', description: 'Anmeldungen, Stundenkonto' },
  { value: 'VORSTAND', label: 'Vorstand', description: 'Alle operativen Module' },
  { value: 'ADMIN', label: 'Administrator', description: 'Vollzugriff inkl. System' },
]

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
}

interface InviteButtonProps {
  personId: string
  personRolle: Rolle
  personEmail: string
  invitedAt?: string | null
  invitationAcceptedAt?: string | null
}

export function InviteButton({
  personId,
  personRolle,
  personEmail,
  invitedAt,
  invitationAcceptedAt,
}: InviteButtonProps) {
  const [appRole, setAppRole] = useState<UserRole>(getDefaultAppRole(personRolle))
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const isResendMode = !!invitedAt && !invitationAcceptedAt

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

  async function handleResend() {
    setStatus('loading')
    setErrorMessage('')

    const result = await resendInvitation(personId)

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

  // Resend mode
  if (isResendMode) {
    const days = daysSince(invitedAt!)
    const canResend = days >= RESEND_COOLDOWN_DAYS
    const remaining = RESEND_COOLDOWN_DAYS - days

    return (
      <div className="space-y-3">
        <Alert variant="warning">
          <div className="space-y-3">
            {canResend ? (
              <>
                <p>
                  Einladung an <strong>{personEmail}</strong> wurde vor {days} Tagen
                  gesendet und noch nicht angenommen.
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={status === 'loading'}
                  className="rounded bg-yellow-600 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                >
                  {status === 'loading' ? 'Wird gesendet...' : 'Erneut einladen'}
                </button>
              </>
            ) : (
              <p>
                Einladung an <strong>{personEmail}</strong> wurde vor {days} Tag{days !== 1 ? 'en' : ''} gesendet.
                Erneutes Senden in {remaining} Tag{remaining !== 1 ? 'en' : ''} möglich.
              </p>
            )}
          </div>
        </Alert>
        {status === 'error' && (
          <Alert variant="error">{errorMessage}</Alert>
        )}
      </div>
    )
  }

  // First invite mode
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
