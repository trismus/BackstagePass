'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/lib/supabase/types'
import type { NavSection } from '@/lib/navigation'
import {
  getFilteredNavigationForRole,
  generateBreadcrumbs,
} from '@/lib/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

// =============================================================================
// Types
// =============================================================================

interface AppLayoutProps {
  children: React.ReactNode
  /** User email for header display */
  userEmail?: string
  /** User role for navigation filtering */
  userRole: UserRole
  /** User display name (optional) */
  displayName?: string | null
  /** Logout action */
  onLogout?: () => void
  /** Custom sidebar sections (overrides role-based) */
  customSections?: NavSection[]
  /** Hide sidebar completely */
  hideSidebar?: boolean
  /** Hide breadcrumbs */
  hideBreadcrumb?: boolean
}

// =============================================================================
// AppLayout Component
// =============================================================================

export function AppLayout({
  children,
  userEmail,
  userRole,
  displayName,
  onLogout,
  customSections,
  hideSidebar = false,
  hideBreadcrumb = false,
}: AppLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get navigation config for role
  const navConfig = getFilteredNavigationForRole(userRole)
  const sections = customSections ?? navConfig.sidebar

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleMobileMenuClick = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  const handleCloseMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  // Check if we should show breadcrumbs (only when depth > 1)
  const breadcrumbs = generateBreadcrumbs(pathname)
  const showBreadcrumb = !hideBreadcrumb && breadcrumbs.length > 1

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      {!hideSidebar && <Sidebar sections={sections} />}

      {/* Mobile Sidebar Overlay */}
      {!hideSidebar && mobileMenuOpen && (
        <MobileSidebarOverlay
          sections={sections}
          onClose={handleCloseMobileMenu}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          userEmail={userEmail}
          userRole={userRole}
          displayName={displayName}
          onMobileMenuClick={hideSidebar ? undefined : handleMobileMenuClick}
          showBreadcrumb={showBreadcrumb}
          onLogout={onLogout}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

// =============================================================================
// Mobile Sidebar Overlay
// =============================================================================

import Link from 'next/link'
import { NavIconComponent, CloseIcon } from './NavIcons'

function MobileSidebarOverlay({
  sections,
  onClose,
}: {
  sections: NavSection[]
  onClose: () => void
}) {
  const pathname = usePathname()

  // Prevent scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
              BackstagePass
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {sections.map((section, index) => (
                <div key={section.title || index} className="space-y-1">
                  {section.title && (
                    <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      {section.title}
                    </h3>
                  )}
                  <nav className="space-y-1">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(item.href + '/')
                      return (
                        <Link
                          key={item.href}
                          href={item.href as never}
                          onClick={onClose}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-neutral-900 text-white'
                              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                          } `}
                        >
                          <NavIconComponent
                            name={item.icon}
                            className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Export
// =============================================================================

export type { AppLayoutProps }
