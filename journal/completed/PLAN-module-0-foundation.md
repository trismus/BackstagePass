# 🔨 Tech Plan: Modul 0 – Authentifizierung & Mitgliederverwaltung (Foundation)

**Auftraggeber:** Springer (Projektmanager)
**Beauftragt:** Bühnenmeister (Lead Architect)
**Erstellt:** 2026-01-26
**Status:** 🎯 In Arbeit

---

## 📋 Überblick

Dieses Tech Plan definiert die **technische Grundarchitektur** für Modul 0 (Mitgliederverwaltung, Auth, Rollen, RLS). Es ist die Basis für alle anderen Module (1, 2, 3).

**GitHub Issues:**
- #88 – 0.1 Benutzer-Authentifizierung & Login-System
- #89 – 0.2 Mitgliederprofil & Benutzerverwaltung
- #90 – 0.3 Rollenmanagement & Permissions
- #91 – 0.4 Audit Log & Activity Tracking

---

## 1. 🗄️ Datenbank (Supabase PostgreSQL)

### Tabellen-Schema

#### `auth.users` (Supabase built-in)
```sql
-- Supabase verwaltet diese Tabelle automatisch
-- id, email, encrypted_password, email_confirmed_at, etc.
```

#### `public.profiles` (Persönliche Daten)
```sql
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

-- Index für schnelle Suche
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_full_name ON public.profiles USING GIN (full_name gin_trgm_ops); -- Fuzzy Search
```

#### `public.roles` (Verfügbare Rollen)
```sql
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}', -- Flexible Permissions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basis-Rollen
INSERT INTO public.roles (name, description) VALUES
  ('member', 'Standard-Mitglied'),
  ('admin', 'Administrator'),
  ('regie', 'Künstlerische Leitung'),
  ('produktion', 'Produktionsleitung'),
  ('technik', 'Technisches Team'),
  ('maske', 'Maske/Kostüm Team');
```

#### `public.user_roles` (Rollen pro Benutzer)
```sql
CREATE TABLE public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role_id)
);

-- Index für schnelle Lookups
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
```

#### `public.audit_log` (Sicherheits-Logging)
```sql
CREATE TABLE public.audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'profile_update', 'role_change', etc.
  resource_type TEXT, -- 'profile', 'role', 'password', etc.
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnelle Suche
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
```

---

### 2. 🔐 RLS (Row Level Security) Policies

#### Profile-Access
```sql
-- Policies für profiles-Tabelle
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eigenes Profil lesen/schreiben
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins können alles sehen
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles
      WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin')
    )
  );

-- Je nach privacy_level: andere Mitglieder sehen Profile
CREATE POLICY "Members can view public profiles" ON public.profiles
  FOR SELECT USING (
    privacy_level = 'public'
    OR privacy_level = 'members'
    OR auth.uid() = id
  );
```

#### User-Roles Access
```sql
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Nur Admins können Rollen verwalten
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles
      WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin')
    )
  );

-- Benutzer können ihre eigenen Rollen sehen
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
```

