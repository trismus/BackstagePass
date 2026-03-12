'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { HelferEventVollDetails } from '@/lib/supabase/types'
import { RolleCard } from './RolleCard'
import { RolleForm } from './RolleForm'

// =============================================================================
// Types
// =============================================================================

interface HelferEventDetailProps {
  event: HelferEventVollDetails
  profiles: { id: string; display_name: string | null; email: string }[]
}

// =============================================================================
// Component
// =============================================================================

export function HelferEventDetail({ event, profiles }: HelferEventDetailProps) {
  const [showNewRolle, setShowNewRolle] = useState(false)

  const totalBenoetigt = event.rollen.reduce((s, r) => s + r.anzahl_benoetigt, 0)
  const totalBelegt = event.rollen.reduce((s, r) => s + r.angemeldet_count, 0)
  const fillPct = totalBenoetigt > 0
    ? Math.round((totalBelegt / totalBenoetigt) * 100)
    : 100

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const internRollen = event.rollen.filter((r) => r.sichtbarkeit === 'intern')
  const publicRollen = event.rollen.filter((r) => r.sichtbarkeit === 'public')

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {event.name}
            </h1>
            {event.veranstaltung && (
              <p className="mt-0.5 text-sm text-neutral-500">
                Veranstaltung: {event.veranstaltung.titel}
              </p>
            )}
            <p className="mt-2 text-sm text-neutral-600">
              {formatDate(event.datum_start)}
              {' \u00B7 '}
              {formatTime(event.datum_start)}
              {' \u2013 '}
              {formatTime(event.datum_end)}
              {event.ort && ` \u00B7 ${event.ort}`}
            </p>
            {event.beschreibung && (
              <p className="mt-2 text-sm text-neutral-500">
                {event.beschreibung}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{event.rollen.length}</p>
              <p className="text-xs text-neutral-500">Rollen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">
                {totalBelegt}/{totalBenoetigt}
              </p>
              <p className="text-xs text-neutral-500">Besetzt</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${
                fillPct >= 100
                  ? 'text-success-600'
                  : fillPct >= 50
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}>
                {fillPct}%
              </p>
              <p className="text-xs text-neutral-500">Auslastung</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full transition-all ${
                fillPct >= 100
                  ? 'bg-success-500'
                  : fillPct >= 50
                    ? 'bg-amber-400'
                    : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(100, fillPct)}%` }}
            />
          </div>
        </div>

        {/* Public link */}
        {event.public_token && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm">
            <span className="text-neutral-500">Öffentlicher Link:</span>
            <Link
              href={`/helfer/${event.public_token}` as never}
              target="_blank"
              className="text-primary-600 hover:text-primary-800"
            >
              /helfer/{event.public_token}
            </Link>
          </div>
        )}
      </div>

      {/* Rollen Header + Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          Rollen & Schichten
        </h2>
        <button
          onClick={() => setShowNewRolle(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          + Neue Rolle
        </button>
      </div>

      {/* New Rolle Form */}
      {showNewRolle && (
        <RolleForm
          eventId={event.id}
          onClose={() => setShowNewRolle(false)}
        />
      )}

      {/* Rollen grouped by visibility */}
      {event.rollen.length === 0 && !showNewRolle ? (
        <div className="rounded-lg bg-neutral-50 p-6 text-center">
          <p className="text-neutral-500">
            Noch keine Rollen definiert. Erstelle eine neue Rolle um loszulegen.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Intern */}
          {internRollen.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                  Intern (Vereinsmitglieder)
                </span>
                <span className="text-xs text-neutral-400">
                  {internRollen.length} Rolle{internRollen.length !== 1 ? 'n' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {internRollen.map((rolle) => (
                  <RolleCard
                    key={rolle.id}
                    rolle={rolle}
                    eventId={event.id}
                    profiles={profiles}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Public */}
          {publicRollen.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  Öffentlich (Mitmachen-Seite)
                </span>
                <span className="text-xs text-neutral-400">
                  {publicRollen.length} Rolle{publicRollen.length !== 1 ? 'n' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {publicRollen.map((rolle) => (
                  <RolleCard
                    key={rolle.id}
                    rolle={rolle}
                    eventId={event.id}
                    profiles={profiles}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
