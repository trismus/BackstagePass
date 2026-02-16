# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BackstagePass (codename: Argus) is a web application for theater group management (Theatergruppe Widen - TGW). The project uses German UI text and some German naming conventions.

**Repository Structure:**
- Root: Monorepo configuration and shared documentation
- `apps/web/`: Main Next.js application (run commands from here)
- `supabase/migrations/`: Database migrations
- `docs/`: Architecture and team documentation
- `journal/`: Development journal and decisions

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript 5.7
- **Backend:** Supabase (PostgreSQL + Auth with SSR adapter)
- **Styling:** Tailwind CSS with custom theater color palette (stage-*, curtain-*)
- **Validation:** Zod for runtime schema validation
- **Hosting:** Vercel

## Commands

All commands run from `apps/web/`:

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier format all files
npm run format:check # Check formatting
npm run typecheck    # TypeScript type check (tsc --noEmit)
npm run check:config # Validate config files
npm run check:health # Health check (requires running server)

# Testing
npm run test         # Run unit tests (vitest watch mode)
npm run test:run     # Run unit tests once
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run E2E tests (Playwright)
npm run test:e2e:ui  # Run E2E tests with Playwright UI
```

## Environment Variables

Required in `apps/web/.env.local` (auto-synced via Supabase-Vercel integration):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key for client
- `SUPABASE_SERVICE_ROLE_KEY` - Admin operations (server-side only)

Note: A template `.env` file exists at `apps/web/.env` for reference.

## Architecture

```
apps/web/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth routes (login, signup, password reset)
│   ├── (protected)/        # Protected routes - requires authentication
│   │   ├── dashboard/
│   │   ├── mitglieder/     # Members (Personen) management
│   │   ├── veranstaltungen/# Club events management
│   │   ├── auffuehrungen/  # Performances with shifts & scheduling
│   │   ├── stuecke/        # Plays with scenes & roles
│   │   ├── proben/         # Rehearsals
│   │   ├── helfereinsaetze/# Helper events (external work)
│   │   ├── partner/        # Partner organizations
│   │   ├── raeume/         # Room management
│   │   ├── ressourcen/     # Equipment management
│   │   ├── templates/      # Performance templates
│   │   ├── helferliste/    # Helper event management (new system)
│   │   ├── mein-bereich/   # Personal area (redirects to dashboard)
│   │   ├── meine-einsaetze/# Helper dashboard (HELFER role)
│   │   └── admin/          # Admin-only (users, audit logs)
│   ├── (public)/           # Public routes (no auth required)
│   │   └── helfer/[token]/ # Public helper registration
│   ├── actions/            # Server actions (auth.ts, profile.ts)
│   └── api/                # API routes
├── components/             # React components by domain
├── lib/
│   ├── actions/            # Server actions by domain
│   ├── validations/        # Zod schemas for form/input validation
│   └── supabase/
│       ├── client.ts       # Browser client (createBrowserClient)
│       ├── server.ts       # Server-side client (getUser, getUserProfile)
│       ├── admin.ts        # Admin client (service role key)
│       ├── middleware.ts   # Auth middleware helpers
│       ├── auth-helpers.ts # Server-side permission checks (throws/redirects)
│       ├── permissions.ts  # Client-safe permission matrix (no secrets)
│       └── types.ts        # Database types & Permission types
└── middleware.ts           # Next.js middleware for route protection

supabase/migrations/        # Database migrations (SQL)
docs/                       # Architecture and team documentation
journal/                    # Development journal & documentation
```

## Key Patterns

### Authentication & Authorization

**7 User Roles** (capability-based, not hierarchical):
| Role | German | Description |
|------|--------|-------------|
| `ADMIN` | Administrator | Full system access |
| `VORSTAND` | Vorstand | All operational modules |
| `MITGLIED_AKTIV` | Aktives Mitglied | Own data, registrations, hours |
| `MITGLIED_PASSIV` | Passives Mitglied | Own profile, public info |
| `HELFER` | Helfer | Assigned shifts only |
| `PARTNER` | Partner | Own partner data |
| `FREUNDE` | Freunde | Public info only |

**Permission Checking** (two files for different contexts):
```typescript
// Server-side (lib/supabase/auth-helpers.ts) - can throw/redirect
await requirePermission('mitglieder:write')  // Throws if unauthorized
const profile = await getUserProfile()        // Get current user

