'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HealthCheck {
  status: 'ok' | 'error'
  timestamp: string
  checks: {
    env: {
      status: 'ok' | 'error'
      missing: string[]
      present: string[]
    }
    supabase: {
      status: 'ok' | 'error' | 'skipped'
      message: string
      latency?: number
    }
    vercel: {
      status: 'ok' | 'unknown'
      environment: string | null
      region: string | null
    }
  }
}

function StatusBadge({ status }: { status: 'ok' | 'error' | 'skipped' | 'unknown' }) {
  const styles = {
    ok: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    skipped: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    unknown: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const labels = {
    ok: 'OK',
    error: 'Fehler',
    skipped: 'Übersprungen',
    unknown: 'Unbekannt',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

function CheckCard({
  title,
  status,
  children,
}: {
  title: string
  status: 'ok' | 'error' | 'skipped' | 'unknown'
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <StatusBadge status={status} />
      </div>
      <div className="space-y-2 text-sm text-gray-600">{children}</div>
    </div>
  )
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch('/api/health')
        const data = await res.json()
        setHealth(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verbindungsfehler')
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Prüfe Systemstatus...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Verbindungsfehler</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Zurück zur Startseite
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <span>&larr;</span>
            <span>Zurück zur Startseite</span>
          </Link>
        </nav>

        <div className="mb-8 text-center">
          <div
            className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
              health?.status === 'ok' ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <span className="text-4xl">{health?.status === 'ok' ? '✓' : '!'}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
          <p className="mt-2 text-gray-600">
            {health?.status === 'ok'
              ? 'Alle Systeme funktionieren normal'
              : 'Es gibt Probleme mit der Konfiguration'}
          </p>
          {health?.timestamp && (
            <p className="mt-1 text-xs text-gray-400">
              Zuletzt geprüft: {new Date(health.timestamp).toLocaleString('de-DE')}
            </p>
          )}
        </div>

        <div className="grid gap-6">
          {/* Environment Variables */}
          <CheckCard title="Environment Variables" status={health?.checks.env.status || 'unknown'}>
            {health?.checks.env.present.map((v) => (
              <div key={v} className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <code className="rounded bg-gray-100 px-1">{v}</code>
              </div>
            ))}
            {health?.checks.env.missing.map((v) => (
              <div key={v} className="flex items-center gap-2">
                <span className="text-red-600">✗</span>
                <code className="rounded bg-red-50 px-1">{v}</code>
                <span className="text-red-600">fehlt</span>
              </div>
            ))}
          </CheckCard>

          {/* Supabase */}
          <CheckCard title="Supabase Datenbank" status={health?.checks.supabase.status || 'unknown'}>
            <p>{health?.checks.supabase.message}</p>
            {health?.checks.supabase.latency !== undefined && (
              <p className="text-gray-400">Latenz: {health.checks.supabase.latency}ms</p>
            )}
          </CheckCard>

          {/* Vercel */}
          <CheckCard title="Vercel Deployment" status={health?.checks.vercel.status || 'unknown'}>
            {health?.checks.vercel.environment ? (
              <>
                <p>
                  Environment:{' '}
                  <code className="rounded bg-gray-100 px-1">
                    {health.checks.vercel.environment}
                  </code>
                </p>
                {health.checks.vercel.region && (
                  <p>
                    Region:{' '}
                    <code className="rounded bg-gray-100 px-1">{health.checks.vercel.region}</code>
                  </p>
                )}
              </>
            ) : (
              <p>Lokale Entwicklungsumgebung (nicht auf Vercel)</p>
            )}
          </CheckCard>
        </div>

        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="font-medium text-blue-800">API Endpoint</h4>
          <p className="mt-1 text-sm text-blue-700">
            Du kannst den Health-Check auch direkt aufrufen:
          </p>
          <code className="mt-2 block rounded bg-white px-3 py-2 text-sm">
            GET /api/health
          </code>
        </div>
      </div>
    </main>
  )
}
