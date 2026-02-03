'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Input } from '@/components/ui'
import { submitFeedback } from '@/lib/actions/feedback'
import {
  FEEDBACK_KATEGORIEN,
  KATEGORIE_LABELS,
  type FeedbackKategorie,
} from '@/lib/validations/feedback'

interface FeedbackDialogProps {
  open: boolean
  onClose: () => void
}

export function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [kategorie, setKategorie] = useState<FeedbackKategorie>(FEEDBACK_KATEGORIEN[0])
  const [titel, setTitel] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (screenshot) {
      const url = URL.createObjectURL(screenshot)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
  }, [screenshot])

  function resetForm() {
    setKategorie(FEEDBACK_KATEGORIEN[0])
    setTitel('')
    setBeschreibung('')
    setScreenshot(null)
    setPreviewUrl(null)
    setMessage(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    const formData = new FormData()
    formData.set('kategorie', kategorie)
    formData.set('titel', titel)
    formData.set('beschreibung', beschreibung)
    if (screenshot) {
      formData.set('screenshot', screenshot)
    }

    startTransition(async () => {
      const result = await submitFeedback(formData)
      if (result.success) {
        setMessage({ type: 'success', text: 'Feedback wurde erfolgreich gesendet!' })
        setTimeout(() => {
          handleClose()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Ein Fehler ist aufgetreten' })
      }
    })
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-black/50"
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose()
      }}
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Feedback geben</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'bg-success-50 text-success-700'
                : 'bg-error-50 text-error-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="feedback-kategorie"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Kategorie
            </label>
            <select
              id="feedback-kategorie"
              value={kategorie}
              onChange={(e) =>
                setKategorie(e.target.value as FeedbackKategorie)
              }
              className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0"
              disabled={isPending}
            >
              {FEEDBACK_KATEGORIEN.map((k) => (
                <option key={k} value={k}>
                  {KATEGORIE_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Titel"
            name="feedback-titel"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="Kurze Zusammenfassung"
            maxLength={200}
            required
            disabled={isPending}
          />

          <div>
            <label
              htmlFor="feedback-beschreibung"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Beschreibung
            </label>
            <textarea
              id="feedback-beschreibung"
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              placeholder="Beschreibe dein Anliegen..."
              rows={4}
              maxLength={2000}
              required
              disabled={isPending}
              className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-neutral-100"
            />
          </div>

          <div>
            <label
              htmlFor="feedback-screenshot"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Screenshot (optional)
            </label>
            <input
              id="feedback-screenshot"
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
              disabled={isPending}
              className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-md file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
            />
            {previewUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Screenshot Vorschau"
                  className="max-h-40 rounded-md border border-neutral-200"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? 'Wird gesendet...' : 'Feedback senden'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
