'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Veranstaltung, VeranstaltungTyp } from '@/lib/supabase/types'
import { StatusBadge } from './StatusBadge'

interface EventKalenderProps {
  veranstaltungen: Veranstaltung[]
  basePath?: string
  title?: string
}

const typColors: Record<string, string> = {
  vereinsevent: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  probe: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  auffuehrung: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  sonstiges: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
}

const typLabels: Record<VeranstaltungTyp, string> = {
  vereinsevent: 'Vereinsevent',
  probe: 'Probe',
  auffuehrung: 'Aufführung',
  sonstiges: 'Sonstiges',
}

export function EventKalender({
  veranstaltungen,
  basePath = '/veranstaltungen',
  title = 'Kommende Veranstaltungen',
}: EventKalenderProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [filterTyp, setFilterTyp] = useState<VeranstaltungTyp | 'all'>('all')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Filter and group events by date
  const filteredEvents = useMemo(() => {
    if (filterTyp === 'all') return veranstaltungen
    return veranstaltungen.filter((v) => v.typ === filterTyp)
  }, [veranstaltungen, filterTyp])

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Veranstaltung[]> = {}
    filteredEvents.forEach((v) => {
      if (!grouped[v.datum]) grouped[v.datum] = []
      grouped[v.datum].push(v)
    })
    return grouped
  }, [filteredEvents])

  // Get the first and last day of the month
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // Get the starting day of the week (0 = Monday in our calendar)
  const startDay = (firstDayOfMonth.getDay() + 6) % 7

  // Get total days in month
  const daysInMonth = lastDayOfMonth.getDate()

  // Generate calendar days for month view
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Week view: get current week's days
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate)
    const first = curr.getDate() - ((curr.getDay() + 6) % 7)
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i))
      days.push(new Date(day))
    }
    return days
  }, [currentDate])

  const monthNames = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ]

  const weekDayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  const goToPrev = () => {
    if (view === 'month') {
      setCurrentDate(new Date(year, month - 1, 1))
    } else {
      const prev = new Date(currentDate)
      prev.setDate(prev.getDate() - 7)
      setCurrentDate(prev)
    }
  }

  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(year, month + 1, 1))
    } else {
      const next = new Date(currentDate)
      next.setDate(next.getDate() + 7)
      setCurrentDate(next)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDateKey = (date: Date | number): string => {
    if (typeof date === 'number') {
      const m = (month + 1).toString().padStart(2, '0')
      const d = date.toString().padStart(2, '0')
      return `${year}-${m}-${d}`
    }
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const today = new Date()
  const todayKey = formatDateKey(today)

  const getWeekNumber = (date: Date): number => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    )
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  // Export handlers
  const handlePrint = () => {
    window.print()
  }

  const handleICalExport = () => {
    const events = filteredEvents.filter((v) => v.status !== 'abgesagt')
    let ical =
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BackstagePass//TGW//DE\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n'

    events.forEach((event) => {
      const startDate = event.datum.replace(/-/g, '')
      const startTime = event.startzeit
        ? event.startzeit.replace(/:/g, '')
        : '000000'
      const endTime = event.endzeit ? event.endzeit.replace(/:/g, '') : '235959'
      const uid = `${event.id}@backstagepass.tgw`

      ical += 'BEGIN:VEVENT\r\n'
      ical += `UID:${uid}\r\n`
      ical += `DTSTART:${startDate}T${startTime}\r\n`
      ical += `DTEND:${startDate}T${endTime}\r\n`
      ical += `SUMMARY:${event.titel}\r\n`
      if (event.beschreibung) {
        ical += `DESCRIPTION:${event.beschreibung.replace(/\n/g, '\\n')}\r\n`
      }
      if (event.ort) {
        ical += `LOCATION:${event.ort}\r\n`
      }
      ical += 'END:VEVENT\r\n'
    })

    ical += 'END:VCALENDAR\r\n'

    const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `veranstaltungen-${new Date().toISOString().split('T')[0]}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg bg-white shadow print:shadow-none">
      {/* Calendar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrev}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
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
          <h2 className="text-lg font-semibold text-gray-900">
            {view === 'month'
              ? `${monthNames[month]} ${year}`
              : `KW ${getWeekNumber(currentDate)}, ${year}`}
          </h2>
          <button
            onClick={goToNext}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
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

        <div className="flex items-center gap-2">
          <select
            value={filterTyp}
            onChange={(e) =>
              setFilterTyp(e.target.value as VeranstaltungTyp | 'all')
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle Typen</option>
            {Object.entries(typLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <div className="flex overflow-hidden rounded-lg border border-gray-300">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Monat
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Woche
            </button>
          </div>

          <button
            onClick={goToToday}
            className="rounded-lg px-3 py-1.5 text-sm text-blue-600 transition-colors hover:bg-blue-50"
          >
            Heute
          </button>

          <div className="mx-2 h-6 border-l border-gray-200" />

          <button
            onClick={handleICalExport}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            title="Als iCal exportieren"
          >
            iCal
          </button>

          <button
            onClick={handlePrint}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            title="Drucken"
          >
            PDF
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden border-b p-4 print:block">
        <h2 className="text-xl font-semibold">
          {view === 'month'
            ? `${monthNames[month]} ${year}`
            : `KW ${getWeekNumber(currentDate)}, ${year}`}
        </h2>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {view === 'month' ? (
          <>
            {/* Week Day Headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {weekDayNames.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-24 rounded-lg bg-gray-50 print:min-h-16"
                    />
                  )
                }

                const dateKey = formatDateKey(day)
                const dayEvents = eventsByDate[dateKey] || []
                const isToday = dateKey === todayKey

                return (
                  <div
                    key={dateKey}
                    className={`min-h-24 rounded-lg border p-2 print:min-h-16 print:text-xs ${
                      isToday
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`mb-1 text-sm font-medium ${
                        isToday ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </div>

                    {dayEvents.length > 0 && (
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((v) => (
                          <Link
                            key={v.id}
                            href={`${basePath}/${v.id}` as never}
                            className={`block truncate rounded p-1 text-xs ${typColors[v.typ] || typColors.sonstiges}`}
                            title={v.titel}
                          >
                            {v.startzeit && (
                              <span className="opacity-75">
                                {v.startzeit.slice(0, 5)}{' '}
                              </span>
                            )}
                            {v.titel}
                          </Link>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{dayEvents.length - 2} weitere
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* Week View */
          <div className="space-y-2">
            {weekDays.map((day) => {
              const dateKey = formatDateKey(day)
              const dayEvents = eventsByDate[dateKey] || []
              const isToday = dateKey === todayKey

              return (
                <div
                  key={dateKey}
                  className={`rounded-lg border p-3 ${
                    isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}
                    >
                      {weekDayNames[(day.getDay() + 6) % 7]}
                    </span>
                    <span className="text-gray-500">
                      {day.toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  </div>

                  {dayEvents.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      Keine Veranstaltungen
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dayEvents.map((v) => (
                        <Link
                          key={v.id}
                          href={`${basePath}/${v.id}` as never}
                          className={`block rounded p-2 ${typColors[v.typ] || typColors.sonstiges}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{v.titel}</span>
                            <StatusBadge status={v.status} />
                          </div>
                          <div className="mt-1 text-sm opacity-75">
                            {v.startzeit && `${v.startzeit.slice(0, 5)}`}
                            {v.startzeit && v.endzeit && ' - '}
                            {v.endzeit && `${v.endzeit.slice(0, 5)}`}
                            {v.ort && ` • ${v.ort}`}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upcoming List */}
      <div className="border-t p-4">
        <h3 className="mb-3 font-medium text-gray-900">{title}</h3>
        <div className="space-y-2">
          {filteredEvents
            .filter((v) => v.datum >= todayKey && v.status !== 'abgesagt')
            .slice(0, 5)
            .map((v) => (
              <Link
                key={v.id}
                href={`${basePath}/${v.id}` as never}
                className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50"
              >
                <div>
                  <span
                    className={`mr-2 inline-block h-2 w-2 rounded-full ${
                      v.typ === 'vereinsevent'
                        ? 'bg-blue-500'
                        : v.typ === 'probe'
                          ? 'bg-amber-500'
                          : v.typ === 'auffuehrung'
                            ? 'bg-purple-500'
                            : 'bg-gray-500'
                    }`}
                  />
                  <span className="font-medium text-gray-900">{v.titel}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {new Date(v.datum).toLocaleDateString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                    {v.startzeit && ` ${v.startzeit.slice(0, 5)}`}
                  </span>
                </div>
                <StatusBadge status={v.status} />
              </Link>
            ))}
          {filteredEvents.filter(
            (v) => v.datum >= todayKey && v.status !== 'abgesagt'
          ).length === 0 && (
            <p className="text-sm text-gray-500">
              Keine kommenden Veranstaltungen
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
