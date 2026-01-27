'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import type { UserRole } from '@/lib/supabase/types'
import { USER_ROLE_LABELS } from '@/lib/supabase/types'
import { MenuIcon } from './NavIcons'
import { Breadcrumb } from './Breadcrumb'

// =============================================================================
// Types
// =============================================================================

interface HeaderProps {
  /** User email for display */
  userEmail?: string
  /** User role for display */
  userRole?: UserRole
  /** User display name (optional) */
  displayName?: string | null
  /** Callback when mobile menu button is clicked */
  onMobileMenuClick?: () => void
  /** Show breadcrumbs */
  showBreadcrumb?: boolean
  /** Logout action */
  onLogout?: () => void
  /** Custom className */
  className?: string
}

// =============================================================================
// Profile Dropdown
// =============================================================================

function ProfileDropdown({
  userEmail,
  userRole,
  displayName,
  onLogout,
}: {
  userEmail?: string
  userRole?: UserRole
  displayName?: string | null
  onLogout?: () => void
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const displayText = displayName || userEmail || 'Benutzer'
  const roleLabel = userRole ? USER_ROLE_LABELS[userRole] : undefined

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
      >
        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-600">
          <span className="text-xs font-medium">
            {displayText.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Name (hidden on mobile) */}
        <span className="hidden sm:inline max-w-[150px] truncate">
          {displayText}
        </span>

        {/* Chevron */}
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg z-50">
          {/* User Info */}
          <div className="border-b border-neutral-200 px-4 py-3">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {displayText}
            </p>
            {userEmail && displayName && (
              <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
            )}
            {roleLabel && (
              <p className="mt-1 text-xs text-neutral-500">
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                  {roleLabel}
                </span>
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              onClick={() => setOpen(false)}
            >
              Profil bearbeiten
            </Link>
          </div>

          {/* Logout */}
          {onLogout && (
            <div className="border-t border-neutral-200 py-1">
              <button
                onClick={() => {
                  setOpen(false)
                  onLogout()
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Abmelden
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Header Component
// =============================================================================

export function Header({
  userEmail,
  userRole,
  displayName,
  onMobileMenuClick,
  showBreadcrumb = true,
  onLogout,
  className = '',
}: HeaderProps) {
  return (
    <header className={`border-b border-neutral-200 bg-white ${className}`}>
      {/* Main Header Row */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Side: Menu Button + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          {onMobileMenuClick && (
            <button
              onClick={onMobileMenuClick}
              className="lg:hidden rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Menü öffnen"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          )}

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
              BackstagePass
            </span>
          </Link>
        </div>

        {/* Right Side: Profile */}
        <ProfileDropdown
          userEmail={userEmail}
          userRole={userRole}
          displayName={displayName}
          onLogout={onLogout}
        />
      </div>

      {/* Breadcrumb Row (conditional) */}
      {showBreadcrumb && (
        <div className="border-t border-neutral-100 px-4 py-2">
          <Breadcrumb />
        </div>
      )}
    </header>
  )
}

// =============================================================================
// Export
// =============================================================================

export type { HeaderProps }
