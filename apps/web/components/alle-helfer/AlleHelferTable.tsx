'use client'

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type {
  HelferUebersicht,
  AlleHelferFilterParams,
  AlleHelferSortField,
  HelferTyp,
  HelferEinsatzDetail,
} from '@/lib/actions/alle-helfer'
import { deleteHelferFromList, getHelferEinsaetze } from '@/lib/actions/alle-helfer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { HelferExportDialog } from './HelferExportDialog'
import { HelferEditDialog } from './HelferEditDialog'

interface AlleHelferTableProps {
  helfer: HelferUebersicht[]
  filterParams: AlleHelferFilterParams
}

const TYP_OPTIONS: { value: HelferTyp | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'intern', label: 'Intern' },
  { value: 'extern', label: 'Extern' },
]

const STATUS_STYLES: Record<string, string> = {
  zugesagt: 'bg-success-100 text-success-800',
  bestaetigt: 'bg-success-100 text-success-800',
  angemeldet: 'bg-info-100 text-info-800',
  vorgeschlagen: 'bg-warning-100 text-warning-800',
  warteliste: 'bg-warning-100 text-warning-800',
  abgesagt: 'bg-error-100 text-error-800',
  abgelehnt: 'bg-error-100 text-error-800',
  erschienen: 'bg-success-100 text-success-800',
  nicht_erschienen: 'bg-error-100 text-error-800',
}

const STATUS_LABELS: Record<string, string> = {
  zugesagt: 'Zugesagt',
  bestaetigt: 'Bestätigt',
  angemeldet: 'Angemeldet',
  vorgeschlagen: 'Vorgeschlagen',
  warteliste: 'Warteliste',
  abgesagt: 'Abgesagt',
  abgelehnt: 'Abgelehnt',
  erschienen: 'Erschienen',
  nicht_erschienen: 'Nicht erschienen',
}

function helferKey(h: HelferUebersicht): string {
  return `${h.typ}-${h.id}`
}

