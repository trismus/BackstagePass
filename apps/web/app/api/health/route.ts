import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface HealthCheck {
  status: 'ok' | 'error'
  timestamp: string
  checks: {
    env: EnvCheck
    supabase: SupabaseCheck
    vercel: VercelCheck
  }
}

interface EnvCheck {
  status: 'ok' | 'error'
  missing: string[]
  present: string[]
}

interface SupabaseCheck {
  status: 'ok' | 'error' | 'skipped'
  message: string
  latency?: number
}

interface VercelCheck {
  status: 'ok' | 'unknown'
  environment: string | null
  region: string | null
}

export async function GET() {
  // 1. Environment Variables Check
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const envCheck: EnvCheck = {
    status: 'ok',
    missing: [],
    present: [],
  }

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      envCheck.present.push(envVar)
    } else {
      envCheck.missing.push(envVar)
    }
  }

  if (envCheck.missing.length > 0) {
    envCheck.status = 'error'
  }

  // 2. Supabase Connection Check
  let supabaseCheck: SupabaseCheck = {
    status: 'skipped',
    message: 'Supabase credentials not configured',
  }

  if (envCheck.status === 'ok') {
    const supabaseStart = Date.now()
    try {
      const supabase = await createClient()

      // Simple query to test connection
      const { error } = await supabase.from('_health_check').select('*').limit(1)

      // Table doesn't exist is fine - we just want to test the connection
      if (error && !error.message.includes('does not exist')) {
        supabaseCheck = {
          status: 'error',
          message: error.message,
          latency: Date.now() - supabaseStart,
        }
      } else {
        supabaseCheck = {
          status: 'ok',
          message: 'Connection successful',
          latency: Date.now() - supabaseStart,
        }
      }
    } catch (err) {
      supabaseCheck = {
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
        latency: Date.now() - supabaseStart,
      }
    }
  }

  // 3. Vercel Environment Check
  const vercelCheck: VercelCheck = {
    status: process.env.VERCEL ? 'ok' : 'unknown',
    environment: process.env.VERCEL_ENV || null,
    region: process.env.VERCEL_REGION || null,
  }

  // Build response
  const health: HealthCheck = {
    status: envCheck.status === 'ok' && supabaseCheck.status === 'ok' ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    checks: {
      env: envCheck,
      supabase: supabaseCheck,
      vercel: vercelCheck,
    },
  }

  const statusCode = health.status === 'ok' ? 200 : 503

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
