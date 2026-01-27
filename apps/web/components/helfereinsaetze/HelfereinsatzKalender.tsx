'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Helfereinsatz, Partner } from '@/lib/supabase/types'

interface HelfereinsatzKalenderProps {
  helfereinsaetze: (Helfereinsatz & { partner: Pick<Partner, 'id' | 'name'> | null })[]
}

const statusColors: Record<string, string> = {
  offen: 'bg-yellow-100 text-yellow-800',
  bestaetigt: 'bg-green-100 text-green-800',
  abgeschlossen: 'bg-gray-100 text-gray-800',
  abgesagt: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  offen: 'Offen',
  bestaetigt: 'Bestätigt',
  abgeschlossen: 'Abgeschlossen',
  abgesagt: 'Abgesagt',
}

export function HelfereinsatzKalender({ helfereinsaetze }: HelfereinsatzKalenderProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, typeof helfereinsaetze> = {}
    helfereinsaetze.forEach((h) => {
      if (!grouped[h.datum]) grouped[h.datum] = []
      grouped[h.datum].push(h)
    })
    return grouped
  }, [helfereinsaetze])

  // Get the first and last day of the month
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // Get the starting day of the week (0 = Monday)
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
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
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
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  // Export handlers
  const handlePrint = () => {
    window.print()
  }

  const handleICalExport = () => {
    const events = helfereinsaetze.filter(h => h.status !== 'abgesagt')
    let ical = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BackstagePass//TGW Helfereinsaetze//DE\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n'

    events.forEach((event) => {
      const startDate = event.datum.replace(/-/g, '')
      const startTime = event.startzeit ? event.startzeit.replace(/:/g, '') : '000000'
      const endTime = event.endzeit ? event.endzeit.replace(/:/g, '') : '235959'
      const uid = `helfereinsatz-${event.id}@backstagepass.tgw`

      ical += 'BEGIN:VEVENT\r\n'
      ical += `UID:${uid}\r\n`
      ical += `DTSTART:${startDate}T${startTime}\r\n`
      ical += `DTEND:${startDate}T${endTime}\r\n`
      ical += `SUMMARY:${event.titel}${event.partner ? ` (${event.partner.name})` : ''}\r\n`
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
    a.download = `helfereinsaetze-${new Date().toISOString().split('T')[0]}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white shadow rounded-lg print:shadow-none">
      {/* Calendar Header */}
      <div className="px-4 py-3 border-b flex flex-wrap justify-between items-center gap-2 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrev}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {view === 'month'
              ? `${monthNames[month]} ${year}`
              : `KW ${getWeekNumber(currentDate)}, ${year}`}
          </h2>
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
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
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Heute
          </button>

          <div className="border-l border-gray-200 h-6 mx-2" />

          <button
            onClick={handleICalExport}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            title="Als iCal exportieren"
          >
            iCal
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            title="Drucken"
          >
            PDF
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block p-4 border-b">
        <h2 className="text-xl font-semibold">
          Helfereinsätze - {view === 'month'
            ? `${monthNames[month]} ${year}`
            : `KW ${getWeekNumber(currentDate)}, ${year}`}
        </h2>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {view === 'month' ? (
          <>
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDayNames.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="min-h-24 bg-gray-50 rounded-lg print:min-h-16" />
                }

                const dateKey = formatDateKey(day)
                const dayEvents = eventsByDate[dateKey] || []
                const isToday = dateKey === todayKey

                return (
                  <div
                    key={dateKey}
                    className={`min-h-24 p-2 rounded-lg border print:min-h-16 print:text-xs ${
                      isToday
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </div>

                    {dayEvents.length > 0 && (
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((h) => (
                          <Link
                            key={h.id}
                            href={`/helfereinsaetze/${h.id}`}
                            className="block p-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 truncate"
                            title={h.titel}
                          >
                            {h.startzeit && (
                              <span className="text-orange-600">
                                {h.startzeit.slice(0, 5)}{' '}
                              </span>
                            )}
                            {h.titel}
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
                  className={`p-3 rounded-lg border ${
                    isToday
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {weekDayNames[(day.getDay() + 6) % 7]}
                    </span>
                    <span className="text-gray-500">
                      {day.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>

                  {dayEvents.length === 0 ? (
                    <p className="text-sm text-gray-400">Keine Helfereinsätze</p>
                  ) : (
                    <div className="space-y-2">
                      {dayEvents.map((h) => (
                        <Link
                          key={h.id}
                          href={`/helfereinsaetze/${h.id}`}
                          className="block p-2 rounded bg-orange-50 hover:bg-orange-100"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{h.titel}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[h.status]}`}>
                              {statusLabels[h.status]}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {h.startzeit && `${h.startzeit.slice(0, 5)}`}
                            {h.startzeit && h.endzeit && ' - '}
                            {h.endzeit && `${h.endzeit.slice(0, 5)}`}
                            {h.partner && ` • ${h.partner.name}`}
                            {h.ort && ` • ${h.ort}`}
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
        <h3 className="font-medium text-gray-900 mb-3">Kommende Helfereinsätze</h3>
        <div className="space-y-2">
          {helfereinsaetze
            .filter((h) => h.datum >= todayKey && h.status !== 'abgesagt')
            .slice(0, 5)
            .map((h) => (
              <Link
                key={h.id}
                href={`/helfereinsaetze/${h.id}`}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="inline-block w-2 h-2 rounded-full mr-2 bg-orange-500" />
                  <span className="font-medium text-gray-900">{h.titel}</span>
                  {h.partner && (
                    <span className="text-sm text-gray-500 ml-1">({h.partner.name})</span>
                  )}
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(h.datum).toLocaleDateString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                    {h.startzeit && ` ${h.startzeit.slice(0, 5)}`}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[h.status]}`}>
                  {statusLabels[h.status]}
                </span>
              </Link>
            ))}
          {helfereinsaetze.filter((h) => h.datum >= todayKey && h.status !== 'abgesagt').length === 0 && (
            <p className="text-gray-500 text-sm">Keine kommenden Helfereinsätze</p>
          )}
        </div>
      </div>
    </div>
  )
}
