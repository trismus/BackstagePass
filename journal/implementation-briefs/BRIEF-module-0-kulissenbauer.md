# 🎨 Implementation Brief: Modul 0 – Mitgliederverwaltung & Auth

**An:** Kulissenbauer (Senior Developer)
**Von:** Springer (Project Manager) / Bühnenmeister (Architect)
**Datum:** 2026-01-26
**Status:** 🚀 Bereit zum Implementieren

---

## 📌 Auftrag

Implementiere **Modul 0: Mitgliederverwaltung & Authentifizierung** gemäß Tech Plan:
[journal/decisions/PLAN-module-0-foundation.md](../decisions/PLAN-module-0-foundation.md)

**GitHub Issues:**
- #88 – 0.1 Benutzer-Authentifizierung & Login-System
- #89 – 0.2 Mitgliederprofil & Benutzerverwaltung
- #90 – 0.3 Rollenmanagement & Permissions
- #91 – 0.4 Audit Log & Activity Tracking

**Geschätzte Dauer:** 3-4 Tage
**Priority:** 🔴 **HIGH** (Blocking für alle anderen Module)

---

## 🎯 Was du implementierst

### Phase 1: Datenbank & RLS (1 Tag)
1. Supabase Migrationen schreiben
2. RLS Policies deployen
3. Seed-Daten (Rollen, Test-User)

### Phase 2: Auth API & Middleware (1 Tag)
1. Supabase Auth Setup
2. Server-Actions für Sign-In/Up
3. Auth Middleware
4. Custom Hooks (useAuth, useUser, useRoles)

### Phase 3: Frontend Components (1 Tag)
1. Auth Pages (Login, Signup, Password-Reset)
2. Profile Page
3. Admin Panel (Benutzer, Rollen)

### Phase 4: Testing & Polish (0.5 Tag)
1. Unit Tests
2. Integration Tests
3. Error-Handling
4. Documentation

---

## 🗂️ Git-Branching

```bash
# Hauptbranch für Modul 0
git checkout -b feature/issue-88-auth-system

# Sub-Branches für Phasen (optional)
git checkout -b feature/issue-88-migrations
git checkout -b feature/issue-88-frontend
git checkout -b feature/issue-88-testing
```

**Branch-Namen:** `feature/issue-{number}-{slug}`

---

## 📋 Detaillierte Aufgaben

### 1️⃣ MIGRATIONEN (supabase/migrations/)

**Datei:** `supabase/migrations/20260126000000_module-0-auth-foundation.sql`

```sql
-- 1. Profile Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  privacy_level TEXT DEFAULT 'private' CHECK (privacy_level IN ('private', 'members', 'public')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_full_name ON public.profiles USING GIN (full_name gin_trgm_ops);

-- 2. Roles Table
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.roles (name, description) VALUES
  ('member', 'Standard-Mitglied'),
  ('admin', 'Administrator'),
  ('regie', 'Künstlerische Leitung'),
  ('produktion', 'Produktionsleitung'),
  ('technik', 'Technisches Team'),
  ('maske', 'Maske/Kostüm Team');

-- 3. User Roles Table
CREATE TABLE public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);

-- 4. Audit Log Table
CREATE TABLE public.audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);

-- RLS Policies (ausführlich in Tech Plan)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ... (RLS Policies wie im Tech Plan beschrieben)
```

✅ **Checklist:**
- [ ] Migrationen-Datei erstellen
- [ ] Lokal testen: `supabase start`, `supabase migration up`
- [ ] RLS Policies sind aktiv
- [ ] Seed-Daten geladen (Rollen)

---

### 2️⃣ TYPES (lib/supabase/types.ts)

Erstelle oder erweitere `lib/supabase/types.ts`:

```typescript
// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  created_at: string;
}

export interface Session {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Profile Types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  privacy_level: 'private' | 'members' | 'public';
  created_at: string;
  updated_at: string;
}

export interface CreateProfileInput {
  email: string;
  full_name: string;
  phone?: string;
  bio?: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  privacy_level?: 'private' | 'members' | 'public';
}

// Role Types
export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  created_at: string;
}

export interface UserRole {
  id: number;
  user_id: string;
  role_id: number;
  assigned_at: string;
  assigned_by: string | null;
}

// Audit Log
export interface AuditLogEntry {
  id: number;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Auth Context
export interface AuthContext {
  user: AuthUser | null;
  profile: Profile | null;
  roles: Role[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: UpdateProfileInput) => Promise<void>;
  hasRole: (roleName: string) => boolean;
  hasPermission: (permission: string) => boolean;
}
```

