'use client'

import { useState } from 'react'
import { getExportData, generateExcelData } from '@/lib/actions/helfer-export'

interface ExportHandlerProps {
  veranstaltungId: string
  veranstaltungTitel: string
  veranstaltungDatum: string
  children: (handlers: {
    exportPDF: () => void
    exportExcel: () => void
    isExporting: boolean
  }) => React.ReactNode
}

export function ExportHandler({
  veranstaltungId,
  veranstaltungTitel,
  veranstaltungDatum,
  children,
}: ExportHandlerProps) {
  const [isExporting, setIsExporting] = useState(false)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\./g, '-')
  }

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '_')
  }

  const exportPDF = async () => {
    setIsExporting(true)
    try {
      const data = await getExportData(veranstaltungId)
      if (!data) return

      // Create a printable HTML content
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('Popup blockiert. Bitte erlauben Sie Popups fuer diese Seite.')
        return
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Helferliste - ${data.veranstaltung.titel}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
            h1 { font-size: 18px; margin-bottom: 5px; }
            h2 { font-size: 14px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .header { margin-bottom: 20px; }
            .meta { color: #666; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .zeitblock { background-color: #e8e8e8; font-weight: bold; }
            .empty { color: #999; font-style: italic; }
            .footer { margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Helferliste: ${data.veranstaltung.titel}</h1>
            <p class="meta">
              Datum: ${new Date(data.veranstaltung.datum).toLocaleDateString('de-CH', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}<br>
              ${data.veranstaltung.startzeit ? `Zeit: ${data.veranstaltung.startzeit} - ${data.veranstaltung.endzeit}` : ''}<br>
              ${data.veranstaltung.ort ? `Ort: ${data.veranstaltung.ort}` : ''}
            </p>
          </div>

          <h2>Schichten und Helfer</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 20%">Zeitblock</th>
                <th style="width: 20%">Rolle</th>
                <th style="width: 25%">Helfer</th>
                <th style="width: 20%">E-Mail</th>
                <th style="width: 15%">Telefon</th>
              </tr>
            </thead>
            <tbody>
              ${data.schichten.map((s) => {
                if (s.helfer.length === 0) {
                  return `
                    <tr>
                      <td>${s.zeitblockName} (${s.zeitblockStart} - ${s.zeitblockEnd})</td>
                      <td>${s.rolle}</td>
                      <td class="empty" colspan="3">Noch nicht besetzt (${s.benoetigt} benoetigt)</td>
                    </tr>
                  `
                }
                return s.helfer.map((h, i) => `
                  <tr>
                    ${i === 0 ? `<td rowspan="${s.helfer.length}">${s.zeitblockName} (${s.zeitblockStart} - ${s.zeitblockEnd})</td>` : ''}
                    ${i === 0 ? `<td rowspan="${s.helfer.length}">${s.rolle}</td>` : ''}
                    <td>${h.name}</td>
                    <td>${h.email}</td>
                    <td>${h.telefon}</td>
                  </tr>
                `).join('')
              }).join('')}
            </tbody>
          </table>

          <h2>Helfer-Uebersicht</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>E-Mail</th>
                <th>Telefon</th>
                <th>Anzahl Schichten</th>
              </tr>
            </thead>
            <tbody>
              ${data.helferUebersicht.map((h) => `
                <tr>
                  <td>${h.name}</td>
                  <td>${h.email}</td>
                  <td>${h.telefon}</td>
                  <td>${h.anzahlSchichten}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generiert am: ${new Date(data.generatedAt).toLocaleString('de-CH')}</p>
          </div>

          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
              Als PDF drucken
            </button>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(html)
      printWindow.document.close()
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Fehler beim Erstellen des PDFs')
    } finally {
      setIsExporting(false)
    }
  }

  const exportExcel = async () => {
    setIsExporting(true)
    try {
      const result = await generateExcelData(veranstaltungId)
      if (!result.success || !result.data) {
        alert('Fehler beim Erstellen der Excel-Datei')
        return
      }

      // Dynamic import of xlsx library
      const XLSX = await import('xlsx')

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Add sheets
      const schichtenWs = XLSX.utils.json_to_sheet(result.data.schichten)
      XLSX.utils.book_append_sheet(wb, schichtenWs, 'Schichten')

      const helferWs = XLSX.utils.json_to_sheet(result.data.helfer)
      XLSX.utils.book_append_sheet(wb, helferWs, 'Helfer-Uebersicht')

      // Generate filename
      const filename = `Helferliste_${sanitizeFilename(veranstaltungTitel)}_${formatDate(veranstaltungDatum)}.xlsx`

      // Download
      XLSX.writeFile(wb, filename)
    } catch (err) {
      console.error('Excel export error:', err)
      alert('Fehler beim Erstellen der Excel-Datei')
    } finally {
      setIsExporting(false)
    }
  }

  return <>{children({ exportPDF, exportExcel, isExporting })}</>
}
