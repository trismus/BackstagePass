'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteHelferRolle,
  updateAnmeldungStatus,
  deleteAnmeldung,
} from '@/lib/actions/helferliste-management'
import { SichtbarkeitToggle } from './SichtbarkeitToggle'
import { RolleForm } from './RolleForm'
import { HelferZuweisenForm } from './HelferZuweisenForm'
import type {
  HelferRollenInstanz,
  HelferRollenTemplate,
  HelferAnmeldung,
  HelferAnmeldungStatus,
  Profile,
  ExterneHelferProfil,
} from '@/lib/supabase/types'

// =============================================================================
// Types
// =============================================================================

type RolleAnmeldung = HelferAnmeldung & {
  profile: Pick<Profile, 'id' | 'display_name' | 'email'> | null
  external_helper: Pick<ExterneHelferProfil, 'id' | 'vorname' | 'nachname' | 'email'> | null
}

type RolleData = HelferRollenInstanz & {
  template: Pick<HelferRollenTemplate, 'id' | 'name'> | null
  anmeldungen: RolleAnmeldung[]
  angemeldet_count: number
}

interface RolleCardProps {
  rolle: RolleData
  eventId: string
  profiles: { id: string; display_name: string | null; email: string }[]
}

// =============================================================================
// Status colors
// =============================================================================

const STATUS_COLORS: Record<HelferAnmeldungStatus, string> = {
  angemeldet: 'bg-blue-100 text-blue-700',
  bestaetigt: 'bg-success-100 text-success-700',
  abgelehnt: 'bg-red-100 text-red-700',
  warteliste: 'bg-amber-100 text-amber-700',
}

const STATUS_LABELS: Record<HelferAnmeldungStatus, string> = {
  angemeldet: 'Angemeldet',
  bestaetigt: 'Bestätigt',
  abgelehnt: 'Abgelehnt',
  warteliste: 'Warteliste',
}

// =============================================================================
// Component
// =============================================================================

export function RolleCard({ rolle, eventId, profiles }: RolleCardProps) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const rolleName = rolle.custom_name || rolle.template?.name || 'Unbenannte Rolle'
  const isFull = rolle.angemeldet_count >= rolle.anzahl_benoetigt
  const offen = Math.max(0, rolle.anzahl_benoetigt - rolle.angemeldet_count)

  const handleDelete = async () => {
    if (!confirm(`Rolle "${rolleName}" wirklich löschen?`)) return
    setDeleting(true)
    const result = await deleteHelferRolle(rolle.id)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Fehler beim Löschen')
    }
    setDeleting(false)
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (showEdit) {
    return (
      <RolleForm
        eventId={eventId}
        rolle={{
          id: rolle.id,
          custom_name: rolle.custom_name,
          anzahl_benoetigt: rolle.anzahl_benoetigt,
          zeitblock_start: rolle.zeitblock_start,
          zeitblock_end: rolle.zeitblock_end,
          sichtbarkeit: rolle.sichtbarkeit,
        }}
        onClose={() => setShowEdit(false)}
      />
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium text-neutral-900">{rolleName}</h4>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isFull
                  ? 'bg-success-100 text-success-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {rolle.angemeldet_count}/{rolle.anzahl_benoetigt}
            </span>
            <SichtbarkeitToggle
              rolleId={rolle.id}
              sichtbarkeit={rolle.sichtbarkeit}
            />
          </div>
          {(rolle.zeitblock_start || rolle.zeitblock_end) && (
            <p className="mt-0.5 text-xs text-neutral-500">
              {formatTime(rolle.zeitblock_start)}
              {rolle.zeitblock_start && rolle.zeitblock_end && ' \u2013 '}
              {formatTime(rolle.zeitblock_end)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {!isFull && (
            <button
              onClick={() => setShowAssign(true)}
              className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              + Zuweisen
            </button>
          )}
          <button
            onClick={() => setShowEdit(true)}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            title="Bearbeiten"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
            title="Löschen"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Anmeldungen */}
      {rolle.anmeldungen.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {rolle.anmeldungen.map((anmeldung) => (
            <AnmeldungRow key={anmeldung.id} anmeldung={anmeldung} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {rolle.anmeldungen.length === 0 && (
        <p className="mt-3 text-xs text-neutral-400">
          Noch keine Anmeldungen
        </p>
      )}

      {/* Offen badge */}
      {offen > 0 && (
        <p className="mt-2 text-xs text-amber-600">
          {offen} Platz/Plätze offen
        </p>
      )}

      {/* Assign form */}
      {showAssign && (
        <div className="mt-3">
          <HelferZuweisenForm
            rolleId={rolle.id}
            profiles={profiles}
            onClose={() => setShowAssign(false)}
          />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Anmeldung Row
// =============================================================================

function AnmeldungRow({ anmeldung }: { anmeldung: RolleAnmeldung }) {
  const router = useRouter()
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  const name = anmeldung.profile
    ? anmeldung.profile.display_name || anmeldung.profile.email
    : anmeldung.external_helper
      ? `${anmeldung.external_helper.vorname} ${anmeldung.external_helper.nachname}`
      : anmeldung.external_name || 'Unbekannt'

  const isExternal = !anmeldung.profile

  const handleStatusChange = async (newStatus: HelferAnmeldungStatus) => {
    setLoading(true)
    const result = await updateAnmeldungStatus(anmeldung.id, newStatus)
    if (result.success) {
      router.refresh()
    }
    setShowStatusMenu(false)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Anmeldung von "${name}" wirklich entfernen?`)) return
    setLoading(true)
    await deleteAnmeldung(anmeldung.id)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-600">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="text-neutral-800">{name}</span>
        {isExternal && (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
            Extern
          </span>
        )}

        {/* Status badge - clickable */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={loading}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[anmeldung.status]}`}
          >
            {loading ? '...' : STATUS_LABELS[anmeldung.status]}
          </button>

          {showStatusMenu && (
            <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
              {(Object.keys(STATUS_LABELS) as HelferAnmeldungStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`block w-full px-3 py-1 text-left text-xs hover:bg-neutral-50 ${
                    status === anmeldung.status
                      ? 'font-medium text-primary-600'
                      : 'text-neutral-700'
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-neutral-400 hover:text-red-500"
        title="Anmeldung entfernen"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
