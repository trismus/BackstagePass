'use client'

import { useState } from 'react'
import { updateHelferStatus, getAllHelferEmails } from '@/lib/actions/koordination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface QuickActionsProps {
  veranstaltungId: string
  helferStatus: string | null
  onStatusChange: () => void
  onExportPDF: () => void
  onExportExcel: () => void
}

export function QuickActions({
  veranstaltungId,
  helferStatus,
  onStatusChange,
  onExportPDF,
  onExportExcel,
}: QuickActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [copiedEmails, setCopiedEmails] = useState(false)

  const handlePublish = async () => {
    setIsLoading(true)
    try {
      const result = await updateHelferStatus(veranstaltungId, 'veroeffentlicht')
      if (result.success) {
        onStatusChange()
      }
    } finally {
      setIsLoading(false)
      setShowPublishConfirm(false)
    }
  }

  const handleClose = async () => {
    setIsLoading(true)
    try {
      const result = await updateHelferStatus(veranstaltungId, 'abgeschlossen')
      if (result.success) {
        onStatusChange()
      }
    } finally {
      setIsLoading(false)
      setShowCloseConfirm(false)
    }
  }

  const handleCopyEmails = async () => {
    try {
      const result = await getAllHelferEmails(veranstaltungId)
      if (result.success && result.emails) {
        await navigator.clipboard.writeText(result.emails)
        setCopiedEmails(true)
        setTimeout(() => setCopiedEmails(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy emails:', err)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {/* Status Actions */}
        {helferStatus === 'entwurf' && (
          <button
            onClick={() => setShowPublishConfirm(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Veroeffentlichen
          </button>
        )}

        {helferStatus === 'veroeffentlicht' && (
          <button
            onClick={() => setShowCloseConfirm(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Abschliessen
          </button>
        )}

        {/* Export Actions */}
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white">
          <button
            onClick={onExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
          <div className="h-6 w-px bg-neutral-200" />
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
        </div>

        {/* Copy Emails */}
        <button
          onClick={handleCopyEmails}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          {copiedEmails ? (
            <>
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Kopiert!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Alle Emails kopieren
            </>
          )}
        </button>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showPublishConfirm}
        title="Helferliste veroeffentlichen"
        message="Moechten Sie die Helferliste veroeffentlichen? Danach koennen sich externe Helfer ueber den oeffentlichen Link anmelden."
        confirmLabel={isLoading ? 'Wird veroeffentlicht...' : 'Veroeffentlichen'}
        variant="default"
        onConfirm={handlePublish}
        onCancel={() => setShowPublishConfirm(false)}
      />

      <ConfirmDialog
        open={showCloseConfirm}
        title="Helferliste abschliessen"
        message="Moechten Sie die Helferliste abschliessen? Danach sind keine weiteren Anmeldungen mehr moeglich."
        confirmLabel={isLoading ? 'Wird abgeschlossen...' : 'Abschliessen'}
        variant="warning"
        onConfirm={handleClose}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </>
  )
}
