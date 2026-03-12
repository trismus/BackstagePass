'use client'

import { useState } from 'react'
import type { HelferUebersicht } from '@/lib/actions/alle-helfer'

interface HelferExportColumn {
  key: string
  label: string
  enabled: boolean
  getValue: (h: HelferUebersicht) => string
}

interface HelferExportDialogProps {
  helfer: HelferUebersicht[]
  onClose: () => void
}

const createColumns = (): HelferExportColumn[] => [
  {
    key: 'name',
    label: 'Name',
    enabled: true,
    getValue: (h) => `${h.vorname} ${h.nachname}`,
  },
  {
    key: 'typ',
    label: 'Typ',
    enabled: true,
    getValue: (h) => (h.typ === 'intern' ? 'Intern' : 'Extern'),
  },
  {
    key: 'email',
    label: 'E-Mail',
    enabled: true,
    getValue: (h) => h.email || '',
  },
  {
    key: 'telefon',
    label: 'Telefon',
    enabled: true,
    getValue: (h) => h.telefon || '',
  },
  {
    key: 'einsaetze',
    label: 'Einsätze',
    enabled: true,
    getValue: (h) => String(h.einsaetze_count),
  },
  {
    key: 'letzter_einsatz',
    label: 'Letzter Einsatz',
    enabled: false,
    getValue: (h) =>
      h.letzter_einsatz
        ? new Date(h.letzter_einsatz).toLocaleDateString('de-CH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '',
  },
]

function downloadFile(content: string, filename: string, mimeType: string) {
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

function escapeCSV(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function HelferExportDialog({
  helfer,
  onClose,
}: HelferExportDialogProps) {
  const [columns, setColumns] = useState<HelferExportColumn[]>(createColumns)

  const toggleColumn = (key: string) => {
    setColumns((cols) =>
      cols.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c))
    )
  }

  const handleExportCSV = () => {
    const enabledCols = columns.filter((c) => c.enabled)
    const header = enabledCols.map((c) => escapeCSV(c.label)).join(';')
    const rows = helfer.map((h) =>
      enabledCols.map((c) => escapeCSV(c.getValue(h))).join(';')
    )
    const csv = [header, ...rows].join('\n')
    const date = new Date().toISOString().slice(0, 10)
    downloadFile(csv, `helfer-export-${date}.csv`, 'text/csv;charset=utf-8')
    onClose()
  }

  const handleExportEmails = () => {
    const emails = helfer
      .filter((h) => h.email)
      .map((h) => h.email!)
      .filter((e, i, a) => a.indexOf(e) === i)
      .join('; ')
    const date = new Date().toISOString().slice(0, 10)
    downloadFile(
      emails,
      `helfer-emails-${date}.txt`,
      'text/plain;charset=utf-8'
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Helfer exportieren
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

        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          <strong>{helfer.length}</strong> Helfer werden exportiert.
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

        {/* Export Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={columns.every((c) => !c.enabled)}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            Als CSV exportieren
          </button>

          <button
            type="button"
            onClick={handleExportEmails}
            disabled={!helfer.some((h) => h.email)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Nur E-Mail-Liste exportieren
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}
