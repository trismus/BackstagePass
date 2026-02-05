'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { EventClickArg, EventDropArg } from '@fullcalendar/core'
import deLocale from '@fullcalendar/core/locales/de'
import Link from 'next/link'
import type { KalenderEvent, KalenderEventTyp, KalenderFilter } from '@/lib/actions/kalender'
import {
  updateKalenderEventDate,
  generateICalExport,
} from '@/lib/actions/kalender'
import type { Produktion, UserRole } from '@/lib/supabase/types'
import { isManagement } from '@/lib/supabase/permissions'

// =============================================================================
// Types
// =============================================================================

interface UnifiedCalendarProps {
  initialEvents: KalenderEvent[]
  produktionen: Pick<Produktion, 'id' | 'titel' | 'status'>[]
  userRole: UserRole
}

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth'

// =============================================================================
// Color Mapping
// =============================================================================

const eventColors: Record<KalenderEventTyp | string, { bg: string; border: string; text: string }> = {
  probe: {
    bg: 'rgb(254 243 199)', // amber-100
    border: 'rgb(245 158 11)', // amber-500
    text: 'rgb(146 64 14)', // amber-800
  },
  auffuehrung: {
    bg: 'rgb(243 232 255)', // purple-100
    border: 'rgb(168 85 247)', // purple-500
    text: 'rgb(107 33 168)', // purple-800
  },
  vereinsevent: {
    bg: 'rgb(219 234 254)', // blue-100
    border: 'rgb(59 130 246)', // blue-500
    text: 'rgb(30 64 175)', // blue-800
  },
  sonstiges: {
    bg: 'rgb(243 244 246)', // gray-100
    border: 'rgb(156 163 175)', // gray-400
    text: 'rgb(55 65 81)', // gray-700
  },
  veranstaltung: {
    bg: 'rgb(220 252 231)', // green-100
    border: 'rgb(34 197 94)', // green-500
    text: 'rgb(21 128 61)', // green-700
  },
}

const typLabels: Record<KalenderEventTyp | string, string> = {
  probe: 'Probe',
  auffuehrung: 'Aufführung',
  vereinsevent: 'Vereinsevent',
  sonstiges: 'Sonstiges',
  veranstaltung: 'Veranstaltung',
}

// =============================================================================
// Component
// =============================================================================

