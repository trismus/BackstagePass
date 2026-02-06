'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
  type FocusEvent,
} from 'react'

// =============================================================================
// Types
// =============================================================================

export interface DateInputProps {
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
  /** Disable the input */
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

function formatISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return ''
  const date = parseDate(dateStr)
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

function parseGermanDate(input: string): Date | null {
  // Try DD.MM.YYYY format
  const germanFormat = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (germanFormat) {
    const [, day, month, year] = germanFormat
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) return date
  }

  // Try DD.MM.YY format
  const shortFormat = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/)
  if (shortFormat) {
    const [, day, month, shortYear] = shortFormat
    const year = parseInt(shortYear) + (parseInt(shortYear) > 50 ? 1900 : 2000)
    const date = new Date(year, parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) return date
  }

  // Try ISO format YYYY-MM-DD
  const isoFormat = input.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoFormat) {
    const [, year, month, day] = isoFormat
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) return date
  }

  return null
}

function isDateDisabled(date: Date, minDate?: string, maxDate?: string): boolean {
  const min = parseDate(minDate)
  const max = parseDate(maxDate)

  if (min) {
    min.setHours(0, 0, 0, 0)
    if (date < min) return true
  }
  if (max) {
    max.setHours(23, 59, 59, 999)
    if (date > max) return true
  }

  return false
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}

function getMonthData(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startDayOfWeek = firstDay.getDay() - 1
  if (startDayOfWeek < 0) startDayOfWeek = 6

  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  // Add days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    currentWeek.push(new Date(year, month, -i))
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

  return weeks
}

// =============================================================================
// DateInput Component
// =============================================================================

export function DateInput({
  value,
  onChange,
  placeholder = 'TT.MM.JJJJ',
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
}: DateInputProps) {
  const [inputValue, setInputValue] = useState(() => formatDisplayDate(value))
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    const date = parseDate(value) || new Date()
    return date.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const date = parseDate(value) || new Date()
    return date.getMonth()
  })
  const [inputError, setInputError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = id || name

  const weeks = getMonthData(viewYear, viewMonth)
  const today = new Date()
  const selectedDate = parseDate(value)

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(formatDisplayDate(value))
    if (value) {
      const date = parseDate(value)
      if (date) {
        setViewYear(date.getFullYear())
        setViewMonth(date.getMonth())
      }
    }
  }, [value])

  // Close calendar on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setInputError(null)
  }

  const handleInputBlur = (_e: FocusEvent<HTMLInputElement>) => {
    if (!inputValue) {
      onChange?.(undefined)
      setInputError(null)
      return
    }

    const date = parseGermanDate(inputValue)
    if (date) {
      if (isDateDisabled(date, minDate, maxDate)) {
        setInputError('Datum ausserhalb des erlaubten Bereichs')
        return
      }
      const isoDate = formatISODate(date)
      onChange?.(isoDate)
      setInputValue(formatDisplayDate(isoDate))
      setInputError(null)
    } else {
      setInputError('Ungueltiges Datumsformat')
    }
  }

  const handleCalendarSelect = useCallback(
    (date: Date) => {
      const isoDate = formatISODate(date)
      onChange?.(isoDate)
      setInputValue(formatDisplayDate(isoDate))
      setIsCalendarOpen(false)
      setInputError(null)
      inputRef.current?.focus()
    },
    [onChange]
  )

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

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsCalendarOpen(false)
    } else if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault()
      setIsCalendarOpen(true)
    }
  }

  const handleClear = () => {
    onChange?.(undefined)
    setInputValue('')
    setInputError(null)
    inputRef.current?.focus()
  }

  const displayError = error || inputError

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
          ref={inputRef}
          type="text"
          id={inputId}
          name={name}
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className={`
            block w-full rounded-md border py-2 pl-3 pr-20 text-neutral-900
            placeholder-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500
            ${displayError
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
              : 'border-neutral-300 focus:border-black focus:ring-black'
            }
          `}
          aria-invalid={displayError ? 'true' : 'false'}
          aria-describedby={
            displayError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
        />

        {/* Buttons: Clear + Calendar Toggle */}
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Datum loeschen"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsCalendarOpen(!isCalendarOpen)}
            disabled={disabled}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
            aria-label="Kalender oeffnen"
            aria-expanded={isCalendarOpen}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error / Helper Text */}
      {displayError && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-error-600">
          {displayError}
        </p>
      )}
      {helperText && !displayError && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-neutral-500">
          {helperText}
        </p>
      )}

      {/* Calendar Popup */}
      {isCalendarOpen && (
        <div className="absolute z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
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
              <div key={day} className="py-1 text-center text-xs font-medium text-gray-500">
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
              const isDisabled = isDateDisabled(date, minDate, maxDate)

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !isDisabled && handleCalendarSelect(date)}
                  disabled={isDisabled}
                  className={`
                    rounded p-2 text-center text-sm transition-colors
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isCurrentMonth && !isSelected && !isDisabled ? 'text-gray-900 hover:bg-gray-100' : ''}
                    ${isSelected ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}
                    ${isToday && !isSelected ? 'font-semibold text-primary-600' : ''}
                    ${isDisabled ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer'}
                  `}
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
                if (!isDateDisabled(today, minDate, maxDate)) {
                  handleCalendarSelect(today)
                }
              }}
              disabled={isDateDisabled(today, minDate, maxDate)}
              className="w-full rounded py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Heute
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
