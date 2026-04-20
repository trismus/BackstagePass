'use client'

import { useState } from 'react'
import { sendUpcomingScheduleEmails, getUpcomingScheduleStats } from '@/lib/actions/schedule-emails'
import type { ScheduleEmailResult, ScheduleEmailStats } from '@/lib/actions/schedule-emails'

type State =
  | { phase: 'idle' }
  | { phase: 'loading-stats' }
  | { phase: 'confirm'; stats: ScheduleEmailStats }
  | { phase: 'sending' }
  | { phase: 'done'; result: ScheduleEmailResult }
  | { phase: 'error'; message: string }

export function ScheduleMailButton() {
  const [state, setState] = useState<State>({ phase: 'idle' })

  async function handlePreview() {
    setState({ phase: 'loading-stats' })
    try {
      const stats = await getUpcomingScheduleStats()
      setState({ phase: 'confirm', stats })
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  async function handleSend() {
    setState({ phase: 'sending' })
    try {
      const result = await sendUpcomingScheduleEmails()
      setState({ phase: 'done', result })
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  function handleReset() {
    setState({ phase: 'idle' })
  }

  if (state.phase === 'idle') {
    return (
      <button
        onClick={handlePreview}
        className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 p-4 text-left transition-colors hover:bg-neutral-50"
      >
        <svg className="h-6 w-6 shrink-0 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <div>
          <p className="font-medium text-neutral-900">Terminübersicht versenden</p>
          <p className="text-sm text-neutral-500">Alle Helfer über ihre nächsten 14 Tage informieren</p>
        </div>
      </button>
    )
  }

  if (state.phase === 'loading-stats') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4">
        <svg className="h-5 w-5 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-neutral-600">Lade Daten…</p>
      </div>
    )
  }

  if (state.phase === 'confirm') {
    const { stats } = state
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-amber-900">Terminübersicht versenden?</p>
            {stats.helfer_count > 0 ? (
              <p className="text-sm text-amber-800">
                <strong>{stats.helfer_count} Helfer</strong> haben insgesamt{' '}
                <strong>{stats.shifts_count} Einsätze</strong> in den nächsten 14 Tagen.
                Jede Person erhält eine E-Mail mit ihrer persönlichen Übersicht.
              </p>
            ) : (
              <p className="text-sm text-amber-800">
                Keine bestätigten Helfer mit Einsätzen in den nächsten 14 Tagen gefunden.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {stats.helfer_count > 0 && (
            <button
              onClick={handleSend}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
            >
              Jetzt senden
            </button>
          )}
          <button
            onClick={handleReset}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  if (state.phase === 'sending') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4">
        <svg className="h-5 w-5 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-neutral-600">E-Mails werden gesendet…</p>
      </div>
    )
  }

  if (state.phase === 'done') {
    const { result } = state
    const hasErrors = result.errors.length > 0
    return (
      <div className={`rounded-lg border p-4 space-y-2 ${hasErrors ? 'border-warning-200 bg-warning-50' : 'border-success-200 bg-success-50'}`}>
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <svg className="h-5 w-5 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <p className={`font-medium ${hasErrors ? 'text-warning-900' : 'text-success-900'}`}>
            {result.sent} E-Mail{result.sent !== 1 ? 's' : ''} gesendet
            {result.failed > 0 ? `, ${result.failed} fehlgeschlagen` : ''}
          </p>
        </div>
        {result.errors.length > 0 && (
          <ul className="text-xs text-warning-800 space-y-0.5 list-disc list-inside">
            {result.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
        <button
          onClick={handleReset}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          Schließen
        </button>
      </div>
    )
  }

  // error state
  const { message } = state as { phase: 'error'; message: string }
  return (
    <div className="rounded-lg border border-error-200 bg-error-50 p-4 space-y-2">
      <p className="font-medium text-error-900">Fehler beim Senden</p>
      <p className="text-sm text-error-700">{message}</p>
      <button
        onClick={handleReset}
        className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        Schließen
      </button>
    </div>
  )
}
