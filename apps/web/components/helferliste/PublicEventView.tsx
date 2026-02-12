'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { anmeldenPublicMulti } from '@/lib/actions/helferliste'
import {
  generateICalEvent,
  icalToDataUrl,
  generateIcalFilename,
} from '@/lib/utils/ical-generator'
import type {
  PublicHelferEventData,
  RollenInstanzMitAnmeldungen,
  BookHelferSlotResult,
  InfoBlock,
} from '@/lib/supabase/types'
import {
  MultiSelectProvider,
  useMultiSelect,
} from './MultiSelectContext'

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

function formatDateTime(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
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

function getRollenName(rolle: RollenInstanzMitAnmeldungen): string {
  return rolle.template?.name || rolle.custom_name || 'Unbekannte Rolle'
}

// =============================================================================
// Main Component (Wrapper)
// =============================================================================

export function PublicEventView({ event }: PublicEventViewProps) {
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
    <MultiSelectProvider
      allRollen={event.rollen}
      eventDatumStart={event.datum_start}
      eventDatumEnd={event.datum_end}
    >
      <PublicEventViewInner event={event} />
    </MultiSelectProvider>
  )
}

// =============================================================================
// Inner Component (uses MultiSelect context)
// =============================================================================

function PublicEventViewInner({ event }: PublicEventViewProps) {
  const { state } = useMultiSelect()

  const eventInfo: EventInfo = {
    name: event.name,
    datum_start: event.datum_start,
    datum_end: event.datum_end,
    ort: event.ort ?? null,
  }

  return (
    <div className="space-y-6">
      {/* Info Blocks */}
      {event.infoBloecke.length > 0 && (
        <InfoBlocksSection infoBloecke={event.infoBloecke} />
      )}

      {state.step === 'select' && (
        <SelectStep event={event} eventInfo={eventInfo} />
      )}
      {state.step === 'contact' && (
        <ContactFormStep event={event} eventInfo={eventInfo} />
      )}
      {state.step === 'confirmation' && (
        <ConfirmationStep event={event} eventInfo={eventInfo} />
      )}
    </div>
  )
}

// =============================================================================
// Step 1: Select Roles
// =============================================================================

