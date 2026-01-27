'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { generateBreadcrumbs } from '@/lib/navigation'

// =============================================================================
// Types
// =============================================================================

interface BreadcrumbProps {
  /** Optional custom breadcrumbs override */
  items?: { label: string; href: string }[]
  /** Optional className */
  className?: string
}

// =============================================================================
// Breadcrumb Component
// =============================================================================

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname()

  // Use custom items or generate from pathname
  const breadcrumbs = items ?? generateBreadcrumbs(pathname)

  // Don't render if no breadcrumbs or only one item
  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav
      className={`flex items-center text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronIcon className="h-4 w-4 text-neutral-400" />
              )}
              {isLast ? (
                <span className="font-medium text-neutral-900">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href as never}
                  className="text-neutral-500 transition-colors hover:text-neutral-700"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// =============================================================================
// Chevron Icon
// =============================================================================

function ChevronIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  )
}

// =============================================================================
// Export
// =============================================================================

export type { BreadcrumbProps }
