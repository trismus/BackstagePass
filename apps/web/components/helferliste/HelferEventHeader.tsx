'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteHelferEvent } from '@/lib/actions/helferliste'
import type { HelferEvent } from '@/lib/supabase/types'

interface HelferEventHeaderProps {
  event: HelferEvent & { veranstaltung: { id: string; titel: string } | null }
  canManage: boolean
  totalBenoetigt: number
  totalAngemeldet: number
}

export function HelferEventHeader({
  event,
  canManage,
  totalBenoetigt,
  totalAngemeldet,
}: HelferEventHeaderProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteHelferEvent(event.id)
    if (result.success) {
      router.push('/helferliste' as never)
    } else {
      alert(result.error || 'Fehler beim Löschen')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const fillRate =
    totalBenoetigt > 0
      ? Math.round((totalAngemeldet / totalBenoetigt) * 100)
      : 0

  return (
    <div className="mt-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  event.typ === 'auffuehrung'
                    ? 'bg-curtain-100 text-curtain-700'
                    : 'bg-stage-100 text-stage-700'
                }`}
              >
                {event.typ === 'auffuehrung' ? 'Aufführung' : 'Helfereinsatz'}
              </span>
            </div>

            {event.beschreibung && (
              <p className="mt-2 text-gray-600">{event.beschreibung}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{formatDateTime(event.datum_start)}</span>
              </div>
              {event.ort && (
                <div className="flex items-center gap-1">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{event.ort}</span>
                </div>
              )}
              {event.veranstaltung && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Veranstaltung:</span>
                  <Link
                    href={`/veranstaltungen/${event.veranstaltung.id}` as never}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    {event.veranstaltung.titel}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Progress and Actions */}
          <div className="flex flex-col items-end gap-4">
            {/* Fill Rate */}
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {fillRate}%
              </div>
              <div className="text-sm text-gray-500">
                {totalAngemeldet} / {totalBenoetigt} Helfer
              </div>
              <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    fillRate >= 100
                      ? 'bg-success-500'
                      : fillRate >= 50
                        ? 'bg-warning-500'
                        : 'bg-error-500'
                  }`}
                  style={{ width: `${Math.min(100, fillRate)}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            {canManage && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/helferliste/${event.id}/bearbeiten` as never}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Bearbeiten
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="hover:text-error-800 border-error-300 rounded-lg border px-3 py-1.5 text-sm text-error-600"
                >
                  Löschen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Event löschen?
            </h3>
            <p className="mt-2 text-gray-600">
              Möchten Sie &quot;{event.name}&quot; wirklich löschen? Alle Rollen
              und Anmeldungen werden ebenfalls gelöscht.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isDeleting}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-error-600 px-4 py-2 text-white hover:bg-error-700 disabled:opacity-50"
              >
                {isDeleting ? 'Löschen...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
