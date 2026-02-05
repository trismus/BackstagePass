'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import type { EventClickArg } from '@fullcalendar/core'
import deLocale from '@fullcalendar/core/locales/de'
import Link from 'next/link'
import type {
  PersonalEvent,
  PersonalEventTyp,
} from '@/lib/actions/persoenlicher-kalender'
import {
  acceptPersonalEvent,
  declinePersonalEvent,
  generatePersonalICalFeed,
} from '@/lib/actions/persoenlicher-kalender'

// =============================================================================
// Types
// =============================================================================

interface PersonalCalendarProps {
  initialEvents: PersonalEvent[]
}

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'listMonth'

// =============================================================================
// Color Mapping
// =============================================================================

const eventColors: Record<
  PersonalEventTyp,
  { bg: string; border: string; text: string }
> = {
  veranstaltung: {
    bg: 'rgb(219 234 254)', // blue-100
    border: 'rgb(59 130 246)', // blue-500
    text: 'rgb(30 64 175)', // blue-800
  },
  probe: {
    bg: 'rgb(243 232 255)', // purple-100
    border: 'rgb(168 85 247)', // purple-500
    text: 'rgb(107 33 168)', // purple-800
  },
  schicht: {
    bg: 'rgb(254 243 199)', // amber-100
    border: 'rgb(245 158 11)', // amber-500
    text: 'rgb(146 64 14)', // amber-800
  },
}

const typLabels: Record<PersonalEventTyp, string> = {
  veranstaltung: 'Veranstaltung',
  probe: 'Probe',
  schicht: 'Schicht',
}

const statusLabels: Record<string, string> = {
  angemeldet: 'Angemeldet',
  warteliste: 'Warteliste',
  eingeladen: 'Eingeladen',
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
  erschienen: 'Erschienen',
}

// =============================================================================
// Component
// =============================================================================

