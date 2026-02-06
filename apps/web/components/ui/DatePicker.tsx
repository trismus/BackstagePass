'use client'

import { useState, useCallback, useMemo, useRef, useEffect, type KeyboardEvent } from 'react'

// =============================================================================
// Types
// =============================================================================

export interface DatePickerProps {
  /** Selected date (YYYY-MM-DD format) */
  value?: string
  /** Callback when date changes */
  onChange?: (date: string | undefined) => void
  /** Placeholder text */
  placeholder?: string
  /** Label for the input */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Disable the picker */
  disabled?: boolean
  /** Minimum selectable date (YYYY-MM-DD) */
  minDate?: string
  /** Maximum selectable date (YYYY-MM-DD) */
  maxDate?: string
  /** Input ID */
  id?: string
  /** Input name */
  name?: string
  /** Required field */
  required?: boolean
  /** Additional class names */
  className?: string
}

export interface DateRangePickerProps {
  /** Start date (YYYY-MM-DD format) */
  startDate?: string
  /** End date (YYYY-MM-DD format) */
  endDate?: string
  /** Callback when date range changes */
  onChange?: (range: { startDate: string | undefined; endDate: string | undefined }) => void
  /** Labels */
  startLabel?: string
  endLabel?: string
  /** Error message */
  error?: string
  /** Disable the picker */
  disabled?: boolean
  /** Minimum selectable date (YYYY-MM-DD) */
  minDate?: string
  /** Maximum selectable date (YYYY-MM-DD) */
  maxDate?: string
  /** Additional class names */
  className?: string
}

// =============================================================================
// Constants
// =============================================================================

const WEEKDAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS_DE = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

// =============================================================================
// Helper Functions
// =============================================================================

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return ''
  const date = parseDate(dateStr)
  if (!date) return ''
  return date.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getMonthData(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday = 0, Sunday = 6 (German week starts on Monday)
  let startDayOfWeek = firstDay.getDay() - 1
  if (startDayOfWeek < 0) startDayOfWeek = 6

  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  // Add days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    currentWeek.push(date)
  }

  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(new Date(year, month, day))
  }

  // Add days from next month
  while (currentWeek.length < 7) {
    const nextMonthDay = currentWeek.length - 6 + (lastDay.getDay() || 7)
    currentWeek.push(new Date(year, month + 1, nextMonthDay))
  }
  weeks.push(currentWeek)

  // Fill remaining weeks if needed (6 weeks total for consistent height)
  while (weeks.length < 6) {
    const lastWeek = weeks[weeks.length - 1]
    const lastDate = lastWeek[lastWeek.length - 1]
    const nextWeek: Date[] = []
    for (let i = 1; i <= 7; i++) {
      nextWeek.push(new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + i))
    }
    weeks.push(nextWeek)
  }

  return weeks
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}

function isDateDisabled(date: Date, minDate?: string, maxDate?: string): boolean {
  const min = parseDate(minDate)
  const max = parseDate(maxDate)

  if (min && date < min) return true
  if (max && date > max) return true

  return false
}

// =============================================================================
// Calendar Component (internal)
// =============================================================================

interface CalendarProps {
  selectedDate?: Date | null
  onSelect: (date: Date) => void
  minDate?: string
  maxDate?: string
  focusedDate: Date
  onFocusedDateChange: (date: Date) => void
}

