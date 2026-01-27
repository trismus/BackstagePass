'use client'

import { useState, useCallback } from 'react'
import type { HelpContextKey } from '@/lib/help'
import { HelpIcon } from './HelpIcon'
import { HelpDrawer } from './HelpDrawer'

interface HelpButtonProps {
  /** The context key that determines which help content to show */
  contextKey: HelpContextKey
  /** Size variant */
  size?: 'sm' | 'md'
  /** Additional CSS classes */
  className?: string
  /** Accessible label for screen readers */
  label?: string
}

/**
 * Contextual Help Button
 * A small button with a question mark icon that opens a help drawer
 */
export function HelpButton({
  contextKey,
  size = 'md',
  className = '',
  label = 'Hilfe',
}: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
  }

  const iconClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-primary-100 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors ${sizeClasses[size]} ${className}`}
        aria-label={label}
        title={label}
      >
        <HelpIcon className={iconClasses[size]} />
      </button>

      <HelpDrawer
        isOpen={isOpen}
        onClose={handleClose}
        contextKey={contextKey}
      />
    </>
  )
}