#### Audit-Log Access
```sql
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Nur Admins können Audit Log sehen
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles
      WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin')
    )
  );

-- Benutzer können ihre eigenen Logs sehen
CREATE POLICY "Users can view own logs" ON public.audit_log
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 3. 📁 Dateistruktur

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx           # Login-Page
│   │   ├── signup/
│   │   │   └── page.tsx           # Signup-Page
│   │   ├── password-reset/
│   │   │   └── page.tsx           # Password-Reset-Page
│   │   └── layout.tsx             # Auth Layout (keine Navigation)
│   │
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   └── page.tsx           # User Dashboard (nach Login)
│   │   ├── profile/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Profil-Ansicht/-Bearbeitung
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   │   └── page.tsx       # Benutzer-Verwaltung (Admin-only)
│   │   │   ├── roles/
│   │   │   │   └── page.tsx       # Rollen-Verwaltung (Admin-only)
│   │   │   ├── audit-log/
│   │   │   │   └── page.tsx       # Audit Log (Admin-only)
│   │   │   └── settings/
│   │   │       └── page.tsx       # App-Einstellungen (Admin-only)
│   │   └── layout.tsx             # Protected Layout (mit Navigation)
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/route.ts  # Supabase Auth Callback
│   │   │   ├── logout/route.ts    # Logout Endpoint
│   │   │   └── refresh/route.ts   # Token Refresh
│   │   ├── profiles/
│   │   │   ├── route.ts           # GET/POST profiles
│   │   │   └── [id]/route.ts      # GET/PUT profiles/:id
│   │   ├── roles/
│   │   │   └── route.ts           # GET roles (public)
│   │   ├── audit-log/
│   │   │   └── route.ts           # GET audit logs (Admin-only)
│   │   └── health/
│   │       └── route.ts           # Health Check
│   │
│   └── middleware.ts              # Auth-Middleware für Route Protection
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx          # Login Formular (Client)
│   │   ├── SignupForm.tsx         # Signup Formular (Client)
│   │   └── PasswordResetForm.tsx  # Password Reset (Client)
│   ├── profile/
│   │   ├── ProfileCard.tsx        # Profil-Anzeige
│   │   ├── ProfileForm.tsx        # Profil-Bearbeitung (Client)
│   │   └── AvatarUpload.tsx       # Avatar Upload (Client)
│   ├── admin/
│   │   ├── UserTable.tsx          # Benutzer-Tabelle
│   │   ├── RoleSelector.tsx       # Rollen-Dropdown (Client)
│   │   └── AuditLogViewer.tsx     # Audit Log Viewer
│   └── common/
│       ├── Header.tsx             # Navigation Header
│       ├── Footer.tsx             # Footer
│       └── ProtectedRoute.tsx     # Protected Route Wrapper
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Supabase Client (browser)
│   │   ├── server.ts              # Supabase Client (server)
│   │   ├── middleware.ts          # Auth Middleware
│   │   ├── types.ts               # TypeScript Types
│   │   └── hooks.ts               # Custom Hooks (useAuth, useUser, etc.)
│   └── auth/
│       ├── utils.ts               # Auth Utilities
│       ├── validators.ts          # Validierung (Email, Password)
│       └── constants.ts           # Auth Constants
│
└── public/
    └── images/
        └── default-avatar.png     # Default Profilbild
```

---

## 4. 🔄 Data Flow

### Login-Flow
```
1. User → Login-Page (GET /auth/login)
2. Form Input (Email, Password)
3. Client → Server Action: signIn()
4. Server → Supabase Auth.signInWithPassword()
5. ✅ Session created
6. Middleware prüft Session
7. Redirect → Dashboard
8. localStorage/cookies speichern Session
```

### Signup-Flow
```
1. User → Signup-Page (GET /auth/signup)
2. Form Input (Email, Password, Full Name)
3. Client → Server Action: signUp()
4. Server → Supabase Auth.signUp()
5. Server → CREATE profiles record
6. Server → Assign 'member' role
7. Email Verification (optional)
8. Redirect → Login oder Dashboard
```

### Role-Assignment Flow
```
1. Admin → Admin Panel (GET /admin/users)
2. Select User
3. Checkbox Rollen
4. Server Action: updateUserRoles()
5. Server → UPDATE user_roles
6. Audit Log Entry
7. Notification an User (optional)
```

### Audit Log Flow
```
1. Benutzer führt Aktion aus
2. Middleware/Server Action logged:
   - user_id
   - action (login, logout, profile_update, role_change)
   - old_value / new_value
   - ip_address, user_agent
   - timestamp
3. INSERT INTO audit_log
4. Admin kann via GET /api/audit-log abrufen
```

---

## 5. 📝 TypeScript Types & Interfaces