export function UnifiedCalendar({
  initialEvents,
  produktionen,
  userRole,
}: UnifiedCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<KalenderEvent[]>(initialEvents)
  const [filter, setFilter] = useState<KalenderFilter>({ typ: 'all' })
  const [selectedEvent, setSelectedEvent] = useState<KalenderEvent | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('dayGridMonth')

  const canEdit = isManagement(userRole)

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Type filter
      if (filter.typ && filter.typ !== 'all' && event.typ !== filter.typ) {
        return false
      }

      // Production filter
      if (filter.produktionId) {
        if (event.produktion_id !== filter.produktionId) {
          // For proben, check stueck connection through produktionen
          if (event.typ !== 'probe') return false
        }
      }

      return true
    })
  }, [events, filter])

  // Convert to FullCalendar format
  const calendarEvents = useMemo(() => {
    return filteredEvents.map((event) => {
      const colors = eventColors[event.typ] || eventColors.sonstiges

      // Construct start and end datetime
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
        // Default 2 hour duration if no end time
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
          typ: event.typ,
          ort: event.ort,
          status: event.status,
        },
      }
    })
  }, [filteredEvents])

  // Handle event click
  const handleEventClick = useCallback((info: EventClickArg) => {
    const event = info.event.extendedProps.originalEvent as KalenderEvent
    setSelectedEvent(event)
  }, [])

  // Handle event drop (drag & drop)
  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      if (!canEdit) {
        info.revert()
        return
      }

      const event = info.event.extendedProps.originalEvent as KalenderEvent
      if (!event.kann_bearbeiten) {
        info.revert()
        return
      }

      const newDate = info.event.start
      if (!newDate) {
        info.revert()
        return
      }

      const newDatum = newDate.toISOString().split('T')[0]
      let newStartzeit: string | undefined
      let newEndzeit: string | undefined

      if (!info.event.allDay) {
        newStartzeit = newDate.toTimeString().substring(0, 5)
        if (info.event.end) {
          newEndzeit = info.event.end.toTimeString().substring(0, 5)
        }
      }

      const result = await updateKalenderEventDate(
        event.id,
        newDatum,
        newStartzeit,
        newEndzeit
      )

      if (!result.success) {
        info.revert()
        console.error('Failed to update event:', result.error)
        return
      }

      // Update local state
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                datum: newDatum,
                startzeit: newStartzeit || e.startzeit,
                endzeit: newEndzeit || e.endzeit,
              }
            : e
        )
      )
    },
    [canEdit]
  )

  // Handle iCal export
  const handleICalExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const icalContent = await generateICalExport(filteredEvents)
      const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tgw-kalender-${new Date().toISOString().split('T')[0]}.ics`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }, [filteredEvents])

  // View buttons
  const viewButtons: { view: ViewType; label: string }[] = [
    { view: 'dayGridMonth', label: 'Monat' },
    { view: 'timeGridWeek', label: 'Woche' },
    { view: 'timeGridDay', label: 'Tag' },
    { view: 'listMonth', label: 'Liste' },
  ]

  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view)
    calendarRef.current?.getApi().changeView(view)
  }, [])

  // Navigate
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
  const getEventLink = (event: KalenderEvent): string => {
    if (event.veranstaltung_id) {
      return `/veranstaltungen/${event.veranstaltung_id}`
    }
    if (event.probe_id) {
      return `/proben/${event.probe_id}`
    }
    if (event.produktion_id) {
      return `/produktionen/${event.produktion_id}`
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
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={filter.typ || 'all'}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  typ: e.target.value as KalenderEventTyp | 'all',
                }))
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Alle Typen</option>
              <option value="probe">Proben</option>
              <option value="auffuehrung">Aufführungen</option>
              <option value="vereinsevent">Vereinsevents</option>
              <option value="sonstiges">Sonstiges</option>
            </select>

            {produktionen.length > 0 && (
              <select
                value={filter.produktionId || ''}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    produktionId: e.target.value || undefined,
                  }))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Alle Produktionen</option>
                {produktionen.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titel}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleICalExport}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            const colors = eventColors[typ] || eventColors.sonstiges
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
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={currentView}
          locale={deLocale}
          headerToolbar={false}
          events={calendarEvents}
          editable={canEdit}
          selectable={canEdit}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventContent={(arg) => (
            <div className="overflow-hidden p-1">
              <div className="truncate text-xs font-medium">{arg.event.title}</div>
              {arg.event.extendedProps.ort && (
                <div className="truncate text-xs opacity-75">
                  {arg.event.extendedProps.ort}
                </div>
              )}
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
          navLinks={true}
          navLinkDayClick={(date) => {
            calendarRef.current?.getApi().gotoDate(date)
            handleViewChange('timeGridDay')
          }}
        />
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
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {selectedEvent.endzeit && ` - ${selectedEvent.endzeit.substring(0, 5)}`}
                  </dd>
                </div>
              )}

              {selectedEvent.ort && (
                <div>
                  <dt className="font-medium text-gray-500">Ort</dt>
                  <dd className="text-gray-900">{selectedEvent.ort}</dd>
                </div>
              )}

              {selectedEvent.stueck_titel && (
                <div>
                  <dt className="font-medium text-gray-500">Stück</dt>
                  <dd className="text-gray-900">{selectedEvent.stueck_titel}</dd>
                </div>
              )}

              {selectedEvent.produktion_titel && (
                <div>
                  <dt className="font-medium text-gray-500">Produktion</dt>
                  <dd className="text-gray-900">{selectedEvent.produktion_titel}</dd>
                </div>
              )}

              {selectedEvent.beschreibung && (
                <div>
                  <dt className="font-medium text-gray-500">Beschreibung</dt>
                  <dd className="text-gray-900">{selectedEvent.beschreibung}</dd>
                </div>
              )}

              <div>
                <dt className="font-medium text-gray-500">Status</dt>
                <dd className="text-gray-900 capitalize">{selectedEvent.status}</dd>
              </div>
            </dl>

            <div className="mt-6 flex gap-3">
              <Link
                href={getEventLink(selectedEvent) as never}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
              >
                Details anzeigen
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
