# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BackstagePass (codename: Argus) is a web application for theater group management (Theatergruppe Widen - TGW). The project uses German UI text and some German naming conventions.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript 5.7
- **Backend:** Supabase (PostgreSQL + Auth with SSR adapter)
- **Styling:** Tailwind CSS with custom theater color palette (stage-*, curtain-*)
- **Hosting:** Vercel

## Commands

All commands run from `apps/web/`:

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier format all files
npm run format:check # Check formatting
npm run typecheck    # TypeScript type check
npm run check:config # Validate config files
npm run check:health # Health check (requires running server)
```

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
│   │   ├── mein-bereich/   # Personal area (stundenkonto)
│   │   └── admin/          # Admin-only (users, audit logs)
│   ├── actions/            # Server actions (auth.ts, profile.ts)
│   └── api/                # API routes
├── components/             # React components by domain
├── lib/
│   ├── actions/            # Server actions by domain
│   └── supabase/
│       ├── client.ts       # Browser client
│       ├── server.ts       # Server-side client (getUser, getUserProfile)
│       ├── admin.ts        # Admin client (service role key)
│       ├── middleware.ts   # Auth middleware helpers
│       ├── auth-helpers.ts # Permission utilities (see below)
│       └── types.ts        # Database types & Permission types
└── middleware.ts           # Next.js middleware for route protection

supabase/migrations/        # Database migrations (SQL)
docs/                       # Architecture and team documentation
journal/                    # Development journal & documentation
```

## Key Patterns

### Authentication & Authorization (Issue #108)

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

**Permission System** in `lib/supabase/auth-helpers.ts`:
```typescript
// Check specific permission
hasPermission(userRole, 'mitglieder:read')
hasPermission(userRole, 'veranstaltungen:write')

// Check management level (ADMIN or VORSTAND)
isManagement(userRole)
canEdit(userRole)  // alias for isManagement

// Check admin only
isAdmin(userRole)

// Server-side with redirect
await requirePermission('mitglieder:write')
```

**Permission Types** (defined in `types.ts`):
- `admin:access`, `mitglieder:read/write/delete`, `veranstaltungen:read/write/delete/register`
- `helfereinsaetze:read/write/delete/register`, `stundenkonto:read/read_own/write`
- `partner:read/write/delete`, `stuecke:read/write/delete`, `raeume:read/write`, `ressourcen:read/write`

### Component Architecture
- Server Components by default
- Use `'use client'` directive only when needed (useState, useEffect, onClick handlers)
- Supabase data fetching happens in Server Components

### Database
- All tables use Row Level Security (RLS)
- RLS helper functions: `is_management()`, `is_admin()`, `get_user_role()`, `has_role_permission()`
- Migrations in `supabase/migrations/` with format `YYYYMMDDHHMMSS_name.sql`
- Types defined in `lib/supabase/types.ts`

**Core Tables:**
- `personen` - Members/people
- `profiles` - User accounts with roles
- `veranstaltungen` - Events (vereinsevent, probe, auffuehrung, sonstiges)
- `anmeldungen` - Event registrations
- `partner` - Partner organizations
- `helfereinsaetze`, `helferrollen`, `helferschichten` - Helper system
- `stundenkonto` - Hours ledger
- `stuecke`, `szenen`, `rollen`, `besetzungen` - Play management
- `proben`, `proben_szenen`, `proben_teilnehmer` - Rehearsals
- `zeitbloecke`, `auffuehrung_schichten`, `auffuehrung_zuweisungen` - Performance scheduling
- `raeume`, `ressourcen`, `raum_reservierungen`, `ressourcen_reservierungen` - Resources
- `auffuehrung_templates`, `template_zeitbloecke`, `template_schichten` - Templates

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

The project has a defined AI team workflow in `docs/team.md` with roles:
- Christian (Regisseur/PM) - user stories
- Martin (Bühnenmeister/Architect) - technical planning
- Peter (Kulissenbauer/Developer) - implementation
- Ioannis (Kritiker/QA) - code review
- Johannes (Chronist) - documentation

Branch naming: `feature/issue-{number}-{slug}`
