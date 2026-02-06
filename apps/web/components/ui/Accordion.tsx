'use client'

import {
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
  type HTMLAttributes,
} from 'react'

// =============================================================================
// Types
// =============================================================================

export interface AccordionItem {
  id: string
  title: string | ReactNode
  content: ReactNode
  disabled?: boolean
}

export interface AccordionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Accordion items */
  items?: AccordionItem[]
  /** Currently open item(s) */
  value?: string | string[]
  /** Default open items (uncontrolled) */
  defaultValue?: string | string[]
  /** Allow multiple items open at once */
  multiple?: boolean
  /** Callback when open items change */
  onChange?: (value: string | string[]) => void
  /** Children for compound component pattern */
  children?: ReactNode
  /** Disable all items */
  disabled?: boolean
}

export interface AccordionItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Item identifier */
  id: string
  /** Item title/header */
  title: string | ReactNode
  /** Item content */
  children: ReactNode
  /** Disable this item */
  disabled?: boolean
}

export interface AccordionTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

// =============================================================================
// Context
// =============================================================================

interface AccordionContextValue {
  openItems: string[]
  toggleItem: (id: string) => void
  multiple: boolean
  disabled: boolean
}

interface AccordionItemContextValue {
  id: string
  isOpen: boolean
  isDisabled: boolean
}

const AccordionContext = createContext<AccordionContextValue | null>(null)
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)

function useAccordionContext() {
  const context = useContext(AccordionContext)
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion')
  }
  return context
}

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext)
  if (!context) {
    throw new Error('AccordionTrigger/Content must be used within an AccordionItem')
  }
  return context
}

// =============================================================================
// Accordion Component
// =============================================================================

export function Accordion({
  items,
  value: controlledValue,
  defaultValue,
  multiple = false,
  onChange,
  children,
  disabled = false,
  className = '',
  ...props
}: AccordionProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    }
    return []
  })

  const isControlled = controlledValue !== undefined
  const openItems = useMemo(() => {
    return isControlled
      ? Array.isArray(controlledValue)
        ? controlledValue
        : [controlledValue]
      : uncontrolledValue
  }, [isControlled, controlledValue, uncontrolledValue])

  const toggleItem = useCallback(
    (id: string) => {
      let newValue: string[]

      if (openItems.includes(id)) {
        // Close item
        newValue = openItems.filter((i) => i !== id)
      } else {
        // Open item
        newValue = multiple ? [...openItems, id] : [id]
      }

      if (!isControlled) {
        setUncontrolledValue(newValue)
      }

      onChange?.(multiple ? newValue : newValue[0] || '')
    },
    [openItems, multiple, isControlled, onChange]
  )

  const contextValue: AccordionContextValue = {
    openItems,
    toggleItem,
    multiple,
    disabled,
  }

  return (
    <AccordionContext.Provider value={contextValue}>
      <div
        className={`divide-y divide-neutral-200 rounded-lg border border-neutral-200 ${className}`}
        {...props}
      >
        {items
          ? items.map((item) => (
              <AccordionItemComponent
                key={item.id}
                id={item.id}
                title={item.title}
                disabled={item.disabled}
              >
                {item.content}
              </AccordionItemComponent>
            ))
          : children}
      </div>
    </AccordionContext.Provider>
  )
}

// =============================================================================
// AccordionItem Component
// =============================================================================

function AccordionItemComponent({
  id,
  title,
  children,
  disabled = false,
  className = '',
  ...props
}: AccordionItemProps) {
  const { openItems, disabled: groupDisabled } = useAccordionContext()
  const isOpen = openItems.includes(id)
  const isDisabled = disabled || groupDisabled

  const itemContextValue: AccordionItemContextValue = {
    id,
    isOpen,
    isDisabled,
  }

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <div className={`${className}`} {...props}>
        <AccordionTrigger>{title}</AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </div>
    </AccordionItemContext.Provider>
  )
}

// Named export for compound pattern
export { AccordionItemComponent as AccordionItem }

// =============================================================================
// AccordionTrigger Component
// =============================================================================

export function AccordionTrigger({
  children,
  className = '',
  ...props
}: AccordionTriggerProps) {
  const { toggleItem } = useAccordionContext()
  const { id, isOpen, isDisabled } = useAccordionItemContext()

  return (
    <button
      type="button"
      onClick={() => !isDisabled && toggleItem(id)}
      disabled={isDisabled}
      aria-expanded={isOpen}
      aria-controls={`accordion-content-${id}`}
      id={`accordion-trigger-${id}`}
      className={`
        flex w-full items-center justify-between p-4 text-left font-medium transition-colors
        ${isDisabled ? 'cursor-not-allowed text-neutral-400' : 'text-neutral-900 hover:bg-neutral-50'}
        ${className}
      `}
      {...props}
    >
      <span>{children}</span>
      <svg
        className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

// =============================================================================
// AccordionContent Component
// =============================================================================

export function AccordionContent({
  children,
  className = '',
  ...props
}: AccordionContentProps) {
  const { id, isOpen } = useAccordionItemContext()
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>(0)

  // Measure content height for animation
  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    }
  }, [children])

  return (
    <div
      id={`accordion-content-${id}`}
      role="region"
      aria-labelledby={`accordion-trigger-${id}`}
      className="overflow-hidden transition-all duration-200 ease-in-out"
      style={{
        maxHeight: isOpen ? `${height}px` : '0px',
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div
        ref={contentRef}
        className={`px-4 pb-4 text-neutral-600 ${className}`}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}