✅ **Checklist:**
- [ ] Types definiert
- [ ] TypeScript Validation aktiv (strict mode)
- [ ] Keine `any` Types

---

### 3️⃣ AUTH UTILS (lib/auth/utils.ts)

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { AuthResponse } from '@supabase/supabase-js'

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) throw error

  // Create profile
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      email: data.user.email,
      full_name: fullName,
    })

    // Assign member role
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'member')
      .single()

    if (roleData) {
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role_id: roleData.id,
      })
    }
  }

  return { data, error }
}

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signOut() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return await supabase.auth.signOut()
}

export async function resetPassword(email: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/auth/password-reset`,
  })
}
```

✅ **Checklist:**
- [ ] Auth-Funktionen exportieren
- [ ] Error-Handling
- [ ] Keine Secrets in Frontend-Code

---

### 4️⃣ CUSTOM HOOKS (lib/supabase/hooks.ts)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { AuthUser, Profile, Role, AuthContext } from './types'

export function useAuth(): AuthContext {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        // Lade Profil und Rollen
        const profileRes = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const rolesRes = await supabase
          .from('user_roles')
          .select('roles(*)')
          .eq('user_id', session.user.id)

        if (profileRes.data) setProfile(profileRes.data)
        if (rolesRes.data) {
          setRoles(rolesRes.data.map((ur: any) => ur.roles))
        }
      }
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
        setProfile(null)
        setRoles([])
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const hasRole = (roleName: string) => {
    return roles.some((role) => role.name === roleName)
  }

  const hasPermission = (permission: string) => {
    return roles.some((role) => role.permissions?.[permission])
  }

  return {
    user,
    profile,
    roles,
    loading,
    signUp: async (email, password, fullName) => {
      // Implementierung in auth/utils.ts
    },
    signIn: async (email, password) => {
      // Implementierung in auth/utils.ts
    },
    signOut: async () => {
      // Implementierung in auth/utils.ts
    },
    resetPassword: async (email) => {
      // Implementierung in auth/utils.ts
    },
    updateProfile: async (updates) => {
      // Implementierung
    },
    hasRole,
    hasPermission,
  }
}

export function useUser() {
  const { user, profile, loading } = useAuth()
  return { user, profile, loading }
}

export function useRoles() {
  const { roles } = useAuth()
  return { roles }
}
```

✅ **Checklist:**
- [ ] useAuth Hook funktioniert
- [ ] useUser Hook funktioniert
- [ ] useRoles Hook funktioniert
- [ ] Subscriptions werden cleaned up

---

### 5️⃣ AUTH PAGES

#### `app/(auth)/login/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    try {
      // Implementierung mit signIn()
      router.push('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        {error && <div className="bg-red-100 p-4 mb-4">{error}</div>}
        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  )
}
```

#### `app/(auth)/signup/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (email: string, password: string, fullName: string) => {
    try {
      // Implementierung mit signUp()
      router.push('/auth/login')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6">Registrierung</h1>
        {error && <div className="bg-red-100 p-4 mb-4">{error}</div>}
        <SignupForm onSubmit={handleSignup} />
      </div>
    </div>
  )
}
```

✅ **Checklist:**
- [ ] Login-Page funktioniert
- [ ] Signup-Page funktioniert
- [ ] Password-Reset-Page funktioniert
- [ ] Error-Handling
- [ ] Redirect nach Success

---

### 6️⃣ COMPONENTS

#### `components/auth/LoginForm.tsx` (Client)

```typescript
'use client'