function formatDateDeCH(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTimeValue(timeStr: string | null): string {
  if (!timeStr) return ''
  // Handle both ISO timestamps and HH:MM:SS time strings
  if (timeStr.includes('T')) {
    return new Date(timeStr).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  // Time string like "14:00:00" or "14:00"
  return timeStr.substring(0, 5)
}

function EinsatzStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-800'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  )
}

function EinsatzDetailPanel({
  helferId,
  helferTyp,
}: {
  helferId: string
  helferTyp: HelferTyp
}) {
  const [einsaetze, setEinsaetze] = useState<HelferEinsatzDetail[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data on mount
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      const result = await getHelferEinsaetze(helferId, helferTyp)
      if (cancelled) return

      if (result.success && result.data) {
        setEinsaetze(result.data)
      } else {
        setError(result.error ?? 'Fehler beim Laden der Einsätze')
      }
      setIsLoading(false)
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [helferId, helferTyp])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-6 py-4 text-sm text-gray-500">
        <svg
          className="h-4 w-4 animate-spin text-primary-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Einsätze werden geladen...
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-4 text-sm text-error-600">
        {error}
      </div>
    )
  }

  if (!einsaetze || einsaetze.length === 0) {
    return (
      <div className="px-6 py-4 text-sm text-gray-500">
        Keine Einsätze gefunden
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="pb-2 pr-4">Veranstaltung</th>
            <th className="pb-2 pr-4">Datum</th>
            <th className="pb-2 pr-4">Rolle</th>
            <th className="pb-2 pr-4">Zeit</th>
            <th className="pb-2 pr-4">System</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {einsaetze.map((e) => (
            <tr key={`${e.system}-${e.id}`}>
              <td className="py-2 pr-4 font-medium text-gray-900">
                {e.veranstaltung}
              </td>
              <td className="py-2 pr-4 text-gray-600">
                {formatDateDeCH(e.datum)}
              </td>
              <td className="py-2 pr-4 text-gray-600">{e.rolle}</td>
              <td className="py-2 pr-4 text-gray-600">
                {e.zeitblock_start
                  ? `${formatTimeValue(e.zeitblock_start)}${e.zeitblock_end ? ` - ${formatTimeValue(e.zeitblock_end)}` : ''}`
                  : '-'}
              </td>
              <td className="py-2 pr-4">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {e.system === 'a' ? 'Helferliste' : 'Aufführung'}
                </span>
              </td>
              <td className="py-2">
                <EinsatzStatusBadge status={e.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AlleHelferTable({
  helfer,
  filterParams = {},
}: AlleHelferTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiedEmails, setCopiedEmails] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<HelferUebersicht | null>(null)
  const [isPending, startTransition] = useTransition()
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const {
    search = '',
    typ = 'alle',
    sortBy = 'name',
    sortOrder = 'asc',
  } = filterParams

  const updateParams = (updates: Partial<AlleHelferFilterParams>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      params.delete(key)
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, String(value))
      }
    })

    // Remove default values
    if (params.get('typ') === 'alle') params.delete('typ')
    if (params.get('sortBy') === 'name') params.delete('sortBy')
    if (params.get('sortOrder') === 'asc') params.delete('sortOrder')
    if (params.get('search') === '') params.delete('search')

    // Reset selection on filter change
    setSelectedIds(new Set())

    const queryString = params.toString()
    router.push(`/alle-helfer${queryString ? `?${queryString}` : ''}` as never)
  }

  const toggleSort = (field: AlleHelferSortField) => {
    if (sortBy === field) {
      updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      updateParams({ sortBy: field, sortOrder: 'asc' })
    }
  }

  const allKeys = useMemo(() => new Set(helfer.map(helferKey)), [helfer])

  const allSelected = helfer.length > 0 && allKeys.size === selectedIds.size &&
    [...allKeys].every((k) => selectedIds.has(k))

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allKeys))
    }
  }, [allSelected, allKeys])

  const toggleSelect = useCallback((key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const toggleExpand = useCallback((key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key))
  }, [])

  const selectedHelfer = useMemo(
    () => helfer.filter((h) => selectedIds.has(helferKey(h))),
    [helfer, selectedIds]
  )

  const handleCopyEmails = async () => {
    const emails = selectedHelfer
      .filter((h) => h.email)
      .map((h) => h.email!)
      .filter((e, i, a) => a.indexOf(e) === i)
      .join('; ')

    if (!emails) return

    try {
      await navigator.clipboard.writeText(emails)
      setCopiedEmails(true)
      setTimeout(() => setCopiedEmails(false), 2000)
    } catch (err) {
      console.error('Failed to copy emails:', err)
    }
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteHelferFromList(deleteTarget.id, deleteTarget.typ)
      if (!result.success) {
        console.error('Delete failed:', result.error)
      }
      setDeleteTarget(null)
    })
  }

  const SortIcon = ({ field }: { field: AlleHelferSortField }) => {
    if (sortBy !== field) return <span className="ml-1 text-gray-400">&#8597;</span>
    return (
      <span className="ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
    )
  }

  const selectedEmailCount = selectedHelfer.filter((h) => h.email).length

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Suchen nach Name oder E-Mail..."
            defaultValue={search}
            onChange={(e) => {
              const value = e.target.value
              const timeout = setTimeout(() => {
                updateParams({ search: value })
              }, 300)
              return () => clearTimeout(timeout)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateParams({ search: e.currentTarget.value })
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex rounded-lg border border-gray-300 bg-white">
          {TYP_OPTIONS.map((option, idx) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateParams({ typ: option.value })}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                typ === option.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === TYP_OPTIONS.length - 1 ? 'rounded-r-lg' : 'border-l border-gray-300'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} ausgewählt
          </span>

          <div className="h-4 w-px bg-blue-200" />

          <button
            type="button"
            onClick={handleCopyEmails}
            disabled={selectedEmailCount === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
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
                E-Mails kopieren
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowExportDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            Auswahl aufheben
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-2 py-3">
                <span className="sr-only">Aufklappen</span>
              </th>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Alle auswählen"
                />
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                onClick={() => toggleSort('name')}
              >
                Name <SortIcon field="name" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Typ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                E-Mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Telefon
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                onClick={() => toggleSort('einsaetze')}
              >
                Einsätze <SortIcon field="einsaetze" />
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                onClick={() => toggleSort('letzter_einsatz')}
              >
                Letzter Einsatz <SortIcon field="letzter_einsatz" />
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {helfer.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  Keine Helfer gefunden
                </td>
              </tr>
            ) : (
              helfer.map((h) => {
                const key = helferKey(h)
                const isExpanded = expandedKey === key
                return (
                  <HelferRow
                    key={key}
                    helfer={h}
                    isSelected={selectedIds.has(key)}
                    isExpanded={isExpanded}
                    onToggleSelect={() => toggleSelect(key)}
                    onToggleExpand={() => toggleExpand(key)}
                    onDelete={() => setDeleteTarget(h)}
                  />
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Count */}
      <div className="mt-4 text-sm text-gray-500">
        {helfer.length} Helfer
        {typ !== 'alle' && ` (${typ === 'intern' ? 'intern' : 'extern'})`}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <HelferExportDialog
          helfer={selectedHelfer}
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Helfer löschen"
        description={
          deleteTarget?.typ === 'extern'
            ? `${deleteTarget.vorname} ${deleteTarget.nachname} wirklich löschen? Das Helferprofil wird entfernt.`
            : `${deleteTarget?.vorname ?? ''} ${deleteTarget?.nachname ?? ''} aus der Helferliste entfernen? Alle Schicht-Zuweisungen werden gelöscht. Die Person bleibt als Mitglied erhalten.`
        }
        confirmLabel={isPending ? 'Löschen...' : 'Löschen'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function HelferRow({
  helfer: h,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onDelete,
}: {
  helfer: HelferUebersicht
  isSelected: boolean
  isExpanded: boolean
  onToggleSelect: () => void
  onToggleExpand: () => void
  onDelete: () => void
}) {
  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${
          isExpanded ? 'bg-primary-50' : 'hover:bg-gray-50'
        }`}
        onClick={onToggleExpand}
      >
        <td className="w-8 px-2 py-4 text-center">
          <span
            className={`inline-block text-xs text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          >
            &#9654;
          </span>
        </td>
        <td className="w-10 px-3 py-4" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label={`${h.vorname} ${h.nachname} auswählen`}
          />
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <span className="font-medium text-gray-900">
            {h.vorname} {h.nachname}
          </span>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              h.typ === 'intern'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {h.typ === 'intern' ? 'Intern' : 'Extern'}
          </span>
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
          {h.email || '-'}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
          {h.telefon || '-'}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
          {h.einsaetze_count}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
          {formatDateDeCH(h.letzter_einsatz)}
        </td>
        <td
          className="whitespace-nowrap px-6 py-4 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="inline-flex items-center gap-1">
            <HelferEditDialog helfer={h} />
            <button
              type="button"
              onClick={onDelete}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Löschen"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className="border-b border-primary-200 bg-primary-50/50">
            <EinsatzDetailPanel helferId={h.id} helferTyp={h.typ} />
          </td>
        </tr>
      )}
    </>
  )
}
