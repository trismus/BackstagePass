'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Clock,
  AlertTriangle,
  Download,
  BarChart3,
  TrendingUp,
  UserX,
  Award,
} from 'lucide-react'
import {
  generatePerformanceReport,
  exportPerformanceReportCSV,
  type PerformanceReport,
} from '@/lib/actions/performance-report'

interface PerformanceReportViewProps {
  veranstaltungId: string
  helferStatus: string | null
}

export function PerformanceReportView({
  veranstaltungId,
  helferStatus,
}: PerformanceReportViewProps) {
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadReport = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await generatePerformanceReport(veranstaltungId)
      setReport(data)
    } catch (err) {
      setError('Fehler beim Laden des Reports')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [veranstaltungId])

  useEffect(() => {
    if (helferStatus === 'abgeschlossen') {
      loadReport()
    }
  }, [helferStatus, loadReport])

  const handleExportCSV = async () => {
    const result = await exportPerformanceReportCSV(veranstaltungId)
    if (result.success && result.csv) {
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Performance_Report_${report?.veranstaltungTitel || 'Export'}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  // Only show when abgeschlossen
  if (helferStatus !== 'abgeschlossen') {
    return null
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="rounded-lg border border-error-200 bg-error-50 p-6">
        <p className="text-error-700">{error || 'Report konnte nicht geladen werden'}</p>
        <button
          onClick={loadReport}
          className="mt-3 text-sm text-error-600 hover:text-error-800 underline"
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Performance Report</h2>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <Download className="h-4 w-4" />
          CSV Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Helfer */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 text-neutral-500">
            <Users className="h-4 w-4" />
            <span className="text-sm">Helfer</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {report.helferUebersicht.erschienen}/{report.helferUebersicht.angemeldet}
          </p>
          <p className="text-sm text-success-600">
            {report.helferUebersicht.erscheinenRate}% erschienen
          </p>
        </div>

        {/* Auslastung */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 text-neutral-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Auslastung</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {report.schichtAuslastung.auslastungProzent}%
          </p>
          <p className="text-sm text-neutral-500">
            {report.schichtAuslastung.besetzteSlots}/{report.schichtAuslastung.gesamtSlots} Slots
          </p>
        </div>

        {/* No-Shows */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 text-neutral-500">
            <UserX className="h-4 w-4" />
            <span className="text-sm">No-Shows</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {report.helferUebersicht.noShows}
          </p>
          <p className={`text-sm ${report.helferUebersicht.noShowRate > 10 ? 'text-error-600' : 'text-neutral-500'}`}>
            {report.helferUebersicht.noShowRate}% Rate
          </p>
        </div>

        {/* Warteliste */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 text-neutral-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Warteliste</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {report.wartelisteAktivitaet.zugewiesen}/{report.wartelisteAktivitaet.gesamt}
          </p>
          <p className="text-sm text-neutral-500">
            {report.wartelisteAktivitaet.conversionRate}% zugewiesen
          </p>
        </div>
      </div>

      {/* Zeitblock Auslastung */}
      {report.schichtAuslastung.proZeitblock.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3">
            <h3 className="font-medium text-neutral-900">Auslastung pro Zeitblock</h3>
          </div>
          <div className="p-4 space-y-3">
            {report.schichtAuslastung.proZeitblock.map((zb, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{zb.name}</span>
                  <span className="font-medium">
                    {zb.besetzt}/{zb.slots} ({zb.auslastung}%)
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full ${
                      zb.auslastung >= 80
                        ? 'bg-success-500'
                        : zb.auslastung >= 50
                          ? 'bg-warning-500'
                          : 'bg-error-500'
                    }`}
                    style={{ width: `${Math.min(zb.auslastung, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Shifts */}
      {report.kritischeSchichten.length > 0 && (
        <div className="rounded-lg border border-warning-200 bg-warning-50">
          <div className="border-b border-warning-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-600" />
              <h3 className="font-medium text-warning-900">
                Kritische Schichten ({report.kritischeSchichten.length})
              </h3>
            </div>
          </div>
          <div className="divide-y divide-warning-200">
            {report.kritischeSchichten.slice(0, 5).map((ks, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-warning-900">{ks.rolle}</p>
                  <p className="text-sm text-warning-700">{ks.zeitblock}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-warning-900">{ks.auslastungProzent}%</p>
                  <p className="text-sm text-warning-700">{ks.fehlend} fehlend</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Helpers */}
      {report.topHelfer.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary-600" />
              <h3 className="font-medium text-neutral-900">Top Helfer</h3>
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {report.topHelfer.slice(0, 5).map((h, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-neutral-200 text-neutral-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-neutral-100 text-neutral-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{h.name}</p>
                    {h.email && (
                      <p className="text-sm text-neutral-500">{h.email}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-neutral-900">
                    {h.schichten} Schicht{h.schichten !== 1 ? 'en' : ''}
                  </p>
                  <p className="text-sm text-neutral-500">{h.stunden}h</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No-Show Analysis */}
      {report.noShowAnalyse.helfer.length > 0 && (
        <div className="rounded-lg border border-error-200 bg-error-50">
          <div className="border-b border-error-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-error-600" />
              <h3 className="font-medium text-error-900">
                No-Shows ({report.noShowAnalyse.helfer.length})
              </h3>
            </div>
          </div>
          <div className="p-4">
            {report.noShowAnalyse.zeitblockMitHoechsterRate && (
              <p className="mb-3 text-sm text-error-700">
                Hoechste No-Show-Rate: <strong>{report.noShowAnalyse.zeitblockMitHoechsterRate.name}</strong>{' '}
                ({report.noShowAnalyse.zeitblockMitHoechsterRate.rate}%)
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {report.noShowAnalyse.helfer.map((h, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-error-100 px-3 py-1 text-sm text-error-800"
                >
                  {h.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-neutral-400 text-right">
        Report generiert am {new Date(report.generatedAt).toLocaleString('de-CH')}
      </p>
    </div>
  )
}
