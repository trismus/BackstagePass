'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  assignPersonToSchicht,
  removeAssignment,
} from '@/lib/actions/mitmachen-dashboard'
import type {
  MitmachenDashboardData,
  DashboardVeranstaltung,
  DashboardSchichtDetail,
} from '@/lib/actions/mitmachen-dashboard'

// =============================================================================
// Main Component
// =============================================================================

interface MitmachenDashboardProps {
  data: MitmachenDashboardData
}

export function MitmachenDashboard({ data }: MitmachenDashboardProps) {
  const { veranstaltungen, personen, summary } = data
  const [expandedEvent, setExpandedEvent] = useState<string | null>(
    veranstaltungen[0]?.id || null
  )

  if (veranstaltungen.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <MitmachenIcon />
          <h2 className="text-lg font-semibold text-neutral-900">
            Mitmachen-Seite &mdash; Status
          </h2>
        </div>
        <div className="rounded-lg bg-neutral-50 p-6 text-center">
          <p className="text-neutral-500">
            Keine anstehenden Veranstaltungen mit Helferbedarf
          </p>
          <Link
            href="/auffuehrungen"
            className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            Aufführungen verwalten &rarr;
          </Link>
        </div>
      </div>
    )
  }

  const fillPercentage =
    summary.total_benoetigt > 0
      ? Math.round((summary.total_belegt / summary.total_benoetigt) * 100)
      : 0

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <MitmachenIcon />
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Mitmachen-Seite &mdash; Status
            </h2>
            <p className="text-sm text-neutral-500">
              Übersicht über alle Helfer-Positionen
            </p>
          </div>
        </div>
        <Link
          href="/mitmachen"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Seite anzeigen
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 px-6 py-4 sm:grid-cols-4">
        <SummaryStat label="Veranstaltungen" value={summary.total_events} />
        <SummaryStat
          label="Besetzung"
          value={`${summary.total_belegt}/${summary.total_benoetigt}`}
          badge={`${fillPercentage}%`}
          badgeColor={
            fillPercentage >= 80
              ? 'green'
              : fillPercentage >= 50
                ? 'amber'
                : 'red'
          }
        />
        <SummaryStat
          label="Intern offen"
          value={summary.intern_offen}
          badgeColor={summary.intern_offen > 0 ? 'amber' : 'green'}
        />
        <SummaryStat
          label="Öffentlich offen"
          value={summary.public_offen}
          badgeColor={summary.public_offen > 0 ? 'blue' : 'green'}
        />
      </div>

      {/* Event List */}
      <div className="divide-y divide-neutral-100">
        {veranstaltungen.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            personen={personen}
            isExpanded={expandedEvent === event.id}
            onToggle={() =>
              setExpandedEvent(expandedEvent === event.id ? null : event.id)
            }
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Summary Stat
// =============================================================================

function SummaryStat({
  label,
  value,
  badge,
  badgeColor,
}: {
  label: string
  value: number | string
  badge?: string
  badgeColor?: 'green' | 'amber' | 'red' | 'blue'
}) {
  const colorMap = {
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  }

  return (
    <div>
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold text-neutral-900">{value}</span>
        {badge && badgeColor && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Event Row
// =============================================================================

function EventRow({
  event,
  personen,
  isExpanded,
  onToggle,
}: {
  event: DashboardVeranstaltung
  personen: { id: string; vorname: string; nachname: string }[]
  isExpanded: boolean
  onToggle: () => void
}) {
  const statusColors: Record<string, string> = {
    entwurf: 'bg-neutral-100 text-neutral-700',
    veroeffentlicht: 'bg-green-100 text-green-700',
    abgeschlossen: 'bg-blue-100 text-blue-700',
  }
  const statusLabels: Record<string, string> = {
    entwurf: 'Entwurf',
    veroeffentlicht: 'Veröffentlicht',
    abgeschlossen: 'Abgeschlossen',
  }

  const fillPct =
    event.total_benoetigt > 0
      ? Math.round((event.total_belegt / event.total_benoetigt) * 100)
      : 0

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })

  return (
    <div>
      {/* Event header - clickable */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-neutral-50"
      >
        {/* Expand icon */}
        <svg
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>

        {/* Event info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-neutral-900">
              {event.titel}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[event.helfer_status] || ''}`}
            >
              {statusLabels[event.helfer_status] || event.helfer_status}
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            {formatDate(event.datum)}
            {event.startzeit && ` · ${event.startzeit.slice(0, 5)}`}
            {event.ort && ` · ${event.ort}`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="hidden w-32 shrink-0 sm:block">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              {event.total_belegt}/{event.total_benoetigt}
            </span>
            <span>{fillPct}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full transition-all ${
                fillPct >= 80
                  ? 'bg-green-500'
                  : fillPct >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(100, fillPct)}%` }}
            />
          </div>
        </div>

        {/* Open count */}
        {event.total_offen > 0 && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            {event.total_offen} offen
          </span>
        )}
      </button>

      {/* Expanded: Shift details */}
      {isExpanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-neutral-700">
              Schichten &amp; Zuweisungen
            </h4>
            <Link
              href={`/auffuehrungen/${event.id}/helfer-koordination` as never}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              Zur Helfer-Koordination &rarr;
            </Link>
          </div>

          {event.schichten.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Keine Schichten definiert
            </p>
          ) : (
            <div className="space-y-3">
              {/* Group by intern/public */}
              {(['intern', 'public'] as const).map((visibility) => {
                const filtered = event.schichten.filter(
                  (s) => s.sichtbarkeit === visibility
                )
                if (filtered.length === 0) return null

                return (
                  <div key={visibility}>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          visibility === 'intern'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {visibility === 'intern'
                          ? 'Intern (Vereinsmitglieder)'
                          : 'Öffentlich (Mitmachen-Seite)'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {filtered.map((schicht) => (
                        <SchichtRow
                          key={schicht.id}
                          schicht={schicht}
                          personen={personen}
                          showAssignDropdown={visibility === 'intern'}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Schicht Row with Assignment Dropdown
// =============================================================================

function SchichtRow({
  schicht,
  personen,
  showAssignDropdown,
}: {
  schicht: DashboardSchichtDetail
  personen: { id: string; vorname: string; nachname: string }[]
  showAssignDropdown: boolean
}) {
  const router = useRouter()
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get IDs of already assigned persons
  const assignedPersonIds = new Set(
    schicht.zuweisungen
      .map((z) => z.person_id)
      .filter((id): id is string => id !== null)
  )
  const availablePersonen = personen.filter((p) => !assignedPersonIds.has(p.id))

  const handleAssign = async () => {
    if (!selectedPersonId) return
    setLoading(true)
    setError(null)

    const result = await assignPersonToSchicht(schicht.id, selectedPersonId)
    if (result.success) {
      setIsAssigning(false)
      setSelectedPersonId('')
      router.refresh()
    } else {
      setError(result.error || 'Fehler')
    }
    setLoading(false)
  }

  const handleRemove = async (zuweisungId: string) => {
    if (!confirm('Zuweisung entfernen?')) return
    await removeAssignment(zuweisungId)
    router.refresh()
  }

  const isFull = schicht.freie_plaetze <= 0

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900">
              {schicht.rolle}
            </span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                isFull
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {schicht.anzahl_belegt}/{schicht.anzahl_benoetigt}
            </span>
          </div>
          {schicht.zeitblock && (
            <p className="text-xs text-neutral-500">
              {schicht.zeitblock.name} (
              {schicht.zeitblock.startzeit.slice(0, 5)} &ndash;{' '}
              {schicht.zeitblock.endzeit.slice(0, 5)})
            </p>
          )}
        </div>

        {/* Assign button for intern shifts */}
        {showAssignDropdown && !isFull && !isAssigning && (
          <button
            onClick={() => setIsAssigning(true)}
            className="shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            + Zuweisen
          </button>
        )}
      </div>

      {/* Current assignments */}
      {schicht.zuweisungen.length > 0 && (
        <div className="mt-2 space-y-1">
          {schicht.zuweisungen.map((z) => {
            const name = z.person
              ? `${z.person.vorname} ${z.person.nachname}`
              : z.external_helper
                ? `${z.external_helper.vorname} ${z.external_helper.nachname}`
                : 'Unbekannt'
            const isExternal = !z.person && !!z.external_helper

            return (
              <div
                key={z.id}
                className="flex items-center justify-between rounded bg-neutral-50 px-2.5 py-1.5"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-5 w-5 rounded-full bg-neutral-200 text-center text-xs leading-5 text-neutral-600">
                    {name.charAt(0)}
                  </span>
                  <span className="text-neutral-800">{name}</span>
                  {isExternal && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                      Extern
                    </span>
                  )}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs ${
                      z.status === 'zugesagt'
                        ? 'bg-green-50 text-green-700'
                        : z.status === 'erschienen'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {z.status === 'zugesagt'
                      ? 'Zugesagt'
                      : z.status === 'erschienen'
                        ? 'Erschienen'
                        : z.status === 'vorgeschlagen'
                          ? 'Vorgeschlagen'
                          : z.status}
                  </span>
                </div>
                {showAssignDropdown && (
                  <button
                    onClick={() => handleRemove(z.id)}
                    className="text-neutral-400 hover:text-red-500"
                    title="Zuweisung entfernen"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Assignment dropdown */}
      {isAssigning && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <select
              value={selectedPersonId}
              onChange={(e) => {
                setSelectedPersonId(e.target.value)
                setError(null)
              }}
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
            >
              <option value="">Mitglied auswählen...</option>
              {availablePersonen.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nachname}, {p.vorname}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedPersonId}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white disabled:bg-primary-300"
            >
              {loading ? '...' : 'OK'}
            </button>
            <button
              onClick={() => {
                setIsAssigning(false)
                setSelectedPersonId('')
                setError(null)
              }}
              className="px-2 py-1.5 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Abbrechen
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Icon
// =============================================================================

function MitmachenIcon() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
      <svg
        className="h-5 w-5 text-primary-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    </div>
  )
}
