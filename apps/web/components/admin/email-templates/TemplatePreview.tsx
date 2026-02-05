'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface Props {
  subject: string
  html: string
  text: string
  onClose: () => void
}

type ViewMode = 'html' | 'text'

export function TemplatePreview({ subject, html, text, onClose }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('html')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              E-Mail Vorschau
            </h2>
            <p className="text-sm text-neutral-500">
              So wird die E-Mail den Empfängern angezeigt
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="border-b border-neutral-200 px-6 py-2">
          <div className="inline-flex rounded-lg bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('html')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'html'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setViewMode('text')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'text'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Text
            </button>
          </div>
        </div>

        {/* Subject Line */}
        <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-500">Betreff:</span>
            <span className="text-sm text-neutral-900">{subject}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'html' ? (
            <div className="mx-auto max-w-[600px] rounded-lg border border-neutral-200 bg-white">
              <iframe
                srcDoc={html}
                className="h-[500px] w-full"
                title="E-Mail HTML Vorschau"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="mx-auto max-w-[600px]">
              <pre className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 font-mono text-sm text-neutral-700">
                {text}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Beispieldaten werden für die Vorschau verwendet
            </p>
            <Button onClick={onClose}>Schliessen</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
