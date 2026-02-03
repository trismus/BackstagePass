'use client'

import { useState, useRef } from 'react'
import type {
  ProduktionsDokument,
  DokumentKategorie,
  DokumentStatus,
} from '@/lib/supabase/types'
import {
  DOKUMENT_KATEGORIE_LABELS,
  DOKUMENT_STATUS_LABELS,
} from '@/lib/supabase/types'
import {
  uploadDokument,
  getDokumentDownloadUrl,
  updateDokument,
  deleteDokument,
} from '@/lib/actions/produktions-dokumente'

const KATEGORIE_ORDER: DokumentKategorie[] = [
  'skript',
  'spielplan',
  'technik',
  'requisiten',
  'kostueme',
  'werbung',
  'sonstiges',
]

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '–'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface ProduktionDokumenteSectionProps {
  produktionId: string
  dokumente: ProduktionsDokument[]
  canEdit: boolean
}

export function ProduktionDokumenteSection({
  produktionId,
  dokumente,
  canEdit,
}: ProduktionDokumenteSectionProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kategorieFilter, setKategorieFilter] = useState<
    DokumentKategorie | 'alle'
  >('alle')
  const formRef = useRef<HTMLFormElement>(null)

  // Group by category
  const grouped = KATEGORIE_ORDER.map((kat) => ({
    kategorie: kat,
    label: DOKUMENT_KATEGORIE_LABELS[kat],
    dokumente: dokumente.filter((d) => d.kategorie === kat),
  })).filter((g) => g.dokumente.length > 0)

  const filteredGroups =
    kategorieFilter === 'alle'
      ? grouped
      : grouped.filter((g) => g.kategorie === kategorieFilter)

  const handleUpload = async (formData: FormData) => {
    setIsUploading(true)
    setError(null)
    formData.set('produktion_id', produktionId)

    const result = await uploadDokument(formData)
    if (!result.success) {
      setError(result.error || 'Fehler beim Hochladen')
    } else {
      setShowUpload(false)
      formRef.current?.reset()
    }
    setIsUploading(false)
  }

  const handleDownload = async (id: string) => {
    const result = await getDokumentDownloadUrl(id)
    if (result.success && result.url) {
      window.open(result.url, '_blank')
    } else {
      setError(result.error || 'Fehler beim Herunterladen')
    }
  }

  const handleStatusToggle = async (doc: ProduktionsDokument) => {
    const newStatus: DokumentStatus =
      doc.status === 'entwurf' ? 'freigegeben' : 'entwurf'
    const result = await updateDokument(doc.id, { status: newStatus })
    if (!result.success) {
      setError(result.error || 'Fehler beim Aktualisieren')
    }
  }

  const handleDelete = async (doc: ProduktionsDokument) => {
    if (
      !confirm(`"${doc.name}" (${doc.datei_name}) wirklich löschen?`)
    ) {
      return
    }
    const result = await deleteDokument(doc.id)
    if (!result.success) {
      setError(result.error || 'Fehler beim Löschen')
    }
  }

  const handleNewVersion = (doc: ProduktionsDokument) => {
    setShowUpload(true)
    // Pre-fill the form after it renders
    setTimeout(() => {
      const form = formRef.current
      if (!form) return
      const nameInput = form.querySelector<HTMLInputElement>(
        'input[name="name"]'
      )
      const katSelect = form.querySelector<HTMLSelectElement>(
        'select[name="kategorie"]'
      )
      const vorgaengerInput = form.querySelector<HTMLInputElement>(
        'input[name="vorgaenger_id"]'
      )
      if (nameInput) nameInput.value = doc.name
      if (katSelect) katSelect.value = doc.kategorie
      if (vorgaengerInput) vorgaengerInput.value = doc.id
    }, 0)
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Dokumente</h2>
            <p className="mt-1 text-sm text-gray-500">
              {dokumente.length} Dokument{dokumente.length !== 1 && 'e'}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {showUpload ? 'Abbrechen' : 'Hochladen'}
            </button>
          )}
        </div>

        {/* Category Filter */}
        {dokumente.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">
              Kategorie:
            </label>
            <select
              value={kategorieFilter}
              onChange={(e) =>
                setKategorieFilter(
                  e.target.value as DokumentKategorie | 'alle'
                )
              }
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="alle">Alle</option>
              {KATEGORIE_ORDER.map((kat) => (
                <option key={kat} value={kat}>
                  {DOKUMENT_KATEGORIE_LABELS[kat]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Schliessen
          </button>
        </div>
      )}

      {/* Upload Form */}
      {showUpload && canEdit && (
        <div className="border-b border-gray-200 px-6 py-4">
          <form ref={formRef} action={handleUpload} className="space-y-4">
            <input type="hidden" name="vorgaenger_id" value="" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dokumentname *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="z.B. Spielplan Version 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kategorie *
                </label>
                <select
                  name="kategorie"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  defaultValue="sonstiges"
                >
                  {KATEGORIE_ORDER.map((kat) => (
                    <option key={kat} value={kat}>
                      {DOKUMENT_KATEGORIE_LABELS[kat]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Datei *
              </label>
              <input
                type="file"
                name="file"
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Max. 50 MB. PDF, Word, Excel, Bilder, Text.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
              >
                {isUploading ? 'Wird hochgeladen...' : 'Hochladen'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Document List */}
      {dokumente.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          Noch keine Dokumente vorhanden.
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredGroups.map((group) => (
            <div key={group.kategorie}>
              {/* Category Header */}
              <div className="bg-gray-50 px-6 py-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  {group.label}
                  <span className="ml-2 font-normal text-gray-500">
                    ({group.dokumente.length})
                  </span>
                </h3>
              </div>

              {/* Documents */}
              {group.dokumente.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50"
                >
                  {/* Icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <FileIcon mimeType={doc.mime_type} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {doc.name}
                      </span>
                      {doc.version > 1 && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                          v{doc.version}
                        </span>
                      )}
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                          doc.status === 'freigegeben'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {DOKUMENT_STATUS_LABELS[doc.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {doc.datei_name} · {formatFileSize(doc.datei_groesse)} ·{' '}
                      {formatDate(doc.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      title="Herunterladen"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleStatusToggle(doc)}
                          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title={
                            doc.status === 'entwurf'
                              ? 'Freigeben'
                              : 'Zurück auf Entwurf'
                          }
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {doc.status === 'entwurf' ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            )}
                          </svg>
                        </button>
                        <button
                          onClick={() => handleNewVersion(doc)}
                          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title="Neue Version hochladen"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-error-100 hover:text-error-700"
                          title="Löschen"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              Keine Dokumente in dieser Kategorie.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FileIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType?.startsWith('image/')) {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    )
  }
  if (mimeType === 'application/pdf') {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}
