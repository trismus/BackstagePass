'use client'

import { useState, useRef, useTransition } from 'react'
import Papa from 'papaparse'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import {
  importPersonen,
  importPartner,
  exportPersonen,
  exportPartner,
  type CsvPersonRow,
  type CsvPartnerRow,
  type ImportResult,
} from '@/lib/actions/csv-import'

type ImportType = 'personen' | 'partner'

interface PreviewData {
  type: ImportType
  headers: string[]
  rows: Record<string, string>[]
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function DataImportExport() {
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedType, setSelectedType] = useState<ImportType>('personen')

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV Parsing Fehler: ${results.errors[0].message}`)
          return
        }

        const rows = results.data as Record<string, string>[]
        if (rows.length === 0) {
          setError('Die CSV-Datei enthält keine Daten')
          return
        }

        setPreview({
          type: selectedType,
          headers: results.meta.fields || [],
          rows: rows.slice(0, 10), // Show first 10 rows in preview
        })
      },
      error: (err) => {
        setError(`Fehler beim Lesen der Datei: ${err.message}`)
      },
    })
  }

  function handleImport() {
    if (!preview) return

    startTransition(async () => {
      try {
        let importResult: ImportResult

        if (preview.type === 'personen') {
          // Re-parse the file to get all rows
          const file = fileInputRef.current?.files?.[0]
          if (!file) return

          const parseResult = await new Promise<Papa.ParseResult<CsvPersonRow>>(
            (resolve) => {
              Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: resolve,
              })
            }
          )

          importResult = await importPersonen(parseResult.data)
        } else {
          const file = fileInputRef.current?.files?.[0]
          if (!file) return

          const parseResult = await new Promise<Papa.ParseResult<CsvPartnerRow>>(
            (resolve) => {
              Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: resolve,
              })
            }
          )

          importResult = await importPartner(parseResult.data)
        }

        setResult(importResult)
        if (importResult.success) {
          setPreview(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      }
    })
  }

  function handleExport(type: ImportType) {
    startTransition(async () => {
      try {
        const exportResult =
          type === 'personen' ? await exportPersonen() : await exportPartner()

        if (exportResult.success && exportResult.data) {
          const date = new Date().toISOString().split('T')[0]
          downloadCsv(exportResult.data, `${type}_${date}.csv`)
        } else {
          setError(exportResult.error || 'Export fehlgeschlagen')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      }
    })
  }

  function handleCancel() {
    setPreview(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daten Import / Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Import Section */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-neutral-700">
            CSV Import
          </h4>

          {!preview && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ImportType)}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="personen">Mitglieder</option>
                  <option value="partner">Partner</option>
                </select>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm"
                />
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
                <p className="font-medium">Erwartete Spalten:</p>
                {selectedType === 'personen' ? (
                  <p className="mt-1 font-mono">
                    vorname*, nachname*, email, telefon, strasse, plz, ort,
                    geburtstag (YYYY-MM-DD), rolle, notizen
                  </p>
                ) : (
                  <p className="mt-1 font-mono">
                    name*, kontakt_name, kontakt_email, kontakt_telefon,
                    adresse, notizen
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-600">
                  Vorschau ({preview.rows.length} von max. 10 Zeilen)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isPending}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isPending ? 'Importieren...' : 'Importieren'}
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-auto rounded-lg border border-neutral-200">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-neutral-100">
                    <tr>
                      {preview.headers.slice(0, 6).map((h) => (
                        <th
                          key={h}
                          className="px-2 py-1.5 text-left font-medium text-neutral-700"
                        >
                          {h}
                        </th>
                      ))}
                      {preview.headers.length > 6 && (
                        <th className="px-2 py-1.5 text-left font-medium text-neutral-500">
                          +{preview.headers.length - 6} weitere
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {preview.rows.map((row, i) => (
                      <tr key={i}>
                        {preview.headers.slice(0, 6).map((h) => (
                          <td
                            key={h}
                            className="px-2 py-1.5 text-neutral-600"
                          >
                            {row[h] || '-'}
                          </td>
                        ))}
                        {preview.headers.length > 6 && (
                          <td className="px-2 py-1.5 text-neutral-400">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-lg p-3 text-sm ${
              result.success
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {result.success ? (
              <p>
                ✓ Import erfolgreich: {result.imported} Einträge importiert
                {result.skipped > 0 && `, ${result.skipped} übersprungen`}
              </p>
            ) : (
              <div>
                <p className="font-medium">Import fehlgeschlagen:</p>
                <ul className="mt-1 list-inside list-disc">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Export Section */}
        <div className="border-t border-neutral-200 pt-4">
          <h4 className="mb-3 text-sm font-semibold text-neutral-700">
            CSV Export
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('personen')}
              disabled={isPending}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Mitglieder exportieren
            </button>
            <button
              onClick={() => handleExport('partner')}
              disabled={isPending}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Partner exportieren
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
