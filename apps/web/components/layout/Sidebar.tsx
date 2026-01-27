'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavSection, NavItem } from '@/lib/navigation'
import {
  NavIconComponent,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  MenuIcon,
} from './NavIcons'

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'sidebar-collapsed'
const MOBILE_BREAKPOINT = 1024 // lg breakpoint

// =============================================================================
// Types
// =============================================================================

interface SidebarProps {
  sections: NavSection[]
  className?: string
}

// =============================================================================
// NavLink Component
// =============================================================================

function NavLink({
  item,
  collapsed,
  isActive,
  onClick,
}: {
  item: NavItem
  collapsed: boolean
  isActive: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={item.href as never}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${collapsed ? 'justify-center' : ''} ${
        isActive
          ? 'bg-neutral-900 text-white'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      } `}
      title={collapsed ? item.label : undefined}
    >
      <NavIconComponent
        name={item.icon}
        className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-700'}`}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

// =============================================================================
// NavSection Component
// =============================================================================

function NavSectionComponent({
  section,
  collapsed,
  pathname,
  onItemClick,
}: {
  section: NavSection
  collapsed: boolean
  pathname: string
  onItemClick?: () => void
}) {
  return (
    <div className="space-y-1">
      {section.title && !collapsed && (
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {section.title}
        </h3>
      )}
      {section.title && collapsed && (
        <div className="mx-auto my-2 h-px w-8 bg-neutral-200" />
      )}
      <nav className="space-y-1">
        {section.items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            isActive={
              pathname === item.href || pathname.startsWith(item.href + '/')
            }
            onClick={onItemClick}
          />
        ))}
      </nav>
    </div>
  )
}

// =============================================================================
// Mobile Overlay
// =============================================================================

function MobileOverlay({
  open,
  onClose,
  sections,
  pathname,
}: {
  open: boolean
  onClose: () => void
  sections: NavSection[]
  pathname: string
}) {
  // Prevent scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

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
                <NavSectionComponent
                  key={section.title || index}
                  section={section}
                  collapsed={false}
                  pathname={pathname}
                  onItemClick={onClose}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Collapse Toggle Button
// =============================================================================

function CollapseToggle({
  collapsed,
  onClick,
}: {
  collapsed: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="hidden items-center justify-center rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 lg:flex"
      title={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}
    >
      {collapsed ? (
        <ChevronRightIcon className="h-5 w-5" />
      ) : (
        <ChevronLeftIcon className="h-5 w-5" />
      )}
    </button>
  )
}

// =============================================================================
// Mobile Menu Button (for Header)
// =============================================================================

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 lg:hidden"
      title="Menü öffnen"
    >
      <MenuIcon className="h-6 w-6" />
    </button>
  )
}

// =============================================================================
// Main Sidebar Component
// =============================================================================

export function Sidebar({ sections, className = '' }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setCollapsed(stored === 'true')
    }
  }, [])

  // Save collapsed state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    }
  }, [collapsed, mounted])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  // Render nothing until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <aside
        className={`hidden w-64 flex-col border-r border-neutral-200 bg-white lg:flex ${className}`}
      />
    )
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden flex-col border-r border-neutral-200 bg-white transition-all duration-300 lg:flex ${collapsed ? 'w-16' : 'w-64'} ${className} `}
      >
        {/* Toggle Button */}
        <div
          className={`flex items-center border-b border-neutral-200 p-2 ${collapsed ? 'justify-center' : 'justify-end'}`}
        >
          <CollapseToggle collapsed={collapsed} onClick={toggleCollapsed} />
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-6">
            {sections.map((section, index) => (
              <NavSectionComponent
                key={section.title || index}
                section={section}
                collapsed={collapsed}
                pathname={pathname}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <MobileOverlay
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sections={sections}
        pathname={pathname}
      />
    </>
  )
}

// =============================================================================
// Sidebar Provider (for sharing mobile state with Header)
// =============================================================================

export function useSidebarState() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev)
  }, [])

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
  }, [])

  return {
    mobileOpen,
    setMobileOpen,
    toggleMobile,
    closeMobile,
  }
}

// =============================================================================
// Export Types
// =============================================================================

export type { SidebarProps }
