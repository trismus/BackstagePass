'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Mail, AlertCircle, CheckCircle2, X, MessageSquare } from 'lucide-react'
import {
  getThankYouEmailsPreview,
  sendThankYouEmails,
  type ThankYouEmailsPreview,
} from '@/lib/actions/thank-you-emails'

interface ThankYouEmailsModalProps {
  open: boolean
  veranstaltungId: string
  onClose: () => void
}

export function ThankYouEmailsModal({
  open,
  veranstaltungId,
  onClose,
}: ThankYouEmailsModalProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [preview, setPreview] = useState<ThankYouEmailsPreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    gesendet: number
    fehlgeschlagen: number
  } | null>(null)

  // Options
  const [onlyAttended, setOnlyAttended] = useState(true)
  const [includeFeedbackLink, setIncludeFeedbackLink] = useState(true)

  // Load preview data
  const loadPreview = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getThankYouEmailsPreview(veranstaltungId, onlyAttended)
      setPreview(data)
    } catch (err) {
      setError('Fehler beim Laden der Daten')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [veranstaltungId, onlyAttended])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
      loadPreview()
    } else {
      dialog.close()
      setPreview(null)
      setSuccess(null)
      setError(null)
    }
  }, [open, loadPreview])

  // Reload when onlyAttended changes
  useEffect(() => {
    if (open && !isLoading && !success) {
      loadPreview()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyAttended])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleSend = async (resend: boolean = false) => {
    setIsSending(true)
    setError(null)
    try {
      const result = await sendThankYouEmails(veranstaltungId, {
        onlyAttended,
        includeFeedbackLink,
        resend,
      })
      if (result.success) {
        setSuccess({
          gesendet: result.gesendet || 0,
          fehlgeschlagen: result.fehlgeschlagen || 0,
        })
        router.refresh()
      } else {
        setError(result.error || 'Unbekannter Fehler')
      }
    } catch (err) {
      setError('Fehler beim Senden')
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-black/50"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
    >
      <div className="flex max-h-[90vh] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Dankes-Emails versenden
              </h2>
              {preview && (
                <p className="text-sm text-neutral-500">
                  {preview.veranstaltungTitel} - {formatDate(preview.veranstaltungDatum)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
            </div>
          )}

          {error && !success && (
            <div className="rounded-lg border border-error-200 bg-error-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-error-600" />
                <div>
                  <p className="font-medium text-error-800">Fehler</p>
                  <p className="mt-1 text-sm text-error-700">{error}</p>
                  {preview?.bereitsGesendet && (
                    <button
                      onClick={() => handleSend(true)}
                      disabled={isSending}
                      className="mt-3 rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-50"
                    >
                      {isSending ? 'Wird gesendet...' : 'Erneut senden'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-success-200 bg-success-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success-600" />
              <h3 className="mt-4 text-lg font-semibold text-success-800">
                Dankes-Emails versendet
              </h3>
              <p className="mt-2 text-success-700">
                {success.gesendet} Email{success.gesendet !== 1 ? 's' : ''} erfolgreich versendet.
                {success.fehlgeschlagen > 0 && (
                  <span className="text-warning-700">
                    {' '}{success.fehlgeschlagen} fehlgeschlagen.
                  </span>
                )}
              </p>
              <button
                onClick={onClose}
                className="mt-4 rounded-lg bg-success-600 px-6 py-2 text-sm font-medium text-white hover:bg-success-700"
              >
                Schliessen
              </button>
            </div>
          )}

          {preview && !isLoading && !success && !error && (
            <div className="space-y-6">
              {/* Already sent warning */}
              {preview.bereitsGesendet && (
                <div className="rounded-lg border border-warning-200 bg-warning-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning-600" />
                    <div>
                      <p className="font-medium text-warning-800">
                        Bereits gesendet
                      </p>
                      <p className="mt-1 text-sm text-warning-700">
                        Dankes-Emails wurden am{' '}
                        {preview.bereitsGesendetAm
                          ? formatDate(preview.bereitsGesendetAm)
                          : 'unbekanntem Datum'}{' '}
                        an {preview.bereitsGesendetAnzahl} Empfaenger gesendet.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="rounded-lg border border-neutral-200 p-4">
                <h3 className="font-medium text-neutral-900">Optionen</h3>
                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={onlyAttended}
                      onChange={(e) => setOnlyAttended(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-neutral-700">
                      Nur an anwesende Helfer senden (eingecheckt, kein No-Show)
                    </span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={includeFeedbackLink}
                      onChange={(e) => setIncludeFeedbackLink(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-neutral-700">
                      Feedback-Link einbinden
                    </span>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
                  <Mail className="mx-auto h-6 w-6 text-neutral-400" />
                  <p className="mt-2 text-2xl font-bold text-neutral-900">
                    {preview.helfer.length}
                  </p>
                  <p className="text-sm text-neutral-500">Empfaenger</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
                  <MessageSquare className="mx-auto h-6 w-6 text-neutral-400" />
                  <p className="mt-2 text-2xl font-bold text-neutral-900">
                    {preview.helfer.filter((h) => h.feedbackToken).length}
                  </p>
                  <p className="text-sm text-neutral-500">Mit Feedback-Link</p>
                </div>
              </div>

              {/* Recipient List */}
              {preview.helfer.length > 0 ? (
                <div className="rounded-lg border border-neutral-200">
                  <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2">
                    <h3 className="font-medium text-neutral-700">
                      Empfaenger
                    </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
                    {preview.helfer.map((helfer) => (
                      <div
                        key={helfer.personId}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-neutral-900">
                            {helfer.name}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {helfer.email}
                          </p>
                        </div>
                        <div className="text-right text-sm text-neutral-500">
                          {helfer.rollen.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
                  <p className="text-neutral-500">
                    Keine Helfer zum Anschreiben gefunden.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && !isLoading && !success && (
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Abbrechen
            </button>
            <button
              onClick={() => handleSend(preview.bereitsGesendet)}
              disabled={isSending || preview.helfer.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" />
                  {preview.bereitsGesendet ? 'Erneut senden' : 'Emails versenden'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </dialog>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
