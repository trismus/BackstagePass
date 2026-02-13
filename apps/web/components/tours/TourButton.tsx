'use client'

/**
 * Tour Button Component
 * Button to start an interactive tour
 */

import { useCallback } from 'react'
import type { TourId } from '@/lib/tours'
import { useTour } from './TourProvider'

interface TourButtonProps {
  /** Tour ID to start */
  tourId: TourId
  /** Button label */
  label?: string
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Show icon */
  showIcon?: boolean
}

/**
 * Tour Button
 * Starts an interactive tour when clicked
 */
export function TourButton({
  tourId,
  label = 'Tour starten',
  variant = 'secondary',
  size = 'md',
  className = '',
  showIcon = true,
}: TourButtonProps) {
  const { startTour } = useTour()

  const handleClick = useCallback(() => {
    startTour(tourId)
  }, [tourId, startTour])

  const variantClasses = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary:
      'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 focus:ring-primary-500',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      )}
      {label}
    </button>
  )
}
