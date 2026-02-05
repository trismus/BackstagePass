'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Download, AlertCircle, CheckCircle2, Users, X } from 'lucide-react'
import {
  getStundenErfassungPreview,
  createStundenkontoEintraege,
  exportStundenErfassungCSV,
  type StundenErfassungPreview,
} from '@/lib/actions/stundenkonto-erfassung'

interface StundenErfassungModalProps {
  open: boolean
  veranstaltungId: string
  onClose: () => void
}

export function StundenErfassungModal({
  open,
  veranstaltungId,
  onClose,
}: StundenErfassungModalProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [preview, setPreview] = useState<StundenErfassungPreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    anzahl: number
    stunden: number
  } | null>(null)

  // Load preview data
  const loadPreview = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getStundenErfassungPreview(veranstaltungId)
      setPreview(data)
    } catch (err) {
      setError('Fehler beim Laden der Daten')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [veranstaltungId])

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleSubmit = async (overwrite: boolean = false) => {
    setIsSaving(true)
    setError(null)
    try {
      const result = await createStundenkontoEintraege(veranstaltungId, overwrite)
      if (result.success) {
        setSuccess({
          anzahl: result.anzahlEintraege || 0,
          stunden: result.gesamtStunden || 0,
        })
        router.refresh()
      } else {
        setError(result.error || 'Unbekannter Fehler')
      }
    } catch (err) {
      setError('Fehler beim Speichern')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const result = await exportStundenErfassungCSV(veranstaltungId)
      if (result.success && result.csv) {
        // Download CSV
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Stundenkonto_${preview?.veranstaltungTitel || 'Export'}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Export failed:', err)
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Stunden erfassen
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
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
            </div>
          )}

          {error && !success && (
            <div className="rounded-lg border border-error-200 bg-error-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-error-600" />
                <div>
                  <p className="font-medium text-error-800">Fehler</p>
                  <p className="mt-1 text-sm text-error-700">{error}</p>
                  {preview?.bereitsErfasst && (
                    <button
                      onClick={() => handleSubmit(true)}
                      disabled={isSaving}
                      className="mt-3 rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Wird ueberschrieben...' : 'Erneut erfassen'}
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
                Stunden erfolgreich erfasst
              </h3>
              <p className="mt-2 text-success-700">
                {success.anzahl} Eintraege mit insgesamt {success.stunden.toFixed(2)} Stunden erstellt.
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
              {/* Already recorded warning */}
              {preview.bereitsErfasst && (
                <div className="rounded-lg border border-warning-200 bg-warning-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning-600" />
                    <div>
                      <p className="font-medium text-warning-800">
                        Stunden bereits erfasst
                      </p>
                      <p className="mt-1 text-sm text-warning-700">
                        Fuer diese Veranstaltung wurden am{' '}
                        {preview.bereitsErfasstAm
                          ? formatDate(preview.bereitsErfasstAm)
                          : 'unbekanntem Datum'}{' '}
                        bereits Stunden erfasst.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
                  <Users className="mx-auto h-6 w-6 text-neutral-400" />
                  <p className="mt-2 text-2xl font-bold text-neutral-900">
                    {preview.helfer.length}
                  </p>
                  <p className="text-sm text-neutral-500">Interne Helfer</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
                  <Clock className="mx-auto h-6 w-6 text-neutral-400" />
                  <p className="mt-2 text-2xl font-bold text-neutral-900">
                    {preview.gesamtStunden.toFixed(1)}h
                  </p>
                  <p className="text-sm text-neutral-500">Gesamt Stunden</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
                  <Users className="mx-auto h-6 w-6 text-neutral-400" />
                  <p className="mt-2 text-2xl font-bold text-neutral-900">
                    {preview.externeHelfer}
                  </p>
                  <p className="text-sm text-neutral-500">Externe (uebersprungen)</p>
                </div>
              </div>

              {/* Info about external helpers */}
              {preview.externeHelfer > 0 && (
                <p className="text-sm text-neutral-500">
                  <span className="font-medium">{preview.externeHelfer} externe Helfer</span>{' '}
                  werden uebersprungen, da sie kein Stundenkonto haben.
                </p>
              )}

              {/* Helper List */}
              {preview.helfer.length > 0 ? (
                <div className="rounded-lg border border-neutral-200">
                  <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2">
                    <h3 className="font-medium text-neutral-700">
                      Zu erfassende Helfer
                    </h3>
                  </div>
                  <div className="divide-y divide-neutral-100">
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
                            {helfer.schichten.map((s) => s.rolle).join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-neutral-900">
                            {helfer.stunden.toFixed(2)}h
                          </p>
                          <p className="text-xs text-neutral-500">
                            {helfer.schichten.length} Schicht{helfer.schichten.length !== 1 ? 'en' : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
                  <p className="text-neutral-500">
                    Keine eingecheckten internen Helfer gefunden.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && !isLoading && !success && (
          <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-4">
            <button
              onClick={handleExportCSV}
              disabled={preview.helfer.length === 0}
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Als CSV exportieren
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleSubmit(preview.bereitsErfasst)}
                disabled={isSaving || preview.helfer.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Wird erfasst...
                  </>
                ) : preview.bereitsErfasst ? (
                  'Erneut erfassen'
                ) : (
                  'Stunden erfassen'
                )}
              </button>
            </div>
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
