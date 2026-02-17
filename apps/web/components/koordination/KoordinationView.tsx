'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { KoordinationData } from '@/lib/actions/koordination'
import { removeHelferFromSchicht } from '@/lib/actions/koordination'
import { MetricsCards } from './MetricsCards'
import { ZeitblockAccordion } from './ZeitblockAccordion'
import { QuickActions } from './QuickActions'
import { StatistikSection } from './StatistikSection'
import { HelferAssignmentModal } from './HelferAssignmentModal'
import { ExportHandler } from './ExportHandler'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PerformanceReportView } from '@/components/reports'

interface KoordinationViewProps {
  data: KoordinationData
}

export function KoordinationView({ data: initialData }: KoordinationViewProps) {
  const router = useRouter()
  const [data] = useState(initialData)

  // Assignment modal state
  const [assignmentModal, setAssignmentModal] = useState<{
    open: boolean
    schichtId: string
    schichtRolle: string
    benoetigteSkills: string[]
  }>({
    open: false,
    schichtId: '',
    schichtRolle: '',
    benoetigteSkills: [],
  })

  // Remove helfer confirm state
  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean
    zuweisungId: string
    helferName: string
  }>({
    open: false,
    zuweisungId: '',
    helferName: '',
  })
  const [isRemoving, setIsRemoving] = useState(false)

  // Filter state
  const [filter, setFilter] = useState({
    zeitblock: 'all',
    besetzung: 'all', // all, full, partial, empty
    sichtbarkeit: 'all', // all, public, intern
  })

  // Find schicht by ID
  const findSchicht = (schichtId: string) => {
    for (const zb of data.zeitbloecke) {
      const schicht = zb.schichten.find((s) => s.id === schichtId)
      if (schicht) return schicht
    }
    return null
  }

  // Handle assignment
  const handleAssign = useCallback((schichtId: string) => {
    const schicht = findSchicht(schichtId)
    setAssignmentModal({
      open: true,
      schichtId,
      schichtRolle: schicht?.rolle ?? '',
      benoetigteSkills: schicht?.benoetigte_skills ?? [],
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.zeitbloecke])

  // Handle remove helfer
  const handleRemoveHelfer = useCallback((zuweisungId: string, helferName: string) => {
    setRemoveConfirm({ open: true, zuweisungId, helferName })
  }, [])

  const confirmRemoveHelfer = async () => {
    if (!removeConfirm.zuweisungId) return

    setIsRemoving(true)
    try {
      const result = await removeHelferFromSchicht(removeConfirm.zuweisungId)
      if (result.success) {
        router.refresh()
      }
    } finally {
      setIsRemoving(false)
      setRemoveConfirm({ open: false, zuweisungId: '', helferName: '' })
    }
  }

  // Handle status change
  const handleStatusChange = () => {
    router.refresh()
  }

  // Handle assignment success
  const handleAssignmentSuccess = () => {
    router.refresh()
  }

  // Filter zeitbloecke
  const getFilteredZeitbloecke = () => {
    let filtered = [...data.zeitbloecke]

    // Filter by zeitblock
    if (filter.zeitblock !== 'all') {
      filtered = filtered.filter((zb) => zb.id === filter.zeitblock)
    }

    // Filter schichten within zeitbloecke
    filtered = filtered.map((zb) => {
      let schichten = [...zb.schichten]

      // Filter by besetzung
      if (filter.besetzung === 'full') {
        schichten = schichten.filter((s) => s.anzahlBesetzt >= s.anzahl_benoetigt)
      } else if (filter.besetzung === 'partial') {
        schichten = schichten.filter((s) =>
          s.anzahlBesetzt > 0 && s.anzahlBesetzt < s.anzahl_benoetigt
        )
      } else if (filter.besetzung === 'empty') {
        schichten = schichten.filter((s) =>
          s.anzahlBesetzt < s.anzahl_benoetigt * 0.5
        )
      }

      // Filter by sichtbarkeit
      if (filter.sichtbarkeit === 'public') {
        schichten = schichten.filter((s) => s.sichtbarkeit === 'public')
      } else if (filter.sichtbarkeit === 'intern') {
        schichten = schichten.filter((s) => s.sichtbarkeit !== 'public')
      }

      return { ...zb, schichten }
    })

    // Remove empty zeitbloecke
    filtered = filtered.filter((zb) => zb.schichten.length > 0)

    return filtered
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <MetricsCards
        metrics={data.metrics}
        helferStatus={data.veranstaltung.helfer_status}
      />

      {/* Quick Actions */}
      <ExportHandler
        veranstaltungId={data.veranstaltung.id}
        veranstaltungTitel={data.veranstaltung.titel}
        veranstaltungDatum={data.veranstaltung.datum}
      >
        {({ exportPDF, exportExcel }) => (
          <QuickActions
            veranstaltungId={data.veranstaltung.id}
            helferStatus={data.veranstaltung.helfer_status}
            onStatusChange={handleStatusChange}
            onExportPDF={exportPDF}
            onExportExcel={exportExcel}
          />
        )}
      </ExportHandler>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Zeitblock</label>
          <select
            value={filter.zeitblock}
            onChange={(e) => setFilter({ ...filter, zeitblock: e.target.value })}
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Alle Zeitbloecke</option>
            {data.zeitbloecke.map((zb) => (
              <option key={zb.id} value={zb.id}>{zb.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Besetzung</label>
          <select
            value={filter.besetzung}
            onChange={(e) => setFilter({ ...filter, besetzung: e.target.value })}
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Alle</option>
            <option value="full">Voll besetzt</option>
            <option value="partial">Teilweise besetzt</option>
            <option value="empty">Kritisch (&lt;50%)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Sichtbarkeit</label>
          <select
            value={filter.sichtbarkeit}
            onChange={(e) => setFilter({ ...filter, sichtbarkeit: e.target.value })}
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Alle</option>
            <option value="public">Nur oeffentliche</option>
            <option value="intern">Nur interne</option>
          </select>
        </div>

        {/* Reset filter */}
        {(filter.zeitblock !== 'all' || filter.besetzung !== 'all' || filter.sichtbarkeit !== 'all') && (
          <button
            onClick={() => setFilter({ zeitblock: 'all', besetzung: 'all', sichtbarkeit: 'all' })}
            className="self-end text-sm text-primary-600 hover:text-primary-700"
          >
            Filter zuruecksetzen
          </button>
        )}
      </div>

      {/* Zeitbloecke */}
      <ZeitblockAccordion
        zeitbloecke={getFilteredZeitbloecke()}
        onAssign={handleAssign}
        onRemoveHelfer={handleRemoveHelfer}
      />

      {/* Warteliste Sidebar (if any) */}
      {data.alleWarteliste.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-medium text-blue-900">
            Warteliste ({data.alleWarteliste.length} Helfer)
          </h3>
          <p className="mt-1 text-sm text-blue-700">
            Diese Helfer warten auf einen freien Platz
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.alleWarteliste.map((w) => (
              <span
                key={w.id}
                className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm text-blue-800 shadow-sm"
              >
                {w.name}
                {w.isExtern && (
                  <span className="ml-1 text-xs text-blue-600">(extern)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Statistiken */}
      <StatistikSection veranstaltungId={data.veranstaltung.id} />

      {/* Performance Report (only when abgeschlossen) */}
      <PerformanceReportView
        veranstaltungId={data.veranstaltung.id}
        helferStatus={data.veranstaltung.helfer_status}
      />

      {/* Assignment Modal */}
      <HelferAssignmentModal
        open={assignmentModal.open}
        schichtId={assignmentModal.schichtId}
        schichtRolle={assignmentModal.schichtRolle}
        benoetigteSkills={assignmentModal.benoetigteSkills}
        veranstaltungId={data.veranstaltung.id}
        onClose={() => setAssignmentModal({ open: false, schichtId: '', schichtRolle: '', benoetigteSkills: [] })}
        onSuccess={handleAssignmentSuccess}
      />

      {/* Remove Confirm Dialog */}
      <ConfirmDialog
        open={removeConfirm.open}
        title="Helfer entfernen"
        message={`Moechten Sie ${removeConfirm.helferName} wirklich von dieser Schicht entfernen?`}
        confirmLabel={isRemoving ? 'Wird entfernt...' : 'Entfernen'}
        variant="danger"
        onConfirm={confirmRemoveHelfer}
        onCancel={() => setRemoveConfirm({ open: false, zuweisungId: '', helferName: '' })}
      />
    </div>
  )
}
