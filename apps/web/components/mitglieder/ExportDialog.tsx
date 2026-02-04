'use client'

import { useState, useTransition } from 'react'
import {
  exportMitgliederCSV,
  exportMitgliederEmailList,
} from '@/lib/actions/export'
import {
  DEFAULT_EXPORT_COLUMNS,
  type ExportColumn,
} from '@/lib/validations/export'
import type { MitgliederFilterParams } from '@/lib/actions/personen'

interface ExportDialogProps {
  filterParams: MitgliederFilterParams
  onClose: () => void
}

export function ExportDialog({ filterParams, onClose }: ExportDialogProps) {
  const [columns, setColumns] = useState<ExportColumn[]>(DEFAULT_EXPORT_COLUMNS)
  const [isPending, startTransition] = useTransition()

  const toggleColumn = (key: ExportColumn['key']) => {
    setColumns((cols) =>
      cols.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c))
    )
  }

  const handleExportCSV = () => {
    startTransition(async () => {
      const { csv, filename } = await exportMitgliederCSV(filterParams, columns)
      downloadFile(csv, filename, 'text/csv;charset=utf-8')
      onClose()
    })
  }

  const handleExportEmails = () => {
    startTransition(async () => {
      const { emails, filename } = await exportMitgliederEmailList(filterParams)
      downloadFile(emails, filename, 'text/plain;charset=utf-8')
      onClose()
    })
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob(['\ufeff' + content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Mitglieder exportieren
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

        {/* Column Selection */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-gray-700">
            Spalten auswählen
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 rounded border border-gray-200 p-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={col.enabled}
                  onChange={() => toggleColumn(col.key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{col.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Active Filter Info */}
        {(filterParams.status !== 'aktiv' ||
          (filterParams.rolle && filterParams.rolle.length > 0) ||
          (filterParams.skills && filterParams.skills.length > 0) ||
          filterParams.search) && (
          <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <strong>Filter aktiv:</strong> Der Export enthält nur die aktuell
            gefilterten Mitglieder.
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isPending || columns.every((c) => !c.enabled)}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Exportiere...' : 'Als CSV exportieren'}
          </button>

          <button
            type="button"
            onClick={handleExportEmails}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {isPending ? 'Exportiere...' : 'Nur E-Mail-Liste exportieren'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}
