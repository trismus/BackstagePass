'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAnmeldungStatus, abmelden } from '@/lib/actions/helferliste'
import type {
  HelferAnmeldung,
  HelferAnmeldungStatus,
  Profile,
} from '@/lib/supabase/types'
import { StatusBadge } from './StatusBadge'

type AnmeldungMitProfile = HelferAnmeldung & {
  profile: Pick<Profile, 'id' | 'display_name' | 'email'> | null
}

interface AnmeldungenListeProps {
  anmeldungen: AnmeldungMitProfile[]
  canManage: boolean
}

export function AnmeldungenListe({
  anmeldungen,
  canManage,
}: AnmeldungenListeProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleStatusChange = async (
    id: string,
    status: HelferAnmeldungStatus
  ) => {
    setLoadingId(id)
    const result = await updateAnmeldungStatus(id, status)
    if (!result.success) {
      alert(result.error || 'Fehler beim Aktualisieren')
    }
    router.refresh()
    setLoadingId(null)
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Anmeldung wirklich entfernen?')) return
    setLoadingId(id)
    const result = await abmelden(id)
    if (!result.success) {
      alert(result.error || 'Fehler beim Entfernen')
    }
    router.refresh()
    setLoadingId(null)
  }

  const getName = (a: AnmeldungMitProfile) => {
    if (a.profile) {
      return a.profile.display_name || a.profile.email
    }
    return a.external_name || 'Unbekannt'
  }

  const getContact = (a: AnmeldungMitProfile) => {
    if (a.profile) {
      return a.profile.email
    }
    return a.external_email || a.external_telefon || null
  }

  return (
    <div className="space-y-2">
      {anmeldungen.map((a) => (
        <div
          key={a.id}
          className={`flex items-center justify-between rounded px-3 py-2 ${
            loadingId === a.id ? 'opacity-50' : ''
          } ${a.status === 'abgelehnt' ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                a.profile
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {getName(a).charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${a.status === 'abgelehnt' ? 'line-through' : ''}`}
                >
                  {getName(a)}
                </span>
                {!a.profile && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                    Extern
                  </span>
                )}
              </div>
              {canManage && getContact(a) && (
                <p className="text-xs text-gray-500">{getContact(a)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={a.status} />

            {canManage && (
              <div className="ml-2 flex items-center gap-1">
                {a.status === 'angemeldet' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(a.id, 'bestaetigt')}
                      disabled={loadingId === a.id}
                      className="rounded p-1 text-success-600 hover:bg-success-50"
                      title="Bestätigen"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleStatusChange(a.id, 'abgelehnt')}
                      disabled={loadingId === a.id}
                      className="rounded p-1 text-error-600 hover:bg-error-50"
                      title="Ablehnen"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </>
                )}
                {a.status === 'warteliste' && (
                  <button
                    onClick={() => handleStatusChange(a.id, 'bestaetigt')}
                    disabled={loadingId === a.id}
                    className="rounded p-1 text-success-600 hover:bg-success-50"
                    title="Nachrücken lassen"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleRemove(a.id)}
                  disabled={loadingId === a.id}
                  className="rounded p-1 text-gray-400 hover:bg-error-50 hover:text-error-600"
                  title="Entfernen"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {anmeldungen.length === 0 && (
        <p className="py-2 text-center text-sm text-gray-500">
          Noch keine Anmeldungen
        </p>
      )}
    </div>
  )
}
