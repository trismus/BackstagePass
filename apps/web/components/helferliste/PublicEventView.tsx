'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { anmeldenPublic } from '@/lib/actions/helferliste'
import {
  generateICalEvent,
  icalToDataUrl,
  generateIcalFilename,
} from '@/lib/utils/ical-generator'
import type {
  PublicHelferEventData,
  RollenInstanzMitAnmeldungen,
  InfoBlock,
} from '@/lib/supabase/types'

// =============================================================================
// Types
// =============================================================================

interface EventInfo {
  name: string
  datum_start: string
  datum_end: string
  ort: string | null
}

interface ZeitblockGroup {
  key: string
  label: string
  zeitblock_start: string | null
  zeitblock_end: string | null
  rollen: RollenInstanzMitAnmeldungen[]
}

interface PublicEventViewProps {
  event: PublicHelferEventData
}

// =============================================================================
// Helpers
// =============================================================================

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function groupRollenByZeitblock(
  rollen: RollenInstanzMitAnmeldungen[]
): ZeitblockGroup[] {
  const groupMap = new Map<string, ZeitblockGroup>()

  for (const rolle of rollen) {
    const key =
      rolle.zeitblock_start && rolle.zeitblock_end
        ? `${rolle.zeitblock_start}|${rolle.zeitblock_end}`
        : 'allgemein'

    if (!groupMap.has(key)) {
      const label =
        rolle.zeitblock_start && rolle.zeitblock_end
          ? `${formatTime(rolle.zeitblock_start)} – ${formatTime(rolle.zeitblock_end)}`
          : 'Allgemein'

      groupMap.set(key, {
        key,
        label,
        zeitblock_start: rolle.zeitblock_start,
        zeitblock_end: rolle.zeitblock_end,
        rollen: [],
      })
    }
    groupMap.get(key)!.rollen.push(rolle)
  }

  return Array.from(groupMap.values()).sort((a, b) => {
    if (a.key === 'allgemein') return 1
    if (b.key === 'allgemein') return -1
    return (a.zeitblock_start ?? '').localeCompare(b.zeitblock_start ?? '')
  })
}

// =============================================================================
// Main Component
// =============================================================================

export function PublicEventView({ event }: PublicEventViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedZeitblock, setSelectedZeitblock] = useState<string | null>(
    null
  )

  const eventInfo: EventInfo = {
    name: event.name,
    datum_start: event.datum_start,
    datum_end: event.datum_end,
    ort: event.ort ?? null,
  }

  const groups = useMemo(
    () => groupRollenByZeitblock(event.rollen),
    [event.rollen]
  )

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        rollen: group.rollen.filter((rolle) => {
          const name =
            rolle.template?.name || rolle.custom_name || ''
          return name.toLowerCase().includes(searchQuery.toLowerCase())
        }),
      }))
      .filter((group) => {
        if (selectedZeitblock !== null && group.key !== selectedZeitblock)
          return false
        return group.rollen.length > 0
      })
  }, [groups, searchQuery, selectedZeitblock])

  const showFilters = groups.length > 1 || event.rollen.length > 3

  if (event.rollen.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-gray-500">
          Derzeit keine öffentlichen Rollen verfügbar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Blocks */}
      {event.infoBloecke.length > 0 && (
        <InfoBlocksSection infoBloecke={event.infoBloecke} />
      )}

      {/* Section Header */}
      <h2 className="text-lg font-semibold text-gray-900">
        Verfügbare Rollen
      </h2>

      {/* Filters */}
      {showFilters && (
        <FilterBar
          groups={groups}
          searchQuery={searchQuery}
          selectedZeitblock={selectedZeitblock}
          onSearchChange={setSearchQuery}
          onZeitblockChange={setSelectedZeitblock}
        />
      )}

      {/* Grouped Roles */}
      {filteredGroups.length > 0 ? (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <ZeitblockGroupSection
              key={group.key}
              group={group}
              eventInfo={eventInfo}
              showHeader={groups.length > 1}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Keine Rollen gefunden.</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedZeitblock(null)
            }}
            className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Filter zurücksetzen
          </button>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Info Blocks Section
// =============================================================================

