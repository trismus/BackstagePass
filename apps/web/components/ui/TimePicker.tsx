'use client'

import { useState, useCallback, useRef, useEffect, useMemo, type KeyboardEvent } from 'react'

// =============================================================================
// Types
// =============================================================================

export interface TimePickerProps {
  /** Selected time (HH:MM format) */
  value?: string
  /** Callback when time changes */
  onChange?: (time: string | undefined) => void
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
  /** Minimum selectable time (HH:MM) */
  minTime?: string
  /** Maximum selectable time (HH:MM) */
  maxTime?: string
  /** Step interval in minutes (default: 15) */
  step?: number
  /** Input ID */
  id?: string
  /** Input name */
  name?: string
  /** Required field */
  required?: boolean
  /** Additional class names */
  className?: string
}

export interface TimeRangePickerProps {
  /** Start time (HH:MM format) */
  startTime?: string
  /** End time (HH:MM format) */
  endTime?: string
  /** Callback when time range changes */
  onChange?: (range: { startTime: string | undefined; endTime: string | undefined }) => void
  /** Labels */
  startLabel?: string
  endLabel?: string
  /** Error message */
  error?: string
  /** Disable the picker */
  disabled?: boolean
  /** Minimum selectable time (HH:MM) */
  minTime?: string
  /** Maximum selectable time (HH:MM) */
  maxTime?: string
  /** Step interval in minutes (default: 15) */
  step?: number
  /** Additional class names */
  className?: string
}

// =============================================================================
// Helper Functions
// =============================================================================

function parseTime(timeStr?: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null
  const [hours, minutes] = timeStr.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return null
  return { hours, minutes }
}

function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function timeToMinutes(timeStr?: string): number {
  const time = parseTime(timeStr)
  if (!time) return 0
  return time.hours * 60 + time.minutes
}

function generateTimeOptions(
  step: number,
  minTime?: string,
  maxTime?: string
): string[] {
  const options: string[] = []
  const minMinutes = timeToMinutes(minTime) || 0
  const maxMinutes = timeToMinutes(maxTime) || 24 * 60 - 1

  for (let totalMinutes = 0; totalMinutes < 24 * 60; totalMinutes += step) {
    if (totalMinutes >= minMinutes && totalMinutes <= maxMinutes) {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      options.push(formatTime(hours, minutes))
    }
  }

  return options
}

// =============================================================================
// TimePicker Component
// =============================================================================

export function TimePicker({
  value,
  onChange,
  placeholder = 'Zeit auswaehlen',
  label,
  error,
  helperText,
  disabled = false,
  minTime,
  maxTime,
  step = 15,
  id,
  name,
  required = false,
  className = '',
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputId = id || name

  // Generate time options based on step
  const timeOptions = useMemo(
    () => generateTimeOptions(step, minTime, maxTime),
    [step, minTime, maxTime]
  )

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

  // Scroll to highlighted item
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  // Set initial highlighted index to current value when opening
  useEffect(() => {
    if (isOpen && value) {
      const index = timeOptions.indexOf(value)
      if (index >= 0) {
        setHighlightedIndex(index)
      }
    }
  }, [isOpen, value, timeOptions])

  const handleSelect = useCallback((time: string) => {
    onChange?.(time)
    setIsOpen(false)
  }, [onChange])

  const handleClear = () => {
    onChange?.(undefined)
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(timeOptions[highlightedIndex])
        } else {
          setIsOpen(true)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex((prev) =>
            prev < timeOptions.length - 1 ? prev + 1 : prev
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
      case 'Tab':
        setIsOpen(false)
        break
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
          value={value || ''}
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
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${inputId}-listbox`}
        />

        {/* Clock Icon / Clear Button */}
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
              aria-label="Zeit loeschen"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

      {/* Time Dropdown */}
      {isOpen && (
        <div
          id={`${inputId}-listbox`}
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-label="Zeitauswahl"
        >
          {timeOptions.map((time, index) => (
            <button
              key={time}
              type="button"
              onClick={() => handleSelect(time)}
              className={`
                w-full px-3 py-2 text-left text-sm transition-colors
                ${time === value ? 'bg-primary-100 font-medium text-primary-700' : 'text-gray-900'}
                ${index === highlightedIndex ? 'bg-gray-100' : ''}
                ${time !== value && index !== highlightedIndex ? 'hover:bg-gray-50' : ''}
              `}
              role="option"
              aria-selected={time === value}
            >
              {time}
            </button>
          ))}

          {timeOptions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Keine Zeiten verfuegbar
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// TimeRangePicker Component
// =============================================================================

export function TimeRangePicker({
  startTime,
  endTime,
  onChange,
  startLabel = 'Von',
  endLabel = 'Bis',
  error,
  disabled = false,
  minTime,
  maxTime,
  step = 15,
  className = '',
}: TimeRangePickerProps) {
  const handleStartChange = (time: string | undefined) => {
    onChange?.({ startTime: time, endTime })
  }

  const handleEndChange = (time: string | undefined) => {
    onChange?.({ startTime, endTime: time })
  }

  // End time should be after start time
  const effectiveMinEndTime = startTime || minTime

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end ${className}`}>
      <TimePicker
        value={startTime}
        onChange={handleStartChange}
        label={startLabel}
        disabled={disabled}
        minTime={minTime}
        maxTime={endTime || maxTime}
        step={step}
        error={error}
      />

      <span className="hidden text-gray-400 sm:block sm:pb-2">–</span>

      <TimePicker
        value={endTime}
        onChange={handleEndChange}
        label={endLabel}
        disabled={disabled}
        minTime={effectiveMinEndTime}
        maxTime={maxTime}
        step={step}
      />
    </div>
  )
}