// Client-safe (lib/supabase/permissions.ts) - for conditional rendering
import { hasPermission, isManagement, isAdmin } from '@/lib/supabase/permissions'
hasPermission(userRole, 'mitglieder:read')
isManagement(userRole)  // ADMIN or VORSTAND
```

**Permission Types** (defined in `types.ts`):
- `admin:access`, `mitglieder:read/write/delete`, `veranstaltungen:read/write/delete/register`
- `helfereinsaetze:read/write/delete/register`, `stundenkonto:read/read_own/write`
- `partner:read/write/delete`, `stuecke:read/write/delete`, `raeume:read/write`, `ressourcen:read/write`

### Data Fetching (Server Components)

```typescript
// app/(protected)/mitglieder/page.tsx - Server Component
import { createClient } from '@/lib/supabase/server'

export default async function MitgliederPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('personen').select('*')

  return <MitgliederList data={data} />  // Pass to client component
}
```

### Server Actions

```typescript
// lib/actions/personen.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/supabase/auth-helpers'

export async function updatePerson(id: string, data: PersonUpdate) {
  await requirePermission('mitglieder:write')  // Check permission first
  const supabase = await createClient()

  const { error } = await supabase
    .from('personen')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)

  // Revalidate all pages that display this data
  revalidatePath('/mitglieder')
  revalidatePath('/dashboard')  // If dashboard shows member data
}
```

### Component Architecture
- Server Components by default
- Use `'use client'` directive only when needed (useState, useEffect, onClick handlers)
- Supabase data fetching happens in Server Components
- Pass data to Client Components via props

### Recent Patterns & Best Practices (Feb 2026)

**Error Handling in Server Actions:**
```typescript
'use server'

export async function someAction(data: FormData) {
  try {
    // ... perform action
    return { success: true, data: result }
  } catch (error) {
    console.error('Action failed:', error)
    return { success: false, error: error.message }
  }
}

// In component - always check result
const result = await someAction(formData)
if (!result.success) {
  setError(result.error)
  return
}
```

**Path Revalidation:**
Always revalidate ALL pages that display the modified data:
```typescript
revalidatePath('/primary-page')
revalidatePath('/dashboard')  // If dashboard shows this data
revalidatePath('/admin/overview')  // If admin pages show this data
```

**Dashboard Pattern:**
Single `/dashboard` route with role-based content:
- ADMIN/VORSTAND: Management dashboard
- MITGLIED_AKTIV: Personal dashboard (Outlook-style)
- MITGLIED_PASSIV: Simplified view
- HELFER: Use `/meine-einsaetze` instead

**Template System Pattern:**
Two-level architecture (template vs instance):
- Template level: Offset-based times (`offset_minuten`)
- Instance level: Absolute times (`start_zeit`)
- Apply template: Calculate instance times from template offsets + performance start time

### Form Validation

```typescript
// lib/validations/person.ts
import { z } from 'zod'

// Custom UUID validator (Zod v4 compatibility)
// Zod v4 .uuid() is strict RFC 4122 - our seed data uses relaxed format
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const uuid = (message = 'Ungültige UUID') => z.string().regex(UUID_REGEX, message)

export const personSchema = z.object({
  vorname: z.string().min(1, 'Vorname ist erforderlich'),
  nachname: z.string().min(1, 'Nachname ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse').optional(),
})

export type PersonFormData = z.infer<typeof personSchema>

