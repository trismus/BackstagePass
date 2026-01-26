# 🔐 Issue 0.1: Auth-System Modul 0 - Supabase SSR + Next.js App Router

**Status:** 📋 Backlog  
**GitHub:** https://github.com/trismus/BackstagePass/issues/[TBD]  
**Milestone:** Modul 0  
**Priority:** 🔴 CRITICAL (Blocking)  
**Zugewiesen:** Peter (Kulissenbauer/Senior Developer)  
**Owner:** Martin (Bühnenmeister) - Tech Plan  

---

## 🎯 Zielbild (Architektur)

```
┌─────────────────────────────────────────────────────────┐
│                    BackstagePass Auth                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  /login (Client)                                          │
│    ↓                                                      │
│  Server Action: signIn()                                 │
│    ↓                                                      │
│  Supabase Auth (Email/Passwort)                          │
│    ↓                                                      │
│  Auth Cookies (SSR-Safe)                                 │
│    ↓                                                      │
│  /app (Protected) - Server Components sehen Session      │
│    ↓                                                      │
│  middleware.ts: Route Protection                         │
│    ↓                                                      │
│  RBAC: profiles.role + RLS Policies                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ Client-Komponente für Login-Form (E-Mail/Passwort)
- ✅ Server Actions: signIn, signOut (Cookies sauber gesetzt)
- ✅ Supabase SSR Client: Auth-Cookies persistent
- ✅ middleware.ts: Private Routen geschützt
- ✅ RBAC light: profiles.role + RLS Policies

---

## 📋 Aufgaben

### 1️⃣ Supabase vorbereiten

#### Auth konfigurieren
- [ ] Email/Password Auth aktivieren in Supabase Console
- [ ] Email confirmations für Demo deaktivieren (optional, für schnelles Testing)
- [ ] JWT Secret validieren
- [ ] Supabase URL + Anon Key notieren

#### Datenmodell (RBAC-ready)

**Tabelle: profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'VIEWER', -- ADMIN, EDITOR, VIEWER
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: User kann eigenes Profil lesen
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: User kann eigenes Profil updaten
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Admin kann alle Profile lesen (später)
-- CREATE POLICY "profiles_select_admin"
--   ON profiles FOR SELECT
--   USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
```

- [ ] Migrationen schreiben (`supabase/migrations/`)
- [ ] Profiles-Tabelle deployen
- [ ] RLS Policies aktivieren
- [ ] Test-User erstellen (test@example.com / password)

---

### 2️⃣ Next.js 14 Projektstruktur (App Router)

**Empfohlene Struktur:**

```
apps/web/
├── app/
│   ├── (auth)/                    # Auth Routes (public)
│   │   ├── login/
│   │   │   └── page.tsx           # Login Page
│   │   └── signup/
│   │       └── page.tsx           # Signup Page (optional M0)
│   │
│   ├── (protected)/               # Protected Routes (private)
│   │   ├── layout.tsx             # Auth Guard + Session Check
│   │   ├── page.tsx               # Dashboard/Home
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── mitglieder/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts       # Supabase Callback
│   │
│   ├── layout.tsx                 # Root Layout
│   ├── globals.css
│   └── middleware.ts              # ← WICHTIG für Route Protection
│
├── lib/
│   └── supabase/
│       ├── client.ts              # Client-side Supabase
│       ├── server.ts              # Server-side Supabase (SSR!)
│       ├── middleware.ts           # Middleware Helpers
│       └── types.ts               # Type Definitions
│
└── components/
    └── auth/
        ├── LoginForm.tsx          # Login Form (Client Component)
        ├── SignupForm.tsx         # Signup Form (optional)
        └── LogoutButton.tsx       # Logout Button
```

- [ ] Ordnerstruktur erstellen
- [ ] Files skelettieren
- [ ] Imports konfigurieren

---

### 3️⃣ Supabase SSR Setup (kritischster Teil!)

#### lib/supabase/server.ts
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete(name)
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return data?.user || null
}

export async function getUserProfile() {
  const supabase = await createClient()
  const user = await getUser()
  
  if (!user) return null
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return data
}
```

- [ ] `server.ts` implementieren
- [ ] `getUser()` Funktion testen
- [ ] `getUserProfile()` implementieren

#### lib/supabase/client.ts
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] `client.ts` für Browser-seitige Auth

#### Environment Variablen
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

- [ ] `.env.local` konfigurieren
- [ ] In Vercel Secrets speichern

---

### 4️⃣ Auth Flows implementieren

#### Server Actions (app/actions/auth.ts)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
) {
  const supabase = await createClient()

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Auto-create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user?.id,
      email,
      display_name: displayName,
      role: 'VIEWER',
    })

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
```

- [ ] `signIn()` Server Action
- [ ] `signUp()` Server Action (optional für M0)
- [ ] `signOut()` Server Action
- [ ] Error Handling robust

#### Login Flow
1. User füllt Form auf `/login`
2. Form postet zu `signIn()` Server Action
3. Action macht `auth.signInWithPassword()`
4. Bei Erfolg: Cookies gesetzt, redirect `/dashboard`
5. Bei Fehler: Error-Message zurück auf `/login`

- [ ] Login Form Controller
- [ ] Error States UI
- [ ] Success Redirect

---

### 5️⃣ Route Protection