function SelectStep({
  event,
  eventInfo,
}: {
  event: PublicHelferEventData
  eventInfo: EventInfo
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedZeitblock, setSelectedZeitblock] = useState<string | null>(
    null
  )
  const { state } = useMultiSelect()

  const groups = useMemo(
    () => groupRollenByZeitblock(event.rollen),
    [event.rollen]
  )

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        rollen: group.rollen.filter((rolle) => {
          const name = rolle.template?.name || rolle.custom_name || ''
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

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900">
        Verfügbare Rollen
      </h2>

      {showFilters && (
        <FilterBar
          groups={groups}
          searchQuery={searchQuery}
          selectedZeitblock={selectedZeitblock}
          onSearchChange={setSearchQuery}
          onZeitblockChange={setSelectedZeitblock}
        />
      )}

      {/* Conflict Warning */}
      {state.clientConflicts.length > 0 && <ConflictWarningBanner />}

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

      {/* Bottom Bar */}
      <SelectionBottomBar />
    </>
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
// Role Card (Multi-Select with Checkbox)
// =============================================================================

function PublicRolleCard({
  rolle,
  eventInfo: _eventInfo,
}: {
  rolle: RollenInstanzMitAnmeldungen
  eventInfo: EventInfo
}) {
  const { state, toggleRole } = useMultiSelect()
  const isSelected = state.selectedIds.has(rolle.id)

  const rollenName = getRollenName(rolle)
  const isFull = rolle.angemeldet_count >= rolle.anzahl_benoetigt
  const spotsLeft = rolle.anzahl_benoetigt - rolle.angemeldet_count

  return (
    <button
      type="button"
      onClick={() => toggleRole(rolle.id)}
      className={`w-full rounded-lg bg-white p-6 text-left shadow transition-all ${
        isSelected
          ? 'border-2 border-primary-500 bg-primary-50 ring-2 ring-primary-200'
          : 'border-2 border-transparent hover:border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-0.5">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
              isSelected
                ? 'border-primary-600 bg-primary-600'
                : 'border-gray-300 bg-white'
            }`}
          >
            {isSelected && (
              <svg
                className="h-3.5 w-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {rollenName}
              </h3>
              {(rolle.zeitblock_start || rolle.zeitblock_end) && (
                <p className="mt-1 text-sm text-gray-500">
                  {formatDateTime(rolle.zeitblock_start)}
                  {rolle.zeitblock_end &&
                    ` - ${formatDateTime(rolle.zeitblock_end)}`}
                </p>
              )}
            </div>
            <div className="ml-2 text-right">
              <span
                className={`text-sm font-medium ${isFull ? 'text-warning-600' : 'text-success-600'}`}
              >
                {isFull
                  ? 'Voll (Warteliste)'
                  : `${spotsLeft} ${spotsLeft === 1 ? 'Platz' : 'Plätze'} frei`}
              </span>
            </div>
          </div>

          {rolle.anmeldungen.length > 0 && (
            <p className="mt-2 text-sm text-gray-400">
              {rolle.anmeldungen.length} Anmeldung
              {rolle.anmeldungen.length > 1 ? 'en' : ''}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// =============================================================================
// Selection Bottom Bar
// =============================================================================

function SelectionBottomBar() {
  const { state, setStep } = useMultiSelect()
  const count = state.selectedIds.size

  if (count === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {count} {count === 1 ? 'Rolle' : 'Rollen'} ausgewählt
          </span>
          {state.clientConflicts.length > 0 && (
            <span
              className="text-warning-600"
              title="Zeitüberschneidungen vorhanden"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.832c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </span>
          )}
        </div>
        <button
          onClick={() => setStep('contact')}
          className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700"
        >
          Weiter
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// Conflict Warning Banner
// =============================================================================

function ConflictWarningBanner() {
  const { state } = useMultiSelect()

  return (
    <div className="rounded-lg border border-warning-200 bg-warning-50 p-4">
      <div className="flex gap-3">
        <svg
          className="h-5 w-5 flex-shrink-0 text-warning-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.832c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <div>
          <h4 className="text-sm font-medium text-warning-800">
            Zeitüberschneidungen erkannt
          </h4>
          <ul className="mt-1 space-y-1">
            {state.clientConflicts.map((conflict, i) => (
              <li key={i} className="text-sm text-warning-700">
                &laquo;{conflict.rolle_a}&raquo; und &laquo;{conflict.rolle_b}
                &raquo; überschneiden sich zeitlich
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-warning-600">
            Du kannst trotzdem fortfahren, aber beachte die Überschneidungen.
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Step 2: Contact Form
// =============================================================================

function ContactFormStep({
  event,
}: {
  event: PublicHelferEventData
  eventInfo: EventInfo
}) {
  const router = useRouter()
  const {
    state,
    setStep,
    setContactData,
    setSubmitting,
    setError,
    setBookingResults,
  } = useMultiSelect()

  const selectedRollen = event.rollen.filter((r) =>
    state.selectedIds.has(r.id)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.contactData.name.trim()) {
      setError('Name ist erforderlich')
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await anmeldenPublicMulti(
      Array.from(state.selectedIds),
      {
        name: state.contactData.name.trim(),
        email: state.contactData.email.trim() || undefined,
        telefon: state.contactData.telefon.trim() || undefined,
      }
    )

    if (!result.success) {
      setError(result.error || 'Fehler bei der Anmeldung')
      setSubmitting(false)
      return
    }

    setBookingResults(result.results || [], result.conflicts)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Kontaktdaten</h2>

      {/* Summary of selected roles */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Ausgewählte Rollen ({selectedRollen.length})
        </h3>
        <ul className="space-y-1">
          {selectedRollen.map((rolle) => (
            <li key={rolle.id} className="flex items-center gap-2 text-sm">
              <span className="text-primary-600">&#x2713;</span>
              <span className="font-medium text-gray-900">
                {getRollenName(rolle)}
              </span>
              {(rolle.zeitblock_start || rolle.zeitblock_end) && (
                <span className="text-gray-500">
                  ({formatDateTime(rolle.zeitblock_start)}
                  {rolle.zeitblock_end &&
                    ` - ${formatDateTime(rolle.zeitblock_end)}`}
                  )
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {state.error && (
        <div className="rounded border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
          {state.error}
        </div>
      )}

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium text-gray-700"
          >
            Name *
          </label>
          <input
            type="text"
            id="contact-name"
            required
            value={state.contactData.name}
            onChange={(e) => setContactData({ name: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            placeholder="Dein Name"
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-gray-700"
          >
            E-Mail (optional)
          </label>
          <input
            type="email"
            id="contact-email"
            value={state.contactData.email}
            onChange={(e) => setContactData({ email: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            placeholder="name@beispiel.ch"
          />
        </div>

        <div>
          <label
            htmlFor="contact-telefon"
            className="block text-sm font-medium text-gray-700"
          >
            Telefon (optional)
          </label>
          <input
            type="tel"
            id="contact-telefon"
            value={state.contactData.telefon}
            onChange={(e) => setContactData({ telefon: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            placeholder="+41 79 123 45 67"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep('select')}
            disabled={state.isSubmitting}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Zurück
          </button>
          <button
            type="submit"
            disabled={state.isSubmitting}
            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {state.isSubmitting
              ? 'Anmelden...'
              : `Jetzt anmelden (${selectedRollen.length})`}
          </button>
        </div>
      </form>
    </div>
  )
}

// =============================================================================
// Step 3: Confirmation
// =============================================================================

function ConfirmationStep({
  event,
  eventInfo,
}: {
  event: PublicHelferEventData
  eventInfo: EventInfo
}) {
  const { state, reset } = useMultiSelect()

  const confirmedCount = state.bookingResults.filter(
    (r) => r.success && !r.is_waitlist
  ).length
  const waitlistCount = state.bookingResults.filter(
    (r) => r.success && r.is_waitlist
  ).length

  // Map booking results to roles
  const resultsByRolleId = new Map<string, BookHelferSlotResult>()
  const selectedIdsArray = Array.from(state.selectedIds)
  state.bookingResults.forEach((result, index) => {
    if (selectedIdsArray[index]) {
      resultsByRolleId.set(selectedIdsArray[index], result)
    }
  })

  const handleIcsDownload = () => {
    // Generate combined ICS with all booked roles
    const selectedRollen = event.rollen.filter((r) =>
      state.selectedIds.has(r.id)
    )

    const events = selectedRollen
      .filter((rolle) => {
        const result = resultsByRolleId.get(rolle.id)
        return result?.success
      })
      .map((rolle) => {
        const rollenName = getRollenName(rolle)
        const startDate = new Date(
          rolle.zeitblock_start || eventInfo.datum_start
        )
        const endDate = new Date(rolle.zeitblock_end || eventInfo.datum_end)
        return generateICalEvent({
          title: `Helfereinsatz: ${rollenName} - ${eventInfo.name}`,
          description: `Rolle: ${rollenName}\nVeranstaltung: ${eventInfo.name}`,
          location: eventInfo.ort || undefined,
          startDate,
          endDate,
        })
      })

    if (events.length === 0) return

    // For multiple events, combine into one ICS
    // Use the first event as base, but for simplicity just download first one
    // (iCal format supports multi-event files by merging VEVENT blocks)
    if (events.length === 1) {
      const dataUrl = icalToDataUrl(events[0])
      const filename = generateIcalFilename(eventInfo.name, 'helfereinsaetze')
      triggerDownload(dataUrl, filename)
    } else {
      // Merge multiple VCALENDAR files into one
      const merged = mergeICalEvents(events)
      const dataUrl = icalToDataUrl(merged)
      const filename = generateIcalFilename(eventInfo.name, 'helfereinsaetze')
      triggerDownload(dataUrl, filename)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
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
        <h2 className="text-lg font-semibold text-gray-900">
          Anmeldung abgeschlossen
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {confirmedCount > 0 &&
            `${confirmedCount} bestätigt`}
          {confirmedCount > 0 && waitlistCount > 0 && ', '}
          {waitlistCount > 0 &&
            `${waitlistCount} auf Warteliste`}
        </p>
      </div>

      {/* Results per Role */}
      <div className="space-y-3">
        {selectedIdsArray.map((rolleId) => {
          const rolle = event.rollen.find((r) => r.id === rolleId)
          const result = resultsByRolleId.get(rolleId)
          if (!rolle) return null

          const rollenName = getRollenName(rolle)

          return (
            <div
              key={rolleId}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{rollenName}</h3>
                  {(rolle.zeitblock_start || rolle.zeitblock_end) && (
                    <p className="text-sm text-gray-500">
                      {formatDateTime(rolle.zeitblock_start)}
                      {rolle.zeitblock_end &&
                        ` - ${formatDateTime(rolle.zeitblock_end)}`}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    result?.is_waitlist
                      ? 'bg-warning-100 text-warning-800'
                      : result?.success
                        ? 'bg-success-100 text-success-800'
                        : 'bg-error-100 text-error-800'
                  }`}
                >
                  {result?.is_waitlist
                    ? 'Warteliste'
                    : result?.success
                      ? 'Bestätigt'
                      : 'Fehler'}
                </span>
              </div>

              {/* Cancellation Link */}
              {result?.abmeldung_token && (
                <Link
                  href={
                    `/helfer/helferliste/abmeldung/${result.abmeldung_token}` as never
                  }
                  className="mt-2 inline-block text-sm text-error-600 hover:text-error-700"
                >
                  Stornieren
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Event Details */}
      <div className="rounded-lg bg-gray-50 p-4">
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
          {eventInfo.ort && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Ort</dt>
              <dd className="font-medium text-gray-900">{eventInfo.ort}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Waitlist note */}
      {waitlistCount > 0 && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
          <p className="text-sm text-warning-800">
            Du stehst für {waitlistCount}{' '}
            {waitlistCount === 1 ? 'Rolle' : 'Rollen'} auf der Warteliste.
            Wir melden uns, sobald ein Platz frei wird.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
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
          Alle Termine zum Kalender hinzufügen (.ics)
        </button>

        <button
          onClick={reset}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Weitere Rollen anmelden
        </button>
      </div>

      {/* Email Hint */}
      {state.contactData.email && (
        <p className="text-center text-xs text-gray-500">
          Du erhältst eine Bestätigung per E-Mail an{' '}
          {state.contactData.email}.
        </p>
      )}
    </div>
  )
}

// =============================================================================
// Utilities
// =============================================================================

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function mergeICalEvents(icsContents: string[]): string {
  if (icsContents.length === 0) return ''
  if (icsContents.length === 1) return icsContents[0]

  // Extract VEVENT blocks from each ICS content and merge into one VCALENDAR
  const vevents: string[] = []
  let preamble = ''

  for (let i = 0; i < icsContents.length; i++) {
    const content = icsContents[i]
    const veventMatch = content.match(
      /BEGIN:VEVENT[\s\S]*?END:VEVENT/
    )
    if (veventMatch) {
      vevents.push(veventMatch[0])
    }
    if (i === 0) {
      // Use preamble from first event (VCALENDAR header + VTIMEZONE)
      preamble = content.substring(0, content.indexOf('BEGIN:VEVENT'))
    }
  }

  return preamble + vevents.join('\r\n') + '\r\nEND:VCALENDAR'
}