// Use in server action
export async function createPerson(formData: PersonFormData) {
  const validated = personSchema.parse(formData)  // Throws if invalid
  // ... save to database
}
```

**Important:** Use the custom `uuid()` helper instead of `z.string().uuid()` for UUID validation (Zod v4 breaking change).

### Database
- All tables use Row Level Security (RLS)
- RLS helper functions: `is_management()`, `is_admin()`, `get_user_role()`, `has_role_permission()`
- Migrations in `supabase/migrations/` with format `YYYYMMDDHHMMSS_name.sql`
- Types defined in `lib/supabase/types.ts`

**Creating Migrations:**
```bash
# Create new migration file (from root directory)
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_feature_name.sql

# Migration template
-- supabase/migrations/YYYYMMDDHHMMSS_feature_name.sql
CREATE TABLE table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Policy description"
  ON table_name
  FOR SELECT
  USING (has_role_permission('resource:read'));
```

**Generating Types:**
Types are manually maintained in `lib/supabase/types.ts` following the database schema.

### Testing

**Unit Tests (Vitest):**
- Located in `tests/` and alongside source files (*.test.ts)
- Focus on server actions in `lib/actions/`
- Setup file: `tests/setup.ts`
- Run single test: `npm run test -- path/to/file.test.ts`

**E2E Tests (Playwright):**
- Located in `e2e/` directory
- Tests run against local dev server (auto-started)
- Base URL: `http://localhost:3000`
- Example: `e2e/helferliste-admin.spec.ts`

**Core Tables:**
- `personen` - Members/people
- `profiles` - User accounts with roles
- `veranstaltungen` - Events (vereinsevent, probe, auffuehrung, sonstiges)
- `anmeldungen` - Event registrations
- `partner` - Partner organizations
- `helfereinsaetze`, `helferrollen`, `helferschichten` - Helper system (legacy)
- `helfer_events`, `helfer_rollen_templates`, `helfer_rollen_instanzen`, `helfer_anmeldungen` - Helferliste system (new)
- `stundenkonto` - Hours ledger
- `stuecke`, `szenen`, `rollen`, `besetzungen` - Play management
- `proben`, `proben_szenen`, `proben_teilnehmer` - Rehearsals
- `zeitbloecke`, `auffuehrung_schichten`, `auffuehrung_zuweisungen` - Performance scheduling
- `raeume`, `ressourcen`, `raum_reservierungen`, `ressourcen_reservierungen` - Resources
- `auffuehrung_templates`, `template_zeitbloecke`, `template_schichten` - Performance templates
- `template_info_bloecke`, `info_bloecke` - Template and instance info blocks
- `template_sachleistungen`, `sachleistungen` - Template and instance in-kind contributions

## Code Style

- No semicolons, single quotes, 2-space indentation
- Tailwind CSS for all styling (no custom CSS files)
- Custom color palette: `primary-*`, `secondary-*`, `stage-*`, `curtain-*`, `success-*`, `error-*`, `warning-*`, `info-*`
- Prefix unused variables with `_`
- `console.log` is warned; use `console.warn`/`console.error` if needed
- Next.js Typed Routes enabled: use `as never` cast for dynamic route strings

## Commit Convention

Format: `type: message` (lowercase)
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `chore:` maintenance

## AI Team Workflow

The project uses a defined AI team workflow (see `docs/team.md` for full details):
- **Christian** (Regisseur/PM) - User stories, requirements
- **Martin** (Bühnenmeister/Architect) - Technical planning, database design
- **Peter** (Kulissenbauer/Developer) - Implementation
- **Ioannis** (Kritiker/QA) - Code review, security audit
- **Johannes** (Chronist) - Documentation

Branch naming: `feature/issue-{number}-{slug}` or `fix/issue-{number}-{slug}`

## GitHub

**Project Board:** https://github.com/users/trismus/projects/2/views/1

**Labels:**
- Domain: `database`, `migration`, `backend`, `api`, `frontend`, `ui`, `admin`
- Priority: `prio:high`, `prio:medium`, `prio:low`
- Status: `blocked`, `ready`, `in-review`
- Type: `bug`, `feature`, `enhancement`, `documentation`

## Documentation

- `docs/` - Architecture documentation, team workflow, design system
- `docs/architecture/` - System architecture details
- `journal/` - Development logs and decisions
- `journal/decisions/` - Technical decision records (ADRs)