export function PersonalCalendar({ initialEvents }: PersonalCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<PersonalEvent[]>(initialEvents)
  const [filter, setFilter] = useState<PersonalEventTyp | 'all'>('all')
  const [selectedEvent, setSelectedEvent] = useState<PersonalEvent | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('dayGridMonth')

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events
    return events.filter((e) => e.typ === filter)
  }, [events, filter])

  // Convert to FullCalendar format
  const calendarEvents = useMemo(() => {
    return filteredEvents.map((event) => {
      const colors = eventColors[event.typ]

      let start = event.datum
      let end = event.datum
      let allDay = true

      if (event.startzeit) {
        start = `${event.datum}T${event.startzeit}`
        allDay = false
      }
      if (event.endzeit) {
        end = `${event.datum}T${event.endzeit}`
      } else if (!allDay) {
        const startDate = new Date(start)
        startDate.setHours(startDate.getHours() + 2)
        end = startDate.toISOString()
      }

      return {
        id: event.id,
        title: event.titel,
        start,
        end,
        allDay,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: {
          originalEvent: event,
        },
      }
    })
  }, [filteredEvents])

  // Handle event click
  const handleEventClick = useCallback((info: EventClickArg) => {
    const event = info.event.extendedProps.originalEvent as PersonalEvent
    setSelectedEvent(event)
  }, [])

  // Handle accept
  const handleAccept = useCallback(async () => {
    if (!selectedEvent) return

    setIsLoading(true)
    const result = await acceptPersonalEvent(selectedEvent.id)
    setIsLoading(false)

    if (result.success) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selectedEvent.id ? { ...e, status: 'zugesagt', kann_zusagen: false } : e
        )
      )
      setSelectedEvent((prev) =>
        prev ? { ...prev, status: 'zugesagt', kann_zusagen: false } : null
      )
    } else {
      console.error('Error accepting:', result.error)
    }
  }, [selectedEvent])

  // Handle decline
  const handleDecline = useCallback(async () => {
    if (!selectedEvent) return

    setIsLoading(true)
    const result = await declinePersonalEvent(selectedEvent.id)
    setIsLoading(false)

    if (result.success) {
      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id))
      setSelectedEvent(null)
    } else {
      console.error('Error declining:', result.error)
    }
  }, [selectedEvent])

  // Handle iCal export
  const handleICalExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const icalContent = await generatePersonalICalFeed()
      const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meine-termine-${new Date().toISOString().split('T')[0]}.ics`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }, [])

  // View buttons
  const viewButtons: { view: ViewType; label: string }[] = [
    { view: 'dayGridMonth', label: 'Monat' },
    { view: 'timeGridWeek', label: 'Woche' },
    { view: 'listMonth', label: 'Liste' },
  ]

  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view)
    calendarRef.current?.getApi().changeView(view)
  }, [])

  const handleToday = useCallback(() => {
    calendarRef.current?.getApi().today()
  }, [])

  const handlePrev = useCallback(() => {
    calendarRef.current?.getApi().prev()
  }, [])

  const handleNext = useCallback(() => {
    calendarRef.current?.getApi().next()
  }, [])

  // Get link for event detail
  const getEventLink = (event: PersonalEvent): string => {
    if (event.probe_id) {
      return `/proben/${event.probe_id}`
    }
    if (event.veranstaltung_id) {
      return `/veranstaltungen/${event.veranstaltung_id}`
    }
    return '#'
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
              aria-label="Vorheriger Zeitraum"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Heute
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
              aria-label="Nächster Zeitraum"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* View Buttons */}
          <div className="flex overflow-hidden rounded-lg border border-gray-300">
            {viewButtons.map(({ view, label }) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  currentView === view
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as PersonalEventTyp | 'all')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Alle Typen</option>
            <option value="veranstaltung">Veranstaltungen</option>
            <option value="probe">Proben</option>
            <option value="schicht">Schichten</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleICalExport}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isExporting ? 'Exportiere...' : 'iCal Export'}
          </button>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-200 pt-4">
          {Object.entries(typLabels).map(([typ, label]) => {
            const colors = eventColors[typ as PersonalEventTyp]
            return (
              <div key={typ} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded"
                  style={{
                    backgroundColor: colors.bg,
                    border: `2px solid ${colors.border}`,
                  }}
                />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-lg bg-white p-4 shadow">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView={currentView}
          locale={deLocale}
          headerToolbar={false}
          events={calendarEvents}
          eventClick={handleEventClick}
          eventContent={(arg) => (
            <div className="overflow-hidden p-1">
              <div className="truncate text-xs font-medium">{arg.event.title}</div>
            </div>
          )}
          height="auto"
          aspectRatio={1.8}
          dayMaxEvents={3}
          moreLinkText={(n) => `+${n} weitere`}
          weekNumbers={true}
          weekText="KW"
          firstDay={1}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={true}
          allDayText="Ganztägig"
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          nowIndicator={true}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 text-center shadow">
          <div className="text-2xl font-bold text-blue-600">
            {events.filter((e) => e.typ === 'veranstaltung').length}
          </div>
          <div className="text-sm text-gray-600">Veranstaltungen</div>
        </div>
        <div className="rounded-lg bg-white p-4 text-center shadow">
          <div className="text-2xl font-bold text-purple-600">
            {events.filter((e) => e.typ === 'probe').length}
          </div>
          <div className="text-sm text-gray-600">Proben</div>
        </div>
        <div className="rounded-lg bg-white p-4 text-center shadow">
          <div className="text-2xl font-bold text-amber-600">
            {events.filter((e) => e.typ === 'schicht').length}
          </div>
          <div className="text-sm text-gray-600">Schichten</div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <span
                  className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: eventColors[selectedEvent.typ]?.bg,
                    color: eventColors[selectedEvent.typ]?.text,
                  }}
                >
                  {typLabels[selectedEvent.typ]}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEvent.titel}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Datum</dt>
                <dd className="text-gray-900">
                  {new Date(selectedEvent.datum).toLocaleDateString('de-CH', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>

              {selectedEvent.startzeit && (
                <div>
                  <dt className="font-medium text-gray-500">Zeit</dt>
                  <dd className="text-gray-900">
                    {selectedEvent.startzeit.substring(0, 5)}
                    {selectedEvent.endzeit &&
                      ` - ${selectedEvent.endzeit.substring(0, 5)}`}
                  </dd>
                </div>
              )}

              {selectedEvent.ort && (
                <div>
                  <dt className="font-medium text-gray-500">Ort</dt>
                  <dd className="text-gray-900">{selectedEvent.ort}</dd>
                </div>
              )}

              {selectedEvent.rolle && (
                <div>
                  <dt className="font-medium text-gray-500">Rolle</dt>
                  <dd className="text-gray-900">{selectedEvent.rolle}</dd>
                </div>
              )}

              {selectedEvent.zeitblock && (
                <div>
                  <dt className="font-medium text-gray-500">Zeitblock</dt>
                  <dd className="text-gray-900">{selectedEvent.zeitblock}</dd>
                </div>
              )}

              {selectedEvent.stueck_titel && (
                <div>
                  <dt className="font-medium text-gray-500">Stück</dt>
                  <dd className="text-gray-900">{selectedEvent.stueck_titel}</dd>
                </div>
              )}

              <div>
                <dt className="font-medium text-gray-500">Status</dt>
                <dd className="text-gray-900">
                  {statusLabels[selectedEvent.status] || selectedEvent.status}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex gap-3">
              {selectedEvent.kann_zusagen && (
                <button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Wird gespeichert...' : 'Zusagen'}
                </button>
              )}
              {selectedEvent.kann_absagen && (
                <button
                  onClick={handleDecline}
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? 'Wird gespeichert...' : 'Absagen'}
                </button>
              )}
              <Link
                href={getEventLink(selectedEvent) as never}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
              >
                Details
              </Link>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Schliessen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
