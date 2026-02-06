'use client'

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

// =============================================================================
// Types
// =============================================================================

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  group?: string
}

export interface SelectProps {
  /** Available options */
  options: SelectOption[]
  /** Selected value(s) */
  value?: string | string[]
  /** Callback when selection changes */
  onChange?: (value: string | string[] | undefined) => void
  /** Placeholder text */
  placeholder?: string
  /** Label for the select */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Disable the select */
  disabled?: boolean
  /** Allow multiple selections */
  multiple?: boolean
  /** Enable search/filter */
  searchable?: boolean
  /** Search placeholder */
  searchPlaceholder?: string
  /** Input ID */
  id?: string
  /** Input name */
  name?: string
  /** Required field */
  required?: boolean
  /** Additional class names */
  className?: string
  /** Custom render for option */
  renderOption?: (option: SelectOption, isSelected: boolean) => ReactNode
}

// =============================================================================
// Helper Functions
// =============================================================================

function groupOptions(options: SelectOption[]): Map<string | undefined, SelectOption[]> {
  const groups = new Map<string | undefined, SelectOption[]>()

  for (const option of options) {
    const group = option.group
    if (!groups.has(group)) {
      groups.set(group, [])
    }
    groups.get(group)!.push(option)
  }

  return groups
}

// =============================================================================
// Select Component
// =============================================================================

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Auswaehlen...',
  label,
  error,
  helperText,
  disabled = false,
  multiple = false,
  searchable = false,
  searchPlaceholder = 'Suchen...',
  id,
  name,
  required = false,
  className = '',
  renderOption,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputId = id || name

  // Convert value to array for unified handling
  const selectedValues = useMemo(() => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  }, [value])

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options
    const query = searchQuery.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  // Group filtered options
  const groupedOptions = useMemo(() => groupOptions(filteredOptions), [filteredOptions])

  // Flat list for keyboard navigation
  const flatOptions = useMemo(() => filteredOptions, [filteredOptions])

  // Get display text
  const displayText = useMemo(() => {
    if (selectedValues.length === 0) return ''
    if (multiple) {
      if (selectedValues.length === 1) {
        const opt = options.find((o) => o.value === selectedValues[0])
        return opt?.label || selectedValues[0]
      }
      return `${selectedValues.length} ausgewaehlt`
    }
    const opt = options.find((o) => o.value === selectedValues[0])
    return opt?.label || selectedValues[0]
  }, [selectedValues, options, multiple])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      const item = items[highlightedIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue]
        onChange?.(newValues.length > 0 ? newValues : undefined)
      } else {
        onChange?.(optionValue)
        setIsOpen(false)
        setSearchQuery('')
      }
    },
    [multiple, selectedValues, onChange]
  )

  const handleClear = useCallback(() => {
    onChange?.(undefined)
  }, [onChange])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0 && flatOptions[highlightedIndex]) {
          const opt = flatOptions[highlightedIndex]
          if (!opt.disabled) {
            handleSelect(opt.value)
          }
        } else {
          setIsOpen(true)
        }
        break
      case ' ':
        if (!searchable || !isOpen) {
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else if (highlightedIndex >= 0 && flatOptions[highlightedIndex]) {
            const opt = flatOptions[highlightedIndex]
            if (!opt.disabled) {
              handleSelect(opt.value)
            }
          }
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex((prev) =>
            prev < flatOptions.length - 1 ? prev + 1 : prev
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchQuery('')
        break
      case 'Tab':
        setIsOpen(false)
        setSearchQuery('')
        break
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          {label}
          {required && <span className="ml-1 text-error-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={inputId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex w-full items-center justify-between rounded-md border py-2 pl-3 pr-3 text-left
          transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500
          ${error
            ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
            : 'border-neutral-300 focus:border-black focus:ring-black'
          }
          ${!displayText ? 'text-neutral-400' : 'text-neutral-900'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${inputId}-listbox`}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
      >
        <span className="truncate">{displayText || placeholder}</span>

        <div className="flex items-center gap-1">
          {selectedValues.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Auswahl loeschen"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Error / Helper Text */}
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-error-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-neutral-500">
          {helperText}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          id={`${inputId}-listbox`}
          className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {/* Search Input */}
          {searchable && (
            <div className="border-b border-gray-200 p-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setHighlightedIndex(0)
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-60 overflow-auto py-1"
            role="listbox"
            aria-multiselectable={multiple}
          >
            {flatOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Keine Optionen gefunden
              </div>
            ) : (
              Array.from(groupedOptions.entries()).map(([group, groupOptions], groupIndex) => (
                <div key={group || `group-${groupIndex}`}>
                  {group && (
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {group}
                    </div>
                  )}
                  {groupOptions.map((option) => {
                    const optionIndex = flatOptions.findIndex((o) => o.value === option.value)
                    const isSelected = selectedValues.includes(option.value)
                    const isHighlighted = optionIndex === highlightedIndex

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => !option.disabled && handleSelect(option.value)}
                        disabled={option.disabled}
                        className={`
                          flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors
                          ${option.disabled ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer'}
                          ${isSelected ? 'bg-primary-100 font-medium text-primary-700' : 'text-gray-900'}
                          ${isHighlighted && !option.disabled ? 'bg-gray-100' : ''}
                          ${!isSelected && !isHighlighted && !option.disabled ? 'hover:bg-gray-50' : ''}
                        `}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled}
                      >
                        {renderOption ? (
                          renderOption(option, isSelected)
                        ) : (
                          <>
                            <span>{option.label}</span>
                            {isSelected && multiple && (
                              <svg className="h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={multiple ? selectedValues.join(',') : (value as string) || ''}
        />
      )}
    </div>
  )
}