function Calendar({
  selectedDate,
  onSelect,
  minDate,
  maxDate,
  focusedDate,
  onFocusedDateChange,
}: CalendarProps) {
  const [viewYear, setViewYear] = useState(focusedDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(focusedDate.getMonth())

  const weeks = useMemo(() => getMonthData(viewYear, viewMonth), [viewYear, viewMonth])
  const today = useMemo(() => new Date(), [])

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const newDate = new Date(focusedDate)

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        newDate.setDate(newDate.getDate() - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        newDate.setDate(newDate.getDate() + 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        newDate.setDate(newDate.getDate() - 7)
        break
      case 'ArrowDown':
        e.preventDefault()
        newDate.setDate(newDate.getDate() + 7)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!isDateDisabled(focusedDate, minDate, maxDate)) {
          onSelect(focusedDate)
        }
        return
      default:
        return
    }

    onFocusedDateChange(newDate)
    // Update view if new date is in different month
    if (newDate.getMonth() !== viewMonth || newDate.getFullYear() !== viewYear) {
      setViewMonth(newDate.getMonth())
      setViewYear(newDate.getFullYear())
    }
  }

  return (
    <div
      className="w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
      onKeyDown={handleKeyDown}
      role="grid"
      aria-label="Kalender"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="rounded p-1 hover:bg-gray-100"
          aria-label="Vorheriger Monat"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-semibold text-gray-900">
          {MONTHS_DE[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="rounded p-1 hover:bg-gray-100"
          aria-label="Naechster Monat"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS_DE.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, index) => {
          const isCurrentMonth = date.getMonth() === viewMonth
          const isSelected = selectedDate && isSameDay(date, selectedDate)
          const isToday = isSameDay(date, today)
          const isFocused = isSameDay(date, focusedDate)
          const isDisabled = isDateDisabled(date, minDate, maxDate)

          return (
            <button
              key={index}
              type="button"
              role="gridcell"
              onClick={() => !isDisabled && onSelect(date)}
              disabled={isDisabled}
              tabIndex={isFocused ? 0 : -1}
              className={`
                rounded p-2 text-center text-sm transition-colors
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isCurrentMonth && !isSelected && !isDisabled ? 'text-gray-900 hover:bg-gray-100' : ''}
                ${isSelected ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}
                ${isToday && !isSelected ? 'font-semibold text-primary-600' : ''}
                ${isFocused && !isSelected ? 'ring-2 ring-primary-500 ring-offset-1' : ''}
                ${isDisabled ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer'}
              `}
              aria-selected={isSelected || false}
              aria-disabled={isDisabled}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      {/* Today Button */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => {
            setViewMonth(today.getMonth())
            setViewYear(today.getFullYear())
            onFocusedDateChange(today)
          }}
          className="w-full rounded py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
        >
          Heute
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// DatePicker Component
// =============================================================================

export function DatePicker({
  value,
  onChange,
  placeholder = 'Datum auswaehlen',
  label,
  error,
  helperText,
  disabled = false,
  minDate,
  maxDate,
  id,
  name,
  required = false,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedDate, setFocusedDate] = useState(() => parseDate(value) || new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const inputId = id || name

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((date: Date) => {
    onChange?.(formatDate(date))
    setIsOpen(false)
  }, [onChange])

  const handleClear = () => {
    onChange?.(undefined)
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          {label}
          {required && <span className="ml-1 text-error-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          role="combobox"
          id={inputId}
          name={name}
          value={formatDisplayDate(value)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          required={required}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleInputKeyDown}
          className={`
            block w-full cursor-pointer rounded-md border py-2 pl-3 pr-10 text-neutral-900
            placeholder-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500
            ${error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
              : 'border-neutral-300 focus:border-black focus:ring-black'
            }
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={`${inputId}-calendar`}
        />

        {/* Calendar Icon / Clear Button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {value ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
              aria-label="Datum loeschen"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      </div>

      {/* Error / Helper Text */}
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-error-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-neutral-500">
          {helperText}
        </p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div id={`${inputId}-calendar`} className="absolute z-50 mt-1">
          <Calendar
            selectedDate={parseDate(value)}
            onSelect={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            focusedDate={focusedDate}
            onFocusedDateChange={setFocusedDate}
          />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// DateRangePicker Component
// =============================================================================

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  startLabel = 'Von',
  endLabel = 'Bis',
  error,
  disabled = false,
  minDate,
  maxDate,
  className = '',
}: DateRangePickerProps) {
  const handleStartChange = (date: string | undefined) => {
    onChange?.({ startDate: date, endDate })
  }

  const handleEndChange = (date: string | undefined) => {
    onChange?.({ startDate, endDate: date })
  }

  // End date cannot be before start date
  const effectiveMinEndDate = startDate || minDate

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end ${className}`}>
      <DatePicker
        value={startDate}
        onChange={handleStartChange}
        label={startLabel}
        disabled={disabled}
        minDate={minDate}
        maxDate={endDate || maxDate}
        error={error}
      />

      <span className="hidden text-gray-400 sm:block sm:pb-2">–</span>

      <DatePicker
        value={endDate}
        onChange={handleEndChange}
        label={endLabel}
        disabled={disabled}
        minDate={effectiveMinEndDate}
        maxDate={maxDate}
      />
    </div>
  )
}
