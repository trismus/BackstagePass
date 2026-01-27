'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import type { HelpContextKey } from '@/lib/help'
import { getHelpContent, type HelpContent } from '@/app/actions/help'
import { CloseIcon, ChevronRightIcon } from './HelpIcon'

interface HelpDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean
  /** Callback when drawer should close */
  onClose: () => void
  /** The context key for the help content to display */
  contextKey: HelpContextKey
}

/**
 * Help Drawer Component
 * Slide-in panel from the right showing help content
 */
export function HelpDrawer({ isOpen, onClose, contextKey }: HelpDrawerProps) {
  const [content, setContent] = useState<HelpContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Load content when drawer opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    setError(null)

    getHelpContent(contextKey)
      .then((result) => {
        if (result.success && result.content) {
          setContent(result.content)
        } else {
          setError(result.error || 'Fehler beim Laden')
        }
      })
      .catch(() => {
        setError('Verbindungsfehler')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isOpen, contextKey])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Trap focus in drawer when open
  useEffect(() => {
    if (!isOpen) return

    // Focus the close button when drawer opens
    const closeButton = drawerRef.current?.querySelector('button')
    closeButton?.focus()

    // Prevent body scroll when drawer is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      aria-labelledby="help-drawer-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-lg transform bg-white shadow-xl transition-transform"
        >
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
              <div>
                <h2
                  id="help-drawer-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {loading ? 'Laden...' : content?.title || 'Hilfe'}
                </h2>
                {content?.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {content.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span className="sr-only">Schliessen</span>
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-6 sm:px-6">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {content && !loading && !error && (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content.html }}
                />
              )}
            </div>

            {/* Related topics */}
            {content?.relatedTopics && content.relatedTopics.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                <h3 className="text-sm font-medium text-gray-900">
                  Verwandte Themen
                </h3>
                <ul className="mt-3 space-y-2">
                  {content.relatedTopics.map((topic) => (
                    <li key={topic.key}>
                      <Link
                        href={`/hilfe/${topic.key}` as never}
                        onClick={onClose}
                        className="group flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-primary-50 hover:ring-primary-300"
                      >
                        <span>
                          <span className="font-medium">{topic.title}</span>
                          <span className="ml-2 text-gray-500">
                            {topic.description}
                          </span>
                        </span>
                        <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
              <Link
                href={"/hilfe" as never}
                onClick={onClose}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Alle Hilfe-Themen anzeigen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
