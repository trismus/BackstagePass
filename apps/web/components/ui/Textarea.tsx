'use client'

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  type TextareaHTMLAttributes,
  type ChangeEvent,
} from 'react'

// =============================================================================
// Types
// =============================================================================

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  /** Label for the textarea */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Show character counter */
  showCount?: boolean
  /** Auto-resize to fit content */
  autoResize?: boolean
  /** Minimum rows for auto-resize */
  minRows?: number
  /** Maximum rows for auto-resize */
  maxRows?: number
  /** Callback when value changes */
  onChange?: (value: string, event: ChangeEvent<HTMLTextAreaElement>) => void
}

// =============================================================================
// Textarea Component
// =============================================================================

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCount = false,
      autoResize = false,
      minRows = 3,
      maxRows = 10,
      maxLength,
      id,
      name,
      value,
      defaultValue,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || name
    const internalRef = useRef<HTMLTextAreaElement>(null)
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef

    // Track character count
    const [charCount, setCharCount] = useState(() => {
      const initialValue = value || defaultValue || ''
      return typeof initialValue === 'string' ? initialValue.length : 0
    })

    // Calculate line height for auto-resize
    const calculateHeight = useCallback(() => {
      const textarea = textareaRef.current
      if (!textarea || !autoResize) return

      // Reset height to auto to get scrollHeight
      textarea.style.height = 'auto'

      // Get line height from computed styles
      const computedStyle = window.getComputedStyle(textarea)
      const lineHeight = parseFloat(computedStyle.lineHeight) || 20
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0
      const borderTop = parseFloat(computedStyle.borderTopWidth) || 0
      const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0

      const minHeight = lineHeight * minRows + paddingTop + paddingBottom + borderTop + borderBottom
      const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom + borderTop + borderBottom

      // Set height based on scroll height, within min/max bounds
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
      textarea.style.height = `${newHeight}px`
    }, [autoResize, minRows, maxRows, textareaRef])

    // Recalculate height when value changes
    useEffect(() => {
      calculateHeight()
    }, [value, calculateHeight])

    // Handle change event
    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setCharCount(newValue.length)
      onChange?.(newValue, e)
      calculateHeight()
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            {label}
            {props.required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}

        <textarea
          ref={textareaRef}
          id={inputId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          rows={autoResize ? minRows : props.rows || 3}
          onChange={handleChange}
          className={`
            block w-full rounded-md border px-3 py-2 text-neutral-900 placeholder-neutral-400
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500
            ${autoResize ? 'resize-none overflow-hidden' : 'resize-y'}
            ${error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
              : 'border-neutral-300 focus:border-black focus:ring-black'
            }
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...props}
        />

        {/* Footer: Error/Helper + Character Count */}
        <div className="mt-1 flex justify-between">
          <div>
            {error && (
              <p id={`${inputId}-error`} className="text-sm text-error-600">
                {error}
              </p>
            )}
            {helperText && !error && (
              <p id={`${inputId}-helper`} className="text-sm text-neutral-500">
                {helperText}
              </p>
            )}
          </div>

          {showCount && (
            <span
              className={`text-sm ${
                maxLength && charCount > maxLength * 0.9
                  ? charCount >= maxLength
                    ? 'text-error-600'
                    : 'text-warning-600'
                  : 'text-neutral-400'
              }`}
            >
              {charCount}
              {maxLength && `/${maxLength}`}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
