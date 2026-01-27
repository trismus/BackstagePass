'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Veranstaltung } from '@/lib/supabase/types'
import { StatusBadge } from '@/components/veranstaltungen/StatusBadge'

interface AuffuehrungKalenderProps {
  auffuehrungen: Veranstaltung[]
}

export function AuffuehrungKalender({ auffuehrungen }: AuffuehrungKalenderProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get the first and last day of the month
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // Get the starting day of the week (0 = Monday in our calendar)
  const startDay = (firstDayOfMonth.getDay() + 6) % 7 // Convert to Monday = 0

  // Get total days in month
  const daysInMonth = lastDayOfMonth.getDate()

  // Group auffuehrungen by date
  const auffuehrungenByDate = useMemo(() => {
    const grouped: Record<string, Veranstaltung[]> = {}
    auffuehrungen.forEach((a) => {
      if (!grouped[a.datum]) grouped[a.datum] = []
      grouped[a.datum].push(a)
    })
    return grouped
  }, [auffuehrungen])

  // Generate calendar days
  const calendarDays: (number | null)[] = []
  // Add empty days for the start of the month
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null)
  }
  // Add the days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ]

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDateKey = (day: number): string => {
    const m = (month + 1).toString().padStart(2, '0')
    const d = day.toString().padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Calendar Header */}
      <div className="px-4 py-3 border-b flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Heute
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-24 bg-gray-50 rounded-lg" />
            }

            const dateKey = formatDateKey(day)
            const dayAuffuehrungen = auffuehrungenByDate[dateKey] || []
            const isToday = dateKey === todayKey

            return (
              <div
                key={dateKey}
                className={`min-h-24 p-2 rounded-lg border ${
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

                {dayAuffuehrungen.length > 0 && (
                  <div className="space-y-1">
                    {dayAuffuehrungen.slice(0, 2).map((a) => (
                      <Link
                        key={a.id}
                        href={`/auffuehrungen/${a.id}`}
                        className="block p-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 truncate"
                        title={a.titel}
                      >
                        {a.startzeit && (
                          <span className="text-purple-600">
                            {a.startzeit.slice(0, 5)}{' '}
                          </span>
                        )}
                        {a.titel}
                      </Link>
                    ))}
                    {dayAuffuehrungen.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{dayAuffuehrungen.length - 2} weitere
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming List */}
      <div className="border-t p-4">
        <h3 className="font-medium text-gray-900 mb-3">Kommende Aufführungen</h3>
        <div className="space-y-2">
          {auffuehrungen
            .filter((a) => a.datum >= todayKey && a.status !== 'abgesagt')
            .slice(0, 5)
            .map((a) => (
              <Link
                key={a.id}
                href={`/auffuehrungen/${a.id}`}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium text-gray-900">{a.titel}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(a.datum).toLocaleDateString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                    {a.startzeit && ` ${a.startzeit.slice(0, 5)}`}
                  </span>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          {auffuehrungen.filter((a) => a.datum >= todayKey && a.status !== 'abgesagt').length === 0 && (
            <p className="text-gray-500 text-sm">Keine kommenden Aufführungen</p>
          )}
        </div>
      </div>
    </div>
  )
}
