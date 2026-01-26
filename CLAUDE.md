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
```

## Architecture

```
apps/web/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth routes (login) - no auth required
│   ├── (protected)/        # Protected routes - requires authentication
│   │   ├── dashboard/
│   │   └── mitglieder/     # Members management
│   ├── actions/            # Server actions (auth.ts)
│   └── api/                # API routes
├── components/             # React components by domain
├── lib/
│   └── supabase/
│       ├── client.ts       # Browser client
│       ├── server.ts       # Server-side client
│       ├── middleware.ts   # Auth middleware helpers
│       └── auth-helpers.ts # RBAC utilities (requireRole, hasRole)
└── middleware.ts           # Next.js middleware for route protection

supabase/migrations/        # Database migrations (SQL)
docs/                       # Architecture and team documentation
```

## Key Patterns

### Authentication & Authorization
- Supabase SSR authentication with JWT tokens
- Middleware-based route protection (`middleware.ts`)
- Role hierarchy: ADMIN > EDITOR > VIEWER
- Use `requireRole()` and `hasRole()` from `lib/supabase/auth-helpers.ts`

### Component Architecture
- Server Components by default
- Use `'use client'` directive only when needed (useState, useEffect, onClick handlers)
- Supabase data fetching happens in Server Components

### Database
- All tables use Row Level Security (RLS)
- Migrations in `supabase/migrations/` with format `YYYYMMDDHHMMSS_name.sql`

## Code Style

- No semicolons, single quotes, 2-space indentation
- Tailwind CSS for all styling (no custom CSS files)
- Prefix unused variables with `_`
- `console.log` is warned; use `console.warn`/`console.error` if needed

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
