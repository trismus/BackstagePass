'use client'

import {
  useState,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'

// =============================================================================
// Types
// =============================================================================

export interface Tab {
  id: string
  label: string
  disabled?: boolean
  icon?: ReactNode
}

export interface TabsProps {
  /** Available tabs */
  tabs: Tab[]
  /** Currently active tab ID */
  activeTab?: string
  /** Default active tab (uncontrolled) */
  defaultTab?: string
  /** Callback when tab changes */
  onChange?: (tabId: string) => void
  /** Tab content render function or children */
  children?: ReactNode | ((activeTab: string) => ReactNode)
  /** Additional class names for container */
  className?: string
  /** Full width tabs */
  fullWidth?: boolean
  /** Tab alignment */
  align?: 'left' | 'center' | 'right'
}

export interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export interface TabProps extends HTMLAttributes<HTMLButtonElement> {
  /** Tab identifier */
  id: string
  /** Tab is disabled */
  disabled?: boolean
  /** Icon before label */
  icon?: ReactNode
  children: ReactNode
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Tab identifier this panel belongs to */
  tabId: string
  /** Lazy load content (only render when active) */
  lazy?: boolean
  children: ReactNode
}

// =============================================================================
// Context
// =============================================================================

interface TabsContextValue {
  activeTab: string
  setActiveTab: (id: string) => void
  tabs: Tab[]
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component')
  }
  return context
}

// =============================================================================
// Tabs Component
// =============================================================================

export function Tabs({
  tabs,
  activeTab: controlledActiveTab,
  defaultTab,
  onChange,
  children,
  className = '',
  fullWidth = false,
  align = 'left',
}: TabsProps) {
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState(
    () => defaultTab || tabs[0]?.id || ''
  )

  // Controlled or uncontrolled mode
  const isControlled = controlledActiveTab !== undefined
  const activeTab = isControlled ? controlledActiveTab : uncontrolledActiveTab

  const setActiveTab = useCallback(
    (id: string) => {
      if (!isControlled) {
        setUncontrolledActiveTab(id)
      }
      onChange?.(id)
    },
    [isControlled, onChange]
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const enabledTabs = tabs.filter((t) => !t.disabled)
    const currentEnabledIndex = enabledTabs.findIndex((t) => t.id === tabs[currentIndex].id)

    let newIndex = -1

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        newIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledTabs.length - 1
        break
      case 'ArrowRight':
        e.preventDefault()
        newIndex = currentEnabledIndex < enabledTabs.length - 1 ? currentEnabledIndex + 1 : 0
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = enabledTabs.length - 1
        break
    }

    if (newIndex >= 0) {
      const newTab = enabledTabs[newIndex]
      if (newTab) {
        setActiveTab(newTab.id)
        // Focus the new tab button
        const buttons = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
          'button[role="tab"]:not([disabled])'
        )
        buttons?.[newIndex]?.focus()
      }
    }
  }

  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, tabs }}>
      <div className={className}>
        {/* Tab List */}
        <div
          className={`flex border-b border-neutral-200 ${alignStyles[align]}`}
          role="tablist"
          aria-orientation="horizontal"
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={`tabpanel-${tab.id}`}
                aria-selected={isActive}
                disabled={tab.disabled}
                tabIndex={isActive ? 0 : -1}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                  ${fullWidth ? 'flex-1 justify-center' : ''}
                  ${tab.disabled ? 'cursor-not-allowed text-neutral-300' : 'cursor-pointer'}
                  ${isActive
                    ? 'text-primary-600'
                    : !tab.disabled
                      ? 'text-neutral-600 hover:text-neutral-900'
                      : ''
                  }
                `}
              >
                {tab.icon}
                {tab.label}
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-600" />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Panels */}
        <div className="pt-4">
          {typeof children === 'function' ? children(activeTab) : children}
        </div>
      </div>
    </TabsContext.Provider>
  )
}

// =============================================================================
// TabList Component (for compound pattern)
// =============================================================================

export function TabList({ children, className = '', ...props }: TabListProps) {
  return (
    <div
      className={`flex border-b border-neutral-200 ${className}`}
      role="tablist"
      aria-orientation="horizontal"
      {...props}
    >
      {children}
    </div>
  )
}

// =============================================================================
// Tab Component (for compound pattern)
// =============================================================================

export function Tab({
  id,
  disabled = false,
  icon,
  children,
  className = '',
  ...props
}: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = id === activeTab

  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-controls={`tabpanel-${id}`}
      aria-selected={isActive}
      disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      onClick={() => !disabled && setActiveTab(id)}
      className={`
        relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
        ${disabled ? 'cursor-not-allowed text-neutral-300' : 'cursor-pointer'}
        ${isActive
          ? 'text-primary-600'
          : !disabled
            ? 'text-neutral-600 hover:text-neutral-900'
            : ''
        }
        ${className}
      `}
      {...props}
    >
      {icon}
      {children}
      {isActive && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-600" />
      )}
    </button>
  )
}

// =============================================================================
// TabPanel Component
// =============================================================================

export function TabPanel({
  tabId,
  lazy = false,
  children,
  className = '',
  ...props
}: TabPanelProps) {
  const { activeTab } = useTabsContext()
  const isActive = tabId === activeTab

  // Lazy loading: don't render content until tab is active for the first time
  const [hasBeenActive, setHasBeenActive] = useState(isActive)

  if (isActive && !hasBeenActive) {
    setHasBeenActive(true)
  }

  // If lazy and never been active, don't render
  if (lazy && !hasBeenActive) {
    return null
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      hidden={!isActive}
      tabIndex={0}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}
