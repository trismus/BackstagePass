import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_START_PAGES, canAccessRoute } from '@/lib/navigation'
import type { UserRole } from './types'

type CookieToSet = {
  name: string
  value: string
  options?: CookieOptions
}

// Routes that require authentication (all under (protected))
const protectedPrefixes = [
  '/dashboard',
  '/mitglieder',
  '/partner',
  '/veranstaltungen',
  '/auffuehrungen',
  '/stuecke',
  '/proben',
  '/helfereinsaetze',
  '/raeume',
  '/ressourcen',
  '/templates',
  '/mein-bereich',
  '/helfer',
  '/partner-portal',
  '/willkommen',
  '/admin',
  '/profile',
]

// Routes only accessible when NOT authenticated
const authRoutes = ['/login', '/signup', '/forgot-password']

// Routes accessible regardless of auth state (password reset flow)
const publicRoutes = ['/reset-password', '/status']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Check if current path is a protected route
  const isProtectedRoute = protectedPrefixes.some((route) =>
    pathname.startsWith(route)
  )

  // Check if current path is an auth route (login/signup)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For authenticated users, check role-based access
  if (user && isProtectedRoute) {
    // Get user role from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = (profile?.role as UserRole) || 'FREUNDE'

    // Check if user can access this route
    if (!canAccessRoute(userRole, pathname)) {
      const startPage = ROLE_START_PAGES[userRole]
      return NextResponse.redirect(new URL(startPage, request.url))
    }
  }

  // Redirect authenticated users from auth routes to their start page
  if (isAuthRoute && user && !isPublicRoute) {
    // Get user role for correct redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = (profile?.role as UserRole) || 'FREUNDE'
    const startPage = ROLE_START_PAGES[userRole]
    return NextResponse.redirect(new URL(startPage, request.url))
  }

  return supabaseResponse
}
