'use client'

import { useState, type ReactNode, type HTMLAttributes } from 'react'

// =============================================================================
// Types
// =============================================================================

export type CalendarEventVariant = 'stage' | 'curtain' | 'info' | 'neutral' | 'success' | 'warning' | 'error'

export interface CalendarEventData {
  id: string
  title: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string
  variant?: CalendarEventVariant
  metadata?: Record<string, string | number | boolean>
}

export interface CalendarEventProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  event: CalendarEventData
  /** Display mode: compact shows minimal info, expanded shows full details */
  mode?: 'compact' | 'expanded'
  /** Show time in display */
  showTime?: boolean
  /** Show location in display */
  showLocation?: boolean
  /** Callback when event is clicked */
  onEventClick?: (event: CalendarEventData) => void
  /** Custom render for quick-info popover content */
  renderQuickInfo?: (event: CalendarEventData) => ReactNode
}

// =============================================================================
// Color Mapping
// =============================================================================

const variantColors: Record<CalendarEventVariant, {
  bg: string
  border: string
  text: string
  hoverBg: string
}> = {
  stage: {
    bg: 'bg-purple-100',
    border: 'border-purple-500',
    text: 'text-purple-800',
    hoverBg: 'hover:bg-purple-200',
  },
  curtain: {
    bg: 'bg-rose-100',
    border: 'border-rose-500',
    text: 'text-rose-800',
    hoverBg: 'hover:bg-rose-200',
  },
  info: {
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-800',
    hoverBg: 'hover:bg-blue-200',
  },
  neutral: {
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    text: 'text-gray-700',
    hoverBg: 'hover:bg-gray-200',
  },
  success: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-800',
    hoverBg: 'hover:bg-green-200',
  },
  warning: {
    bg: 'bg-amber-100',
    border: 'border-amber-500',
    text: 'text-amber-800',
    hoverBg: 'hover:bg-amber-200',
  },
  error: {
    bg: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-800',
    hoverBg: 'hover:bg-red-200',
  },
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
}

function formatTime(time?: string): string {
  if (!time) return ''
  return time.substring(0, 5) // HH:MM
}

function formatTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return ''
  const start = formatTime(startTime)
  if (!endTime) return start
  return `${start} - ${formatTime(endTime)}`
}

// =============================================================================
// QuickInfo Popover Component
// =============================================================================

interface QuickInfoPopoverProps {
  event: CalendarEventData
  children?: ReactNode
}

function QuickInfoPopover({ event, children }: QuickInfoPopoverProps) {
  const colors = variantColors[event.variant || 'neutral']

  return (
    <div className="absolute left-full top-0 z-50 ml-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <div className={`mb-2 text-sm font-semibold ${colors.text}`}>
        {event.title}
      </div>

      {children ? (
        children
      ) : (
        <dl className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <dt className="text-gray-500">Datum:</dt>
            <dd className="text-gray-900">{formatDate(event.date)}</dd>
          </div>

          {event.startTime && (
            <div className="flex items-center gap-2">
              <dt className="text-gray-500">Zeit:</dt>
              <dd className="text-gray-900">
                {formatTimeRange(event.startTime, event.endTime)}
              </dd>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-2">
              <dt className="text-gray-500">Ort:</dt>
              <dd className="text-gray-900">{event.location}</dd>
            </div>
          )}

          {event.description && (
            <div className="mt-2 border-t border-gray-100 pt-2">
              <dd className="text-gray-600 line-clamp-3">{event.description}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}

// =============================================================================
// CalendarEvent Component
// =============================================================================

export function CalendarEvent({
  event,
  mode = 'compact',
  showTime = true,
  showLocation = false,
  onEventClick,
  renderQuickInfo,
  className = '',
  ...props
}: CalendarEventProps) {
  const [showPopover, setShowPopover] = useState(false)

  const colors = variantColors[event.variant || 'neutral']

  const handleClick = () => {
    onEventClick?.(event)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  // Compact mode: minimal display
  if (mode === 'compact') {
    return (
      <div
        className={`
          relative cursor-pointer rounded border-l-4 px-2 py-1 text-xs transition-colors
          ${colors.bg} ${colors.border} ${colors.text} ${colors.hoverBg}
          ${className}
        `}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        role="button"
        tabIndex={0}
        aria-label={`Event: ${event.title}`}
        {...props}
      >
        <div className="truncate font-medium">{event.title}</div>

        {showTime && event.startTime && (
          <div className="truncate opacity-75">
            {formatTime(event.startTime)}
          </div>
        )}

        {/* Quick-Info Popover on Hover */}
        {showPopover && (
          <QuickInfoPopover event={event}>
            {renderQuickInfo?.(event)}
          </QuickInfoPopover>
        )}
      </div>
    )
  }

  // Expanded mode: full details
  return (
    <div
      className={`
        cursor-pointer rounded-lg border-l-4 p-3 transition-colors
        ${colors.bg} ${colors.border} ${colors.hoverBg}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Event: ${event.title}`}
      {...props}
    >
      <div className={`font-semibold ${colors.text}`}>
        {event.title}
      </div>

      <div className="mt-2 space-y-1 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(event.date)}</span>
        </div>

        {showTime && event.startTime && (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTimeRange(event.startTime, event.endTime)}</span>
          </div>
        )}

        {showLocation && event.location && (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
        )}

        {event.description && (
          <p className="mt-2 text-gray-500 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// CalendarEventList Component
// =============================================================================

export interface CalendarEventListProps {
  events: CalendarEventData[]
  mode?: 'compact' | 'expanded'
  emptyMessage?: string
  onEventClick?: (event: CalendarEventData) => void
}

export function CalendarEventList({
  events,
  mode = 'compact',
  emptyMessage = 'Keine Termine vorhanden',
  onEventClick,
}: CalendarEventListProps) {
  if (events.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`space-y-${mode === 'compact' ? '1' : '3'}`}>
      {events.map((event) => (
        <CalendarEvent
          key={event.id}
          event={event}
          mode={mode}
          onEventClick={onEventClick}
        />
      ))}
    </div>
  )
}
