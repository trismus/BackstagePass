'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui'
import { updateHelfer } from '@/lib/actions/alle-helfer'
import type { HelferUebersicht } from '@/lib/actions/alle-helfer'

interface HelferEditDialogProps {
  helfer: HelferUebersicht
}

export function HelferEditDialog({ helfer }: HelferEditDialogProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const [vorname, setVorname] = useState(helfer.vorname)
  const [nachname, setNachname] = useState(helfer.nachname)
  const [email, setEmail] = useState(helfer.email || '')
  const [telefon, setTelefon] = useState(helfer.telefon || '')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const resetForm = useCallback(() => {
    setVorname(helfer.vorname)
    setNachname(helfer.nachname)
    setEmail(helfer.email || '')
    setTelefon(helfer.telefon || '')
    setMessage(null)
  }, [helfer])

  const handleClose = useCallback(() => {
    resetForm()
    setOpen(false)
  }, [resetForm])

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
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (!vorname.trim() || !nachname.trim()) {
      setMessage({ type: 'error', text: 'Vorname und Nachname sind erforderlich.' })
      return
    }

    startTransition(async () => {
      const result = await updateHelfer({
        id: helfer.id,
        typ: helfer.typ,
        vorname: vorname.trim(),
        nachname: nachname.trim(),
        email: email.trim() || undefined,
        telefon: telefon.trim() || undefined,
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'Helfer wurde erfolgreich aktualisiert.' })
        setTimeout(() => {
          handleClose()
          router.refresh()
        }, 1200)
      } else {
        setMessage({
          type: 'error',
          text: result.error ?? 'Ein Fehler ist aufgetreten.',
        })
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
        title="Bearbeiten"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {open && (
        <dialog
          ref={dialogRef}
          className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-black/50"
          onClick={(e) => {
            if (e.target === dialogRef.current) handleClose()
          }}
        >
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Helfer bearbeiten
              </h2>
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
              <Input
                label="Vorname"
                name="vorname"
                value={vorname}
                onChange={(e) => setVorname(e.target.value)}
                placeholder="Vorname"
                required
                disabled={isPending}
                maxLength={100}
              />

              <Input
                label="Nachname"
                name="nachname"
                value={nachname}
                onChange={(e) => setNachname(e.target.value)}
                placeholder="Nachname"
                required
                disabled={isPending}
                maxLength={100}
              />

              <Input
                label="E-Mail (optional)"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="helfer@example.com"
                disabled={isPending}
                maxLength={255}
              />

              <Input
                label="Telefon (optional)"
                name="telefon"
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="+41 ..."
                disabled={isPending}
                maxLength={50}
              />

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
                  {isPending ? 'Wird gespeichert...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </>
  )
}