#### middleware.ts (App Root)
```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set(name, value, options)
        },
        remove(name, options) {
          response.cookies.delete(name)
        },
      },
    }
  )

  const { data } = await supabase.auth.getUser()

  // Redirect to login if no user AND accessing protected routes
  if (
    !data.user &&
    (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/app') ||
      request.nextUrl.pathname.startsWith('/(protected)'))
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if logged in AND accessing auth routes
  if (
    data.user &&
    (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup'))
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

- [ ] `middleware.ts` implementieren
- [ ] Protected Routes konfigurieren
- [ ] Redirect Logic testen

#### (protected)/layout.tsx (Defense in Depth)
```typescript
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">BackstagePass</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] Layout mit User Info
- [ ] Logout Button
- [ ] Header Navigation

---

### 6️⃣ UI (Tailwind)

#### Login Page (app/(auth)/login/page.tsx)
```typescript
'use client'

import { useState } from 'react'
import { signIn } from '@/app/actions/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn(email, password)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">BackstagePass</h1>
        <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-stage-500 focus:outline-none focus:ring-stage-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-stage-500 focus:outline-none focus:ring-stage-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-stage-600 px-4 py-2 text-white hover:bg-stage-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Demo Account: test@example.com / password
        </p>
      </div>
    </div>
  )
}
```

- [ ] Login Form sauber (Tailwind)
- [ ] Error States sichtbar
- [ ] Loading State
- [ ] Demo Account Hint

#### Logout Button (components/auth/LogoutButton.tsx)
```typescript
'use client'

import { signOut } from '@/app/actions/auth'

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-sm font-medium text-gray-600 hover:text-gray-900"
    >
      Logout
    </button>
  )
}
```

- [ ] Logout Button implementieren
- [ ] Styling konsistent mit Login

---

### 7️⃣ RBAC light (später ohne Umbau)

**Für Modul 0: nur Basis**

```typescript
// lib/supabase/auth-helpers.ts

export async function requireRole(requiredRole: 'ADMIN' | 'EDITOR' | 'VIEWER') {
  const profile = await getUserProfile()
  
  if (!profile) throw new Error('Profile not found')
  
  const roles = ['ADMIN', 'EDITOR', 'VIEWER']
  const required = roles.indexOf(requiredRole)
  const current = roles.indexOf(profile.role)
  
  if (current < required) {
    throw new Error('Insufficient permissions')
  }
  
  return profile
}

export function canAccess(route: string, userRole: string): boolean {
  const accessMap: Record<string, string[]> = {
    '/dashboard': ['ADMIN', 'EDITOR', 'VIEWER'],
    '/admin': ['ADMIN'],
    '/mitglieder': ['ADMIN', 'EDITOR'],
  }
  
  const allowed = accessMap[route] || []
  return allowed.includes(userRole)
}
```

- [ ] Helper Functions implementieren
- [ ] Test mit verschiedenen Rollen
- [ ] Optional: Admin-Routes mit Checks

---

### 8️⃣ Testing & Validation

- [ ] Test-User login-logout Flow
- [ ] Session bleibt nach Page Reload
- [ ] Protected Routes redirect zu /login
- [ ] /login redirects zu /dashboard wenn logged in
- [ ] Error Messages sauber angezeigt
- [ ] Tailwind UI konsistent (Mobile + Desktop)

---

## ✅ Definition of Done

**Modul 0 Auth ist fertig wenn:**

- [ ] **User kann sich mit Email/Passwort anmelden**
  - Login Form funktioniert
  - Credentials werden validiert
  - Session wird erstellt

- [ ] **Session bleibt nach Reload**
  - SSR Client liest Cookies korrekt
  - Server Components sehen User
  - getUser() funktioniert in Layouts

- [ ] **/app (protected) ist geschützt**
  - Direktes Aufrufen ohne Login → Redirect /login
  - middleware.ts funktioniert
  - (protected)/layout.tsx hat Auth Guard

- [ ] **Logout funktioniert**
  - Logout Button vorhanden
  - Cookies werden gelöscht
  - Redirect zu /login
  - Session weg nach Logout

- [ ] **UI sauber & konsistent**
  - Tailwind genutzt
  - Design System eingehalten (Kim's Guidelines)
  - Mobile responsive (320px+)
  - Accessibility (a11y) erfüllt

- [ ] **Datenmodell stabil**
  - profiles-Tabelle mit RLS
  - RLS Policies getestet
  - Auto-Profile-Createn beim Signup (wenn Signup active)

- [ ] **Error Handling robust**
  - Falsche Credentials → Clear Error
  - Network Errors → Fallback
  - Edge Cases handled

- [ ] **Dokumentation vorhanden**
  - README für Auth Setup
  - Environment Variables dokumentiert
  - Flow-Diagram vorhanden

---

## 📊 Dependencies & Blocking

**Blocking for:**
- Ioannis (Kritiker) - Security Review
- Johannes (Chronist) - Documentation
- Melanie (Redakteur) - Release Notes

**Requires:**
- ✅ Kim's Design System (Issue #104)
- ✅ Martin's Tech Plan (this Issue)

**Timeline:** 5-7 Tage (mit täglichen Syncs)

---

## 🎯 Geschützte Basis-Route

**Default:** `/dashboard`

*Falls du was anderes willst, ändere:*
- `middleware.ts` → `/dashboard` → `/your-route`
- `(protected)/page.tsx` → Umbenenen zu `your-route/page.tsx`
- Redirect in signIn Action → `/dashboard` → `/your-route`

---

## 📚 Weitere Ressourcen

- [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

## 📝 Status Tracking

**Erstellt:** 2026-01-26  
**Owner:** Peter (Implementation)  
**Reviewer:** Martin (Tech), Ioannis (Security)  
**Next:** Kim finalisiert Design-Screenshots

---

*Issue erstellt von Greg (Springer)*  
*Tech Plan by Martin (Bühnenmeister)*  
*Ready for Peter (Kulissenbauer) Implementation*
