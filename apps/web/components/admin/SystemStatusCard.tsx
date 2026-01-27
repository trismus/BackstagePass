'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface HealthStatus {
  status: 'ok' | 'error'
  timestamp: string
  checks: {
    env: { status: 'ok' | 'error' }
    supabase: { status: 'ok' | 'error' | 'skipped'; latency?: number }
    vercel: { status: 'ok' | 'unknown'; environment: string | null }
  }
}

interface SystemStatusCardProps {
  version: string
  commitHash?: string
}

function StatusDot({ status }: { status: 'ok' | 'error' | 'skipped' | 'unknown' | 'loading' }) {
  const colors = {
    ok: 'bg-green-500',
    error: 'bg-red-500',
    skipped: 'bg-neutral-400',
    unknown: 'bg-yellow-500',
    loading: 'bg-neutral-300 animate-pulse',
  }

  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`}
      title={status}
    />
  )
}

function StatusRow({
  label,
  status,
  detail,
}: {
  label: string
  status: 'ok' | 'error' | 'skipped' | 'unknown' | 'loading'
  detail?: string
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span className="text-sm text-neutral-700">{label}</span>
      </div>
      {detail && (
        <span className="text-xs text-neutral-500">{detail}</span>
      )}
    </div>
  )
}

export function SystemStatusCard({ version, commitHash }: SystemStatusCardProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch('/api/health')
        const data = await res.json()
        setHealth(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden')
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const environment = health?.checks.vercel.environment || process.env.NODE_ENV || 'development'
  const isProduction = environment === 'production'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>System</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isProduction
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isProduction ? 'Production' : 'Development'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version Info */}
        <div className="rounded-lg bg-neutral-50 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-neutral-900">
              Version {version}
            </span>
            {commitHash && (
              <span className="font-mono text-xs text-neutral-500">
                {commitHash.slice(0, 7)}
              </span>
            )}
          </div>
        </div>

        {/* Health Checks */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Status
          </h4>
          <div className="divide-y divide-neutral-100">
            <StatusRow
              label="Datenbank"
              status={loading ? 'loading' : (health?.checks.supabase.status || 'error')}
              detail={
                health?.checks.supabase.latency
                  ? `${health.checks.supabase.latency}ms`
                  : undefined
              }
            />
            <StatusRow
              label="Authentifizierung"
              status={loading ? 'loading' : (health?.checks.env.status || 'error')}
            />
            <StatusRow
              label="Umgebungsvariablen"
              status={loading ? 'loading' : (health?.checks.env.status || 'error')}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Last Check */}
        {health?.timestamp && (
          <p className="text-xs text-neutral-400">
            Letzte Prüfung:{' '}
            {new Date(health.timestamp).toLocaleTimeString('de-CH')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
