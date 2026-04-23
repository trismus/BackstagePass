'use client'

import { useState, useTransition } from 'react'
import { sendHelferSchichtErinnerung, type ErinnerungResult } from '@/lib/actions/helfer-erinnerung'

export function HelferErinnerungButton() {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<ErinnerungResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  function handleSend() {
    startTransition(async () => {
      const res = await sendHelferSchichtErinnerung()
      setResult(res)
      setShowConfirm(false)
    })
  }

  if (result) {
    return (
      <div className="space-y-2">
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            result.errors > 0 && result.sent === 0
              ? 'border-error-200 bg-error-50 text-error-800'
              : result.errors > 0
                ? 'border-warning-200 bg-warning-50 text-warning-800'
                : 'border-success-200 bg-success-50 text-success-800'
          }`}
        >
          <p className="font-medium">
            {result.sent} E-Mail{result.sent !== 1 ? 's' : ''} gesendet
            {result.errors > 0 && ` · ${result.errors} Fehler`}
            {result.skipped > 0 && ` · ${result.skipped} übersprungen`}
          </p>
          {result.details.length > 0 && (
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="mt-1 text-xs underline opacity-75 hover:opacity-100"
            >
              {showDetails ? 'Details ausblenden' : 'Details anzeigen'}
            </button>
          )}
        </div>

        {showDetails && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">E-Mail</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.details.map((d, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-900">{d.name}</td>
                    <td className="px-3 py-2 text-gray-600">{d.email}</td>
                    <td className="px-3 py-2">
                      {d.status === 'sent' && (
                        <span className="text-success-700">✓ Gesendet</span>
                      )}
                      {d.status === 'skipped' && (
                        <span className="text-gray-400">– Übersprungen</span>
                      )}
                      {d.status === 'error' && (
                        <span className="text-error-700" title={d.reason}>
                          ✗ Fehler
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => { setResult(null); setShowDetails(false) }}
          className="text-xs text-gray-500 underline hover:text-gray-700"
        >
          Erneut senden
        </button>
      </div>
    )
  }

  if (showConfirm) {
    return (
      <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3">
        <p className="text-sm font-medium text-warning-800">
          Schicht-Erinnerung an alle Helfer senden?
        </p>
        <p className="mt-1 text-xs text-warning-700">
          Alle Helfer mit eingetragenen zukünftigen Schichten erhalten eine E-Mail mit ihrer Schichtübersicht.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSend}
            disabled={isPending}
            className="rounded bg-warning-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-warning-700 disabled:opacity-50"
          >
            {isPending ? 'Wird gesendet…' : 'Ja, jetzt senden'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isPending}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
      Schicht-Erinnerung senden
    </button>
  )
}