function InfoBlocksSection({ infoBloecke }: { infoBloecke: InfoBlock[] }) {
  return (
    <div className="space-y-3">
      {infoBloecke.map((info) => (
        <div
          key={info.id}
          className="rounded-xl border border-info-200 bg-info-50 p-4"
        >
          <h4 className="font-medium text-info-900">{info.titel}</h4>
          {info.beschreibung && (
            <p className="mt-1 text-sm text-info-700">{info.beschreibung}</p>
          )}
          <p className="mt-2 text-xs text-info-600">
            {info.startzeit.slice(0, 5)} – {info.endzeit.slice(0, 5)} Uhr
          </p>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Filter Bar
// =============================================================================

function FilterBar({
  groups,
  searchQuery,
  selectedZeitblock,
  onSearchChange,
  onZeitblockChange,
}: {
  groups: ZeitblockGroup[]
  searchQuery: string
  selectedZeitblock: string | null
  onSearchChange: (q: string) => void
  onZeitblockChange: (key: string | null) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Rolle suchen..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:w-48"
      />
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onZeitblockChange(null)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selectedZeitblock === null
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          {groups.map((group) => (
            <button
              key={group.key}
              onClick={() => onZeitblockChange(group.key)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedZeitblock === group.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Zeitblock Group Section
// =============================================================================

function ZeitblockGroupSection({
  group,
  eventInfo,
  showHeader,
}: {
  group: ZeitblockGroup
  eventInfo: EventInfo
  showHeader: boolean
}) {
  const totalSlots = group.rollen.reduce(
    (sum, r) => sum + r.anzahl_benoetigt,
    0
  )
  const totalFree = group.rollen.reduce(
    (sum, r) => sum + Math.max(0, r.anzahl_benoetigt - r.angemeldet_count),
    0
  )

  return (
    <div>
      {showHeader && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{group.label}</h3>
          <span
            className={`text-sm font-medium ${totalFree > 0 ? 'text-success-600' : 'text-gray-400'}`}
          >
            {totalFree > 0
              ? `${totalFree} von ${totalSlots} ${totalFree === 1 ? 'Platz' : 'Plätze'} frei`
              : 'Alle belegt'}
          </span>
        </div>
      )}
      <div className="space-y-4">
        {group.rollen.map((rolle) => (
          <PublicRolleCard
            key={rolle.id}
            rolle={rolle}
            eventInfo={eventInfo}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Role Card (with Registration Form + Confirmation Screen from US-7)
// =============================================================================

function PublicRolleCard({
  rolle,
  eventInfo,
}: {
  rolle: RollenInstanzMitAnmeldungen
  eventInfo: EventInfo
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isWaitlist, setIsWaitlist] = useState(false)
  const [abmeldungToken, setAbmeldungToken] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefon: '',
  })

  const rollenName =
    rolle.template?.name || rolle.custom_name || 'Unbekannte Rolle'
  const isFull = rolle.angemeldet_count >= rolle.anzahl_benoetigt
  const spotsLeft = rolle.anzahl_benoetigt - rolle.angemeldet_count

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await anmeldenPublic(rolle.id, formData)
    if (!result.success) {
      setError(result.error || 'Fehler bei der Anmeldung')
      setIsSubmitting(false)
      return
    }

    setSuccess(true)
    setIsWaitlist(result.isWaitlist ?? false)
    setAbmeldungToken(result.abmeldungToken ?? null)
    setIsSubmitting(false)
    router.refresh()
  }

  const handleIcsDownload = () => {
    const startDate = new Date(rolle.zeitblock_start || eventInfo.datum_start)
    const endDate = new Date(rolle.zeitblock_end || eventInfo.datum_end)

    const icsContent = generateICalEvent({
      title: `Helfereinsatz: ${rollenName} - ${eventInfo.name}`,
      description: `Rolle: ${rollenName}\nVeranstaltung: ${eventInfo.name}`,
      location: eventInfo.ort || undefined,
      startDate,
      endDate,
    })

    const dataUrl = icalToDataUrl(icsContent)
    const filename = generateIcalFilename(eventInfo.name, rollenName)

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (success) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        {/* Status Badge */}
        <div className="mb-4 flex items-center justify-center">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              isWaitlist
                ? 'bg-warning-100 text-warning-800'
                : 'bg-success-100 text-success-800'
            }`}
          >
            {isWaitlist ? 'Warteliste' : 'Bestätigt'}
          </span>
        </div>

        {/* Success Icon */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
            <svg
              className="h-6 w-6 text-success-600"
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
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {isWaitlist ? 'Auf Warteliste gesetzt!' : 'Anmeldung erfolgreich!'}
          </h3>
        </div>

        {/* Event Details */}
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Veranstaltung</dt>
              <dd className="font-medium text-gray-900">{eventInfo.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Datum</dt>
              <dd className="font-medium text-gray-900">
                {new Date(eventInfo.datum_start).toLocaleDateString('de-CH', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Zeit</dt>
              <dd className="font-medium text-gray-900">
                {formatDateTime(rolle.zeitblock_start || eventInfo.datum_start)}
                {' - '}
                {formatDateTime(rolle.zeitblock_end || eventInfo.datum_end)}
              </dd>
            </div>
            {eventInfo.ort && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Ort</dt>
                <dd className="font-medium text-gray-900">{eventInfo.ort}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Rolle</dt>
              <dd className="font-medium text-gray-900">{rollenName}</dd>
            </div>
          </dl>
        </div>

        {/* Waitlist note */}
        {isWaitlist && (
          <div className="mt-4 rounded-lg border border-warning-200 bg-warning-50 p-3">
            <p className="text-sm text-warning-800">
              Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz
              frei wird.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {/* ICS Download */}
          <button
            onClick={handleIcsDownload}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Zum Kalender hinzufügen (.ics)
          </button>

          {/* Cancellation Link */}
          {abmeldungToken && (
            <Link
              href={
                `/helfer/helferliste/abmeldung/${abmeldungToken}` as never
              }
              className="block w-full rounded-lg border border-error-200 bg-white px-4 py-2 text-center text-sm font-medium text-error-600 transition-colors hover:bg-error-50"
            >
              Anmeldung stornieren
            </Link>
          )}
        </div>

        {/* Hint */}
        {formData.email && (
          <p className="mt-4 text-center text-xs text-gray-500">
            Du erhältst eine Bestätigung per E-Mail an {formData.email}.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{rollenName}</h3>
          {(rolle.zeitblock_start || rolle.zeitblock_end) && (
            <p className="mt-1 text-sm text-gray-500">
              {formatDateTime(rolle.zeitblock_start)}
              {rolle.zeitblock_end &&
                ` - ${formatDateTime(rolle.zeitblock_end)}`}
            </p>
          )}
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-medium ${isFull ? 'text-warning-600' : 'text-success-600'}`}
          >
            {isFull
              ? 'Voll (Warteliste möglich)'
              : `${spotsLeft} von ${rolle.anzahl_benoetigt} ${spotsLeft === 1 ? 'Platz' : 'Plätze'} frei`}
          </span>
        </div>
      </div>

      {/* Already registered */}
      {rolle.anmeldungen.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            {rolle.anmeldungen.length} Anmeldung
            {rolle.anmeldungen.length > 1 ? 'en' : ''}
          </p>
        </div>
      )}

      {/* Registration Form */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
        >
          {isFull ? 'Auf Warteliste setzen' : 'Jetzt anmelden'}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 border-t border-gray-100 pt-4"
        >
          {error && (
            <div className="border-error-200 rounded border bg-error-50 px-3 py-2 text-sm text-error-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor={`name-${rolle.id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Name *
            </label>
            <input
              type="text"
              id={`name-${rolle.id}`}
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="Dein Name"
            />
          </div>

          <div>
            <label
              htmlFor={`email-${rolle.id}`}
              className="block text-sm font-medium text-gray-700"
            >
              E-Mail (optional)
            </label>
            <input
              type="email"
              id={`email-${rolle.id}`}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="name@beispiel.ch"
            />
          </div>

          <div>
            <label
              htmlFor={`telefon-${rolle.id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Telefon (optional)
            </label>
            <input
              type="tel"
              id={`telefon-${rolle.id}`}
              value={formData.telefon}
              onChange={(e) =>
                setFormData({ ...formData, telefon: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="+41 79 123 45 67"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Anmelden...'
                : isFull
                  ? 'Auf Warteliste'
                  : 'Anmelden'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
