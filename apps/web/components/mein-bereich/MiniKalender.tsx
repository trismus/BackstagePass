'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface KalenderTermin {
  id: string
  datum: string
  titel: string
  typ: 'veranstaltung' | 'helfereinsatz' | 'probe' | 'sonstiges'
  href: string
}

interface MiniKalenderProps {
  termine: KalenderTermin[]
  onDateSelect?: (date: Date) => void
}

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

const TYP_FARBEN: Record<KalenderTermin['typ'], string> = {
  veranstaltung: 'bg-blue-500',
  helfereinsatz: 'bg-amber-500',
  probe: 'bg-purple-500',
  sonstiges: 'bg-neutral-400',
}

export function MiniKalender({ termine, onDateSelect }: MiniKalenderProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Create a map of dates to events for quick lookup
  const termineByDate = useMemo(() => {
    const map = new Map<string, KalenderTermin[]>()
    termine.forEach((t) => {
      const key = t.datum
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(t)
    })
    return map
  }, [termine])

  // Get calendar days for current month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // First day of month (0 = Sunday, we want Monday = 0)
    const firstDay = new Date(year, month, 1)
    const startOffset = (firstDay.getDay() + 6) % 7 // Convert to Monday-based

    // Last day of month
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Build array of days
    const days: (Date | null)[] = []

    // Add empty slots for days before first of month
    for (let i = 0; i < startOffset; i++) {
      days.push(null)
    }

    // Add days of month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d))
    }

    // Pad to complete last week
    while (days.length % 7 !== 0) {
      days.push(null)
    }

    return days
  }, [currentMonth])

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
    const today = new Date()
    setSelectedDate(today)
    onDateSelect?.(today)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  // Get events for selected date
  const selectedDateTermine = selectedDate
    ? termineByDate.get(formatDateKey(selectedDate)) || []
    : []

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 py-3">
        <button
          onClick={goToPrevMonth}
          className="rounded p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
          aria-label="Vorheriger Monat"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">
            {MONATE[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={goToToday}
            className="rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-300"
          >
            Heute
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="rounded p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
          aria-label="Nächster Monat"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-3">
        {/* Weekday Headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WOCHENTAGE.map((tag) => (
            <div key={tag} className="text-center text-xs font-medium text-neutral-500">
              {tag}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }

            const dateKey = formatDateKey(date)
            const dayTermine = termineByDate.get(dateKey) || []
            const hasEvents = dayTermine.length > 0
            const today = isToday(date)
            const selected = isSelected(date)

            return (
              <button
                key={dateKey}
                onClick={() => handleDateClick(date)}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors
                  ${today ? 'font-bold' : ''}
                  ${selected ? 'bg-blue-500 text-white' : today ? 'bg-blue-100 text-blue-900' : 'hover:bg-neutral-100'}
                `}
              >
                {date.getDate()}
                {hasEvents && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {dayTermine.slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className={`h-1 w-1 rounded-full ${selected ? 'bg-white' : TYP_FARBEN[t.typ]}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="border-t border-neutral-100 px-3 pb-3">
          <p className="py-2 text-xs font-medium text-neutral-500">
            {selectedDate.toLocaleDateString('de-CH', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          {selectedDateTermine.length > 0 ? (
            <div className="space-y-1">
              {selectedDateTermine.map((t) => (
                <Link
                  key={t.id}
                  href={t.href as never}
                  className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-neutral-50"
                >
                  <span className={`h-2 w-2 rounded-full ${TYP_FARBEN[t.typ]}`} />
                  <span className="flex-1 truncate text-neutral-700">{t.titel}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">Keine Termine</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="border-t border-neutral-100 bg-neutral-50 px-3 py-2">
        <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Veranstaltung
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Helfereinsatz
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500" /> Probe
          </span>
        </div>
      </div>
    </div>
  )
}

export type { KalenderTermin, MiniKalenderProps }