import { useState } from 'react'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(email, password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full px-4 py-2 border rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? 'Wird geladen...' : 'Anmelden'}
      </button>
    </form>
  )
}
```

✅ **Checklist:**
- [ ] LoginForm Komponente
- [ ] SignupForm Komponente
- [ ] ProfileForm Komponente
- [ ] UserTable Komponente (Admin)
- [ ] RoleSelector Komponente
- [ ] AuditLogViewer Komponente

---

### 7️⃣ MIDDLEWARE (middleware.ts)

```typescript
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/auth/login', '/auth/signup', '/']
const adminRoutes = ['/admin']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            response.cookies.set(name, value)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Nicht-authentifizierte User zu Login
  if (!session && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Admin-Routes prüfen
  if (pathname.startsWith('/admin') && session?.user) {
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', session.user.id)

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'admin')
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

✅ **Checklist:**
- [ ] Middleware schützt Routes
- [ ] Admin-Routes sind geschützt
- [ ] Public Routes funktionieren
- [ ] Session wird gepflegt

---

### 8️⃣ API ROUTES

#### `app/api/auth/logout/route.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    // Log Logout Event
    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      action: 'logout',
      created_at: new Date().toISOString(),
    })

    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/auth/login', request.url))
}
```

✅ **Checklist:**
- [ ] `/api/auth/logout` funktioniert
- [ ] `/api/profiles/` CRUD funktioniert
- [ ] `/api/audit-log/` READ funktioniert (Admin-only)
- [ ] Rate Limiting (optional)

---

### 9️⃣ TESTING

#### `__tests__/auth.test.ts`

```typescript
import { signIn, signUp, signOut } from '@/lib/auth/utils'

describe('Auth Functions', () => {
  it('should sign up a new user', async () => {
    // Test signUp
  })

  it('should sign in with correct credentials', async () => {
    // Test signIn
  })

  it('should fail with wrong credentials', async () => {
    // Test error handling
  })

  it('should sign out', async () => {
    // Test signOut
  })
})
```

✅ **Checklist:**
- [ ] Unit Tests für Auth-Funktionen
- [ ] Integration Tests für API Routes
- [ ] E2E Tests für Login/Signup Flow

---

## 📝 GIT COMMITS

Nutze **Conventional Commits**:

```bash
feat(auth): add login and signup pages
feat(db): create profiles and roles tables
feat(middleware): protect auth routes
fix(auth): handle password reset email
docs(auth): add auth setup guide
test(auth): add unit tests for signup
```

---

## ✅ DEFINITION OF DONE

Für jeden Issue (0.1 – 0.4):

- [ ] Code implementiert gemäß Tech Plan
- [ ] TypeScript Types definiert
- [ ] Error-Handling vorhanden
- [ ] Tests geschrieben & passing
- [ ] Code formatiert (ESLint, Prettier)
- [ ] Pull Request erstellt mit Beschreibung
- [ ] Code Review durch Kritiker
- [ ] Merged zu main
- [ ] Dokumentation updated

---

## 🚀 IMPLEMENTATION REIHENFOLGE

1. **Tag 1 (Migrationen & Datenbank)**
   - [ ] Supabase-Migrationen
   - [ ] RLS Policies
   - [ ] Seed-Daten
   - [ ] Commit & PR

2. **Tag 2 (Auth Backend)**
   - [ ] Types definieren
   - [ ] Auth Utils
   - [ ] Custom Hooks
   - [ ] API Routes
   - [ ] Middleware
   - [ ] Commit & PR

3. **Tag 3 (Frontend)**
   - [ ] Auth Components
   - [ ] Auth Pages
   - [ ] Admin Panel
   - [ ] Error-Handling
   - [ ] Commit & PR

4. **Tag 4 (Testing & Polish)**
   - [ ] Unit Tests
   - [ ] Integration Tests
   - [ ] Documentation
   - [ ] Final PR

---

## 📚 WICHTIGE RESSOURCEN

- **Tech Plan:** [journal/decisions/PLAN-module-0-foundation.md](../decisions/PLAN-module-0-foundation.md)
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Auth:** https://nextjs.org/docs/app/building-your-application/authentication
- **TypeScript:** https://www.typescriptlang.org/docs/
- **GitHub Issues:** https://github.com/trismus/BackstagePass/issues?labels=module-0

---

## 💬 SUPPORT

Wenn du Fragen hast:
1. **Bühnenmeister** – Architektur-Fragen
2. **Springer** – Priorisierung & Blockern
3. **Kritiker** – Code-Review & Best Practices

---

**Viel Erfolg beim Implementieren! 🚀**

*Brief erstellt durch: Springer*
*Gültig ab: 2026-01-26*
