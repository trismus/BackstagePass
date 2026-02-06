'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'

// =============================================================================
// Types
// =============================================================================

export interface TagInputProps {
  /** Current tags */
  value?: string[]
  /** Callback when tags change */
  onChange?: (tags: string[]) => void
  /** Suggestions for autocomplete */
  suggestions?: string[]
  /** Placeholder text */
  placeholder?: string
  /** Label for the input */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Disable the input */
  disabled?: boolean
  /** Maximum number of tags */
  maxTags?: number
  /** Maximum length per tag */
  maxTagLength?: number
  /** Allow duplicate tags */
  allowDuplicates?: boolean
  /** Case-insensitive duplicate check */
  caseInsensitive?: boolean
  /** Input ID */
  id?: string
  /** Input name */
  name?: string
  /** Additional class names */
  className?: string
}

// =============================================================================
// TagInput Component
// =============================================================================

export function TagInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Tag eingeben...',
  label,
  error,
  helperText,
  disabled = false,
  maxTags,
  maxTagLength,
  allowDuplicates = false,
  caseInsensitive = true,
  id,
  name,
  className = '',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputId = id || name

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter((s) => {
    const query = caseInsensitive ? inputValue.toLowerCase() : inputValue
    const suggestion = caseInsensitive ? s.toLowerCase() : s

    // Must match query and not be already selected
    if (!suggestion.includes(query)) return false
    if (!allowDuplicates) {
      const existingTags = caseInsensitive
        ? value.map((t) => t.toLowerCase())
        : value
      if (existingTags.includes(suggestion)) return false
    }
    return true
  })

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim()
      if (!trimmed) return false

      // Check max length
      if (maxTagLength && trimmed.length > maxTagLength) return false

      // Check max tags
      if (maxTags && value.length >= maxTags) return false

      // Check duplicates
      if (!allowDuplicates) {
        const existing = caseInsensitive
          ? value.map((t) => t.toLowerCase())
          : value
        const newTag = caseInsensitive ? trimmed.toLowerCase() : trimmed
        if (existing.includes(newTag)) return false
      }

      onChange?.([...value, trimmed])
      return true
    },
    [value, onChange, maxTags, maxTagLength, allowDuplicates, caseInsensitive]
  )

  const removeTag = useCallback(
    (index: number) => {
      const newTags = value.filter((_, i) => i !== index)
      onChange?.(newTags)
    },
    [value, onChange]
  )

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (showSuggestions && highlightedIndex >= 0) {
          const suggestion = filteredSuggestions[highlightedIndex]
          if (addTag(suggestion)) {
            setInputValue('')
            setShowSuggestions(false)
          }
        } else if (inputValue) {
          if (addTag(inputValue)) {
            setInputValue('')
            setShowSuggestions(false)
          }
        }
        break

      case ',':
      case ';':
        e.preventDefault()
        if (inputValue && addTag(inputValue)) {
          setInputValue('')
          setShowSuggestions(false)
        }
        break

      case 'Backspace':
        if (!inputValue && value.length > 0) {
          removeTag(value.length - 1)
        }
        break

      case 'ArrowDown':
        e.preventDefault()
        if (showSuggestions) {
          setHighlightedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
          )
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (showSuggestions) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
        break

      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (addTag(suggestion)) {
      setInputValue('')
      setShowSuggestions(false)
      inputRef.current?.focus()
    }
  }

  const isAtMaxTags = maxTags !== undefined && value.length >= maxTags

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          {label}
          {maxTags && (
            <span className="ml-1 text-neutral-400">
              ({value.length}/{maxTags})
            </span>
          )}
        </label>
      )}

      {/* Tags Container */}
      <div
        className={`
          flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5
          transition-colors focus-within:ring-2 focus-within:ring-offset-0
          ${disabled ? 'cursor-not-allowed bg-neutral-100' : 'cursor-text bg-white'}
          ${error
            ? 'border-error-500 focus-within:border-error-500 focus-within:ring-error-500'
            : 'border-neutral-300 focus-within:border-black focus-within:ring-black'
          }
        `}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Existing Tags */}
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 rounded-md bg-primary-100 px-2 py-0.5 text-sm font-medium text-primary-700"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(index)
                }}
                className="text-primary-500 hover:text-primary-700"
                aria-label={`Tag "${tag}" entfernen`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </span>
        ))}

        {/* Input Field */}
        {!isAtMaxTags && (
          <input
            ref={inputRef}
            type="text"
            id={inputId}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={disabled}
            className="min-w-[120px] flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none disabled:cursor-not-allowed"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={`${inputId}-suggestions`}
          />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          id={`${inputId}-suggestions`}
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                w-full px-3 py-2 text-left text-sm transition-colors
                ${index === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}
              `}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

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

      {/* Hidden input for form submission */}
      {name && (
        <input type="hidden" name={name} value={value.join(',')} />
      )}
    </div>
  )
}
