'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type HTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'

// =============================================================================
// Types
// =============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal title */
  title?: string
  /** Modal description/subtitle */
  description?: string
  /** Modal content */
  children: ReactNode
  /** Modal size */
  size?: ModalSize
  /** Show close button */
  showCloseButton?: boolean
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean
  /** Close on ESC key */
  closeOnEscape?: boolean
  /** Additional class names for content */
  className?: string
  /** Footer content (buttons, actions) */
  footer?: ReactNode
}

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

// =============================================================================
// Size Styles
// =============================================================================

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

// =============================================================================
// Focus Trap Hook
// =============================================================================

function useFocusTrap(ref: React.RefObject<HTMLDivElement | null>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return

    const element = ref.current
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element
    firstElement?.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    element.addEventListener('keydown', handleTabKey)
    return () => element.removeEventListener('keydown', handleTabKey)
  }, [ref, isActive])
}

// =============================================================================
// Modal Component
// =============================================================================

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  footer,
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Track mounted state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle animation states
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement
      setIsVisible(true)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      // Restore body scroll
      document.body.style.overflow = ''
      // Restore focus
      previousActiveElement.current?.focus()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Handle ESC key
  useEffect(() => {
    if (!open || !closeOnEscape) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, closeOnEscape, onClose])

  // Focus trap
  useFocusTrap(modalRef, open)

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose()
      }
    },
    [closeOnBackdropClick, onClose]
  )

  if (!mounted || !open) return null

  const modal = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`
          relative z-10 w-full rounded-xl border border-neutral-200 bg-white shadow-xl
          transition-all duration-200
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          ${sizeStyles[size]}
          ${className}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between border-b border-neutral-100 p-4">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-neutral-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-neutral-500">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                aria-label="Schliessen"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

// =============================================================================
// Compound Components
// =============================================================================

export function ModalHeader({ children, className = '', ...props }: ModalHeaderProps) {
  return (
    <div className={`border-b border-neutral-100 p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function ModalBody({ children, className = '', ...props }: ModalBodyProps) {
  return (
    <div className={`max-h-[calc(100vh-200px)] overflow-y-auto p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className = '', ...props }: ModalFooterProps) {
  return (
    <div
      className={`flex items-center justify-end gap-3 border-t border-neutral-100 p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
