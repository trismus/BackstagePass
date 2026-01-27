'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createRollenInstanz,
  createRollenInstanzenFromTemplates,
} from '@/lib/actions/helferliste'
import type {
  HelferRollenTemplate,
  RollenSichtbarkeit,
} from '@/lib/supabase/types'

interface RollenInstanzEditorProps {
  eventId: string
  templates: HelferRollenTemplate[]
  eventStart: string
  eventEnd: string
}

export function RollenInstanzEditor({
  eventId,
  templates,
  eventStart,
  eventEnd,
}: RollenInstanzEditorProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'template' | 'custom'>('template')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Template mode state
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])

  // Custom mode state
  const [customName, setCustomName] = useState('')
  const [anzahlBenoetigt, setAnzahlBenoetigt] = useState(1)

  // Shared state
  const [zeitblockStart, setZeitblockStart] = useState('')
  const [zeitblockEnd, setZeitblockEnd] = useState('')
  const [sichtbarkeit, setSichtbarkeit] = useState<RollenSichtbarkeit>('intern')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'template' && selectedTemplates.length > 0) {
        const result = await createRollenInstanzenFromTemplates(
          eventId,
          selectedTemplates,
          {
            zeitblock_start: zeitblockStart || undefined,
            zeitblock_end: zeitblockEnd || undefined,
            sichtbarkeit,
          }
        )

        if (!result.success) {
          setError(result.error || 'Fehler beim Erstellen')
          return
        }
      } else if (mode === 'custom' && customName) {
        const result = await createRollenInstanz({
          helfer_event_id: eventId,
          template_id: null,
          custom_name: customName,
          zeitblock_start: zeitblockStart || null,
          zeitblock_end: zeitblockEnd || null,
          anzahl_benoetigt: anzahlBenoetigt,
          sichtbarkeit,
        })

        if (!result.success) {
          setError(result.error || 'Fehler beim Erstellen')
          return
        }
      }

      // Reset form
      setSelectedTemplates([])
      setCustomName('')
      setAnzahlBenoetigt(1)
      setZeitblockStart('')
      setZeitblockEnd('')
      setSichtbarkeit('intern')
      setIsOpen(false)
      router.refresh()
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600"
      >
        + Rolle hinzufügen
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Neue Rolle</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="border-error-200 mb-4 rounded border bg-error-50 px-3 py-2 text-sm text-error-700">
          {error}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="mb-4 flex overflow-hidden rounded-lg border border-gray-200">
        <button
          type="button"
          onClick={() => setMode('template')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            mode === 'template'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Aus Vorlage
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            mode === 'custom'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Benutzerdefiniert
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'template' ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Vorlagen auswählen
            </label>
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Vorlagen verfügbar.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {templates.map((template) => (
                  <label
                    key={template.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors ${
                      selectedTemplates.includes(template.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(template.id)}
                      onChange={() => toggleTemplate(template.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">
                      {template.name}
                      <span className="ml-1 text-gray-400">
                        ({template.default_anzahl})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div>
              <label
                htmlFor="customName"
                className="block text-sm font-medium text-gray-700"
              >
                Rollenname *
              </label>
              <input
                type="text"
                id="customName"
                required={mode === 'custom'}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Kasse"
              />
            </div>
            <div>
              <label
                htmlFor="anzahlBenoetigt"
                className="block text-sm font-medium text-gray-700"
              >
                Anzahl benötigt
              </label>
              <input
                type="number"
                id="anzahlBenoetigt"
                min="1"
                value={anzahlBenoetigt}
                onChange={(e) =>
                  setAnzahlBenoetigt(parseInt(e.target.value) || 1)
                }
                className="mt-1 block w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </>
        )}

        {/* Shared Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="zeitblockStart"
              className="block text-sm font-medium text-gray-700"
            >
              Zeitblock Start (optional)
            </label>
            <input
              type="datetime-local"
              id="zeitblockStart"
              value={zeitblockStart}
              min={eventStart.slice(0, 16)}
              max={eventEnd.slice(0, 16)}
              onChange={(e) => setZeitblockStart(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="zeitblockEnd"
              className="block text-sm font-medium text-gray-700"
            >
              Zeitblock Ende (optional)
            </label>
            <input
              type="datetime-local"
              id="zeitblockEnd"
              value={zeitblockEnd}
              min={zeitblockStart || eventStart.slice(0, 16)}
              max={eventEnd.slice(0, 16)}
              onChange={(e) => setZeitblockEnd(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Sichtbarkeit
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sichtbarkeit"
                value="intern"
                checked={sichtbarkeit === 'intern'}
                onChange={() => setSichtbarkeit('intern')}
                className="border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Intern (nur Mitglieder)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sichtbarkeit"
                value="public"
                checked={sichtbarkeit === 'public'}
                onChange={() => setSichtbarkeit('public')}
                className="border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Öffentlich (mit Link)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (mode === 'template' && selectedTemplates.length === 0) ||
              (mode === 'custom' && !customName)
            }
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Hinzufügen...' : 'Hinzufügen'}
          </button>
        </div>
      </form>
    </div>
  )
}
