'use client'

import { DatePicker } from './DatePicker'
import { TimePicker } from './TimePicker'

// =============================================================================
// Types
// =============================================================================

export interface DateTimePickerProps {
  /** Selected date (YYYY-MM-DD format) */
  date?: string
  /** Selected time (HH:MM format) */
  time?: string
  /** Callback when date or time changes */
  onChange?: (value: { date: string | undefined; time: string | undefined }) => void
  /** Labels */
  dateLabel?: string
  timeLabel?: string
  /** Error message */
  error?: string
  /** Disable the picker */
  disabled?: boolean
  /** Time step interval in minutes */
  step?: number
  /** Additional class names */
  className?: string
}

// =============================================================================
// DateTimePicker Component
// =============================================================================

export function DateTimePicker({
  date,
  time,
  onChange,
  dateLabel = 'Datum',
  timeLabel = 'Zeit',
  error,
  disabled = false,
  step = 15,
  className = '',
}: DateTimePickerProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end ${className}`}>
      <DatePicker
        value={date}
        onChange={(newDate: string | undefined) => onChange?.({ date: newDate, time })}
        label={dateLabel}
        disabled={disabled}
        error={error}
      />

      <TimePicker
        value={time}
        onChange={(newTime: string | undefined) => onChange?.({ date, time: newTime })}
        label={timeLabel}
        disabled={disabled}
        step={step}
      />
    </div>
  )
}