```typescript
// lib/supabase/types.ts

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
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
  avatar_url?: string;
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

// Audit Types
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

---

## 6. 🔐 Security Considerations

### Authentication
- ✅ Supabase Auth mit Email/Passwort
- ✅ Sichere Passwort-Hashing (bcrypt by Supabase)
- ✅ Tokens sind HTTP-only Cookies (falls möglich) oder localStorage
- ✅ Token Refresh alle 1 Stunde
- ⚠️ 2FA optional (Phase 2?)

### Data Access
- ✅ RLS Policies für alle Tabellen
- ✅ Benutzer sehen nur ihre eigenen Daten
- ✅ Admins haben übergeordnete Rechte
- ✅ Sensitive Felder (Passwort) sind nicht exposiert

### Validation
- ✅ Email-Format Validierung (client & server)
- ✅ Passwort-Strength Validierung (min. 8 Zeichen, etc.)
- ✅ Rate Limiting für Login-Versuche
- ✅ CSRF Protection (Next.js built-in)

### Audit Trail
- ✅ Alle Login/Logout-Events geloggt
- ✅ Profil-Änderungen mit old/new values
- ✅ Rollen-Änderungen geloggt
- ✅ IP-Adresse & User-Agent geloggt
- ✅ Failed Login Attempts tracked

---

## 7. 🎯 Akzeptanzkriterien für Kulissenbauer

### 0.1 – Login-System
- [ ] Login-Page mit Email/Passwort Inputs
- [ ] Server Action `signIn()` ruft Supabase Auth auf
- [ ] Erfolgreicher Login → Session erstellt
- [ ] Redirect zu Dashboard
- [ ] Error-Handling (wrong password, user not found, etc.)
- [ ] Passwort-Reset Link funktioniert
- [ ] Logout funktioniert und löscht Session

### 0.2 – Profil & Benutzer
- [ ] Profile-Table funktioniert (create, read, update)
- [ ] Profil-Page zeigt eigene Daten
- [ ] Profil-Bearbeitung funktioniert
- [ ] Avatar-Upload zu Supabase Storage
- [ ] Admin-Panel zeigt alle Benutzer
- [ ] Admin kann Benutzer deaktivieren
- [ ] Benutzer-Suche funktioniert

### 0.3 – Rollen & Permissions
- [ ] user_roles Table funktioniert
- [ ] Admin kann Rollen zuweisen
- [ ] Benutzer können ihre Rollen sehen
- [ ] RLS Policies sind implementiert
- [ ] Regie sieht nur künstlerische Daten (später: Modul 3)
- [ ] Produktion sieht nur Logistik-Daten (später: Modul 2)

### 0.4 – Audit Log
- [ ] Login/Logout Events geloggt
- [ ] Profil-Änderungen geloggt (old/new values)
- [ ] Rollen-Änderungen geloggt
- [ ] Admin-Panel zeigt Audit Log
- [ ] Filter nach Benutzer, Datum, Action
- [ ] Export zu CSV möglich (optional)

---

## 8. 🚀 Nächste Schritte für Kulissenbauer

1. **Migrationen schreiben** (`supabase/migrations/`)
2. **Supabase RLS Policies** deployen
3. **Auth Components** implementieren (LoginForm, SignupForm)
4. **API Routes** implementieren (/api/auth/*, /api/profiles/*, etc.)
5. **Middleware** für Route Protection
6. **Custom Hooks** (useAuth, useUser, useRoles)
7. **Tests schreiben** (Unit + Integration)
8. **Dokumentation** updaten

---

## 📌 Wichtige Notizen

- **Token Management:** Supabase verwaltet Tokens automatisch
- **Email Verification:** Optional – können wir später hinzufügen
- **Avatar Storage:** Nutzt Supabase Storage (`bucket: avatars`)
- **Password Reset:** Email-Link mit Security Token
- **Session Persistence:** Browser LocalStorage oder Cookies
- **CORS:** Nur Frontend-Domain erlauben

---

**Status:** 🎯 Tech Plan abgeschlossen
**Für Kulissenbauer:** Bereit zum Implementieren!
**Geschätzte Dauer:** 3-4 Tage für alle 4 Issues

---

*Erstellt durch: Springer*
*Gültig ab: 2026-01-26*
