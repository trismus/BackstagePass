import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimit } from '@/lib/utils/rate-limiter'

// Public paths that should be rate-limited
const rateLimitedPrefixes = [
  '/helfer/anmeldung/',
  '/helfer/abmeldung/',
  '/helfer/warteliste/',
  '/helfer/helferliste/',
  '/helfer/feedback/',
  '/helfer/meine-einsaetze/',
]

// Rate limit: 30 requests per minute per IP for public helfer routes
const PUBLIC_RATE_LIMIT = 30
const PUBLIC_RATE_WINDOW_MS = 60_000

// Rate limit: 2 requests per minute per IP for cron endpoint
const CRON_RATE_LIMIT = 2
const CRON_RATE_WINDOW_MS = 60_000

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const ip = getClientIp(request)

  // Rate-limit public helfer routes
  const isRateLimitedRoute = rateLimitedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (isRateLimitedRoute) {
    const { allowed, resetAt } = checkRateLimit(
      `${ip}:public-helfer`,
      PUBLIC_RATE_LIMIT,
      PUBLIC_RATE_WINDOW_MS
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warte einen Moment.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          },
        }
      )
    }
  }

  // Rate-limit cron endpoint
  if (pathname === '/api/cron/send-reminders') {
    const { allowed, resetAt } = checkRateLimit(
      `${ip}:cron`,
      CRON_RATE_LIMIT,
      CRON_RATE_WINDOW_MS
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          },
        }
      )
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
