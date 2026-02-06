'use client'

import { useMemo, type HTMLAttributes } from 'react'

// =============================================================================
// Types
// =============================================================================

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Current page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Number of visible page numbers (default: 5) */
  visiblePages?: number
  /** Show first/last page buttons */
  showFirstLast?: boolean
  /** Show previous/next buttons */
  showPrevNext?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

export interface ItemsPerPageProps {
  /** Current items per page */
  value: number
  /** Available options */
  options?: number[]
  /** Callback when value changes */
  onChange: (value: number) => void
  /** Label text */
  label?: string
  /** Disabled state */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

// =============================================================================
// Helper Functions
// =============================================================================

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  visiblePages: number
): (number | 'ellipsis')[] {
  if (totalPages <= visiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []
  const sidePages = Math.floor((visiblePages - 3) / 2) // Pages on each side of current

  // Always show first page
  pages.push(1)

  // Calculate start and end of middle section
  let startPage = Math.max(2, currentPage - sidePages)
  let endPage = Math.min(totalPages - 1, currentPage + sidePages)

  // Adjust if too close to start
  if (currentPage <= sidePages + 2) {
    endPage = Math.min(totalPages - 1, visiblePages - 2)
  }

  // Adjust if too close to end
  if (currentPage >= totalPages - sidePages - 1) {
    startPage = Math.max(2, totalPages - visiblePages + 3)
  }

  // Add ellipsis before middle section
  if (startPage > 2) {
    pages.push('ellipsis')
  }

  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  // Add ellipsis after middle section
  if (endPage < totalPages - 1) {
    pages.push('ellipsis')
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}

// =============================================================================
// Pagination Component
// =============================================================================

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  visiblePages = 5,
  showFirstLast = false,
  showPrevNext = true,
  disabled = false,
  className = '',
  ...props
}: PaginationProps) {
  const pages = useMemo(
    () => generatePageNumbers(currentPage, totalPages, visiblePages),
    [currentPage, totalPages, visiblePages]
  )

  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  if (totalPages <= 1) {
    return null
  }

  const buttonBase = `
    inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium
    transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
  `

  const buttonStyles = {
    default: `
      ${buttonBase}
      text-neutral-700 hover:bg-neutral-100
      disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent
    `,
    active: `
      ${buttonBase}
      bg-primary-600 text-white hover:bg-primary-700
    `,
  }

  return (
    <nav
      className={`flex items-center justify-center gap-1 ${className}`}
      aria-label="Seitennavigation"
      {...props}
    >
      {/* First Page Button */}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={disabled || !canGoPrev}
          className={buttonStyles.default}
          aria-label="Erste Seite"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Previous Button */}
      {showPrevNext && (
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || !canGoPrev}
          className={buttonStyles.default}
          aria-label="Vorherige Seite"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Page Numbers */}
      {pages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-neutral-400"
              aria-hidden="true"
            >
              ...
            </span>
          )
        }

        const isActive = page === currentPage

        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            disabled={disabled}
            className={isActive ? buttonStyles.active : buttonStyles.default}
            aria-label={`Seite ${page}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        )
      })}

      {/* Next Button */}
      {showPrevNext && (
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || !canGoNext}
          className={buttonStyles.default}
          aria-label="Naechste Seite"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Last Page Button */}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || !canGoNext}
          className={buttonStyles.default}
          aria-label="Letzte Seite"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </nav>
  )
}

// =============================================================================
// ItemsPerPage Component
// =============================================================================

export function ItemsPerPage({
  value,
  options = [10, 25, 50, 100],
  onChange,
  label = 'Eintraege pro Seite',
  disabled = false,
  className = '',
}: ItemsPerPageProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm text-neutral-600">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-neutral-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

// =============================================================================
// PaginationInfo Component
// =============================================================================

export interface PaginationInfoProps {
  /** Current page (1-indexed) */
  currentPage: number
  /** Items per page */
  itemsPerPage: number
  /** Total number of items */
  totalItems: number
  /** Additional class names */
  className?: string
}

export function PaginationInfo({
  currentPage,
  itemsPerPage,
  totalItems,
  className = '',
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  if (totalItems === 0) {
    return (
      <p className={`text-sm text-neutral-500 ${className}`}>
        Keine Eintraege
      </p>
    )
  }

  return (
    <p className={`text-sm text-neutral-500 ${className}`}>
      Zeige {startItem}–{endItem} von {totalItems} Eintraegen
    </p>
  )
}
