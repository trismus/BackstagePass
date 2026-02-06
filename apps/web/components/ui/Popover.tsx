'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

// =============================================================================
// Types
// =============================================================================

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export type PopoverTrigger = 'click' | 'hover'

export interface PopoverProps {
  /** Popover content */
  content: ReactNode
  /** Trigger element */
  children: ReactNode
  /** Placement relative to trigger */
  placement?: PopoverPlacement
  /** How to trigger the popover */
  trigger?: PopoverTrigger
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Show arrow pointer */
  showArrow?: boolean
  /** Close on click outside */
  closeOnClickOutside?: boolean
  /** Delay before showing (hover only) */
  showDelay?: number
  /** Delay before hiding (hover only) */
  hideDelay?: number
  /** Additional class names for content */
  className?: string
  /** Offset from trigger (in pixels) */
  offset?: number
}

export interface TooltipProps extends Omit<PopoverProps, 'trigger' | 'closeOnClickOutside' | 'content'> {
  /** Tooltip content (required if text not provided) */
  content?: ReactNode
  /** Tooltip text (alternative to content prop) */
  text?: string
}

// =============================================================================
// Positioning Logic
// =============================================================================

interface Position {
  top: number
  left: number
  arrowTop?: number
  arrowLeft?: number
  arrowRotation?: number
}

function calculatePosition(
  triggerRect: DOMRect,
  contentRect: DOMRect,
  placement: PopoverPlacement,
  offset: number
): Position {
  const gap = offset + 8 // offset + arrow size

  let top = 0
  let left = 0
  let arrowTop = 0
  let arrowLeft = 0
  let arrowRotation = 0

  // Base position calculations
  switch (placement) {
    case 'top':
    case 'top-start':
    case 'top-end':
      top = triggerRect.top - contentRect.height - gap
      arrowTop = contentRect.height - 4
      arrowRotation = 180
      break
    case 'bottom':
    case 'bottom-start':
    case 'bottom-end':
      top = triggerRect.bottom + gap
      arrowTop = -8
      arrowRotation = 0
      break
    case 'left':
    case 'left-start':
    case 'left-end':
      left = triggerRect.left - contentRect.width - gap
      arrowLeft = contentRect.width - 4
      arrowRotation = 90
      break
    case 'right':
    case 'right-start':
    case 'right-end':
      left = triggerRect.right + gap
      arrowLeft = -8
      arrowRotation = -90
      break
  }

  // Horizontal alignment for top/bottom
  if (placement.startsWith('top') || placement.startsWith('bottom')) {
    if (placement.endsWith('-start')) {
      left = triggerRect.left
      arrowLeft = Math.min(16, contentRect.width / 4)
    } else if (placement.endsWith('-end')) {
      left = triggerRect.right - contentRect.width
      arrowLeft = contentRect.width - Math.min(24, contentRect.width / 4)
    } else {
      left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2
      arrowLeft = contentRect.width / 2 - 6
    }
  }

  // Vertical alignment for left/right
  if (placement.startsWith('left') || placement.startsWith('right')) {
    if (placement.endsWith('-start')) {
      top = triggerRect.top
      arrowTop = Math.min(16, contentRect.height / 4)
    } else if (placement.endsWith('-end')) {
      top = triggerRect.bottom - contentRect.height
      arrowTop = contentRect.height - Math.min(24, contentRect.height / 4)
    } else {
      top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2
      arrowTop = contentRect.height / 2 - 6
    }
  }

  // Viewport collision detection
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  // Clamp to viewport
  left = Math.max(8, Math.min(left, viewport.width - contentRect.width - 8))
  top = Math.max(8, Math.min(top, viewport.height - contentRect.height - 8))

  return { top, left, arrowTop, arrowLeft, arrowRotation }
}

// =============================================================================
// Popover Component
// =============================================================================

export function Popover({
  content,
  children,
  placement = 'bottom',
  trigger = 'click',
  open: controlledOpen,
  onOpenChange,
  showArrow = true,
  closeOnClickOutside = true,
  showDelay = 100,
  hideDelay = 150,
  className = '',
  offset = 0,
}: PopoverProps) {
  const [mounted, setMounted] = useState(false)
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 })

  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const showTimeoutRef = useRef<NodeJS.Timeout>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout>(null)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  // Track mounted state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value)
      }
      onOpenChange?.(value)
    },
    [isControlled, onOpenChange]
  )

  // Update position when open changes
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !contentRef.current) return

    const updatePosition = () => {
      if (!triggerRef.current || !contentRef.current) return
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const contentRect = contentRef.current.getBoundingClientRect()
      setPosition(calculatePosition(triggerRect, contentRect, placement, offset))
    }

    updatePosition()

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, placement, offset])

  // Handle click outside
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside || trigger !== 'click') return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !contentRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, closeOnClickOutside, trigger, setOpen])

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (trigger !== 'hover') return
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    showTimeoutRef.current = setTimeout(() => setOpen(true), showDelay)
  }, [trigger, showDelay, setOpen])

  const handleMouseLeave = useCallback(() => {
    if (trigger !== 'hover') return
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => setOpen(false), hideDelay)
  }, [trigger, hideDelay, setOpen])

  const handleClick = useCallback(() => {
    if (trigger !== 'click') return
    setOpen(!isOpen)
  }, [trigger, isOpen, setOpen])

  const popoverContent = mounted && isOpen && (
    <div
      ref={contentRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }}
      className={`
        rounded-lg border border-neutral-200 bg-white p-3 shadow-lg
        ${className}
      `}
      onMouseEnter={trigger === 'hover' ? handleMouseEnter : undefined}
      onMouseLeave={trigger === 'hover' ? handleMouseLeave : undefined}
      role="tooltip"
    >
      {content}

      {/* Arrow */}
      {showArrow && (
        <div
          style={{
            position: 'absolute',
            top: position.arrowTop,
            left: position.arrowLeft,
            transform: `rotate(${position.arrowRotation}deg)`,
          }}
        >
          <svg width="12" height="8" viewBox="0 0 12 8" className="fill-white">
            <path d="M6 8L0 0H12L6 8Z" />
          </svg>
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            className="absolute left-0 top-[-1px] fill-neutral-200"
          >
            <path d="M6 8L0 0H12L6 8Z" clipPath="inset(0 0 7px 0)" />
          </svg>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="inline-block"
      >
        {children}
      </div>

      {popoverContent && createPortal(popoverContent, document.body)}
    </>
  )
}

// =============================================================================
// Tooltip Component (Convenience wrapper)
// =============================================================================

export function Tooltip({
  text,
  content,
  showArrow = true,
  placement = 'top',
  showDelay = 300,
  hideDelay = 100,
  className = '',
  ...props
}: TooltipProps) {
  return (
    <Popover
      content={text || content}
      trigger="hover"
      showArrow={showArrow}
      placement={placement}
      showDelay={showDelay}
      hideDelay={hideDelay}
      closeOnClickOutside={false}
      className={`max-w-xs text-sm ${className}`}
      {...props}
    />
  )
}
