# 🏛️ BackstagePass - High-Level Architecture

**System Architecture Document**

**Version:** 2.0.0
**Date:** 2026-02-23
**Status:** Living Document

---

## 📋 Executive Summary

BackstagePass ist eine moderne, cloud-native Web-Applikation für Theatervereins-Management. Die Architektur folgt einem **serverlosen, API-first Ansatz** mit **Next.js Server Components** und **Supabase Backend-as-a-Service**.

### Architektur-Prinzipien

1. **Security First** - RLS Policies, Auth-First Design
2. **Serverless** - Keine Server-Verwaltung, automatische Skalierung
3. **Type Safety** - TypeScript End-to-End
4. **Performance** - Server Components, Edge Caching
5. **Simplicity** - Minimale Dependencies, Standard-Patterns

### Key Decisions

| Entscheidung | Rationale |
|--------------|-----------|
| Next.js 15 App Router | Moderne React-Architektur, Server Components, automatische Code-Splitting |
| Supabase | Managed PostgreSQL + Auth + RLS, schnelle Entwicklung, PostgreSQL Kompatibilität |
| Vercel Deployment | Zero-Config Deployment, Edge Network, automatische Previews |
| Tailwind CSS | Utility-First, kein CSS-in-JS Overhead, Tree-Shakeable |
| Monorepo | Einfache Code-Sharing, einheitliches Tooling |

---

## 🎯 System Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USERS / CLIENTS                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Browser  │  │ Mobile   │  │ Tablet   │  │ AI Workflow      │   │
│  │ (Desktop)│  │ (Safari) │  │ (iPad)   │  │ (n8n)            │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
└───────┼─────────────┼─────────────┼─────────────────┼──────────────┘
        │             │             │                 │
        └─────────────┴─────────────┴─────────────────┘
                              │
                         HTTPS (TLS 1.3)
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   CDN (Global Edge Nodes)                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ Static      │  │ Edge        │  │ Middleware  │          │  │
│  │  │ Assets      │  │ Functions   │  │ (Auth Check)│          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              NEXT.JS 15 APPLICATION (Serverless)              │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │  App Router                                           │    │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │    │  │
│  │  │  │ Server      │  │ Client      │  │ API Routes   │ │    │  │
│  │  │  │ Components  │  │ Components  │  │ (Optional)   │ │    │  │
│  │  │  │             │  │             │  │              │ │    │  │
│  │  │  │ • Pages     │  │ • Interactive│  │ • REST      │ │    │  │
│  │  │  │ • Layouts   │  │ • Forms     │  │ • Webhooks  │ │    │  │
│  │  │  │ • Data Fetch│  │ • Tables    │  │              │ │    │  │
│  │  │  └─────────────┘  └─────────────┘  └──────────────┘ │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                         Supabase Client
                         (PostgREST API)
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                      SUPABASE (Backend-as-a-Service)                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   API Gateway (PostgREST)                     │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │  │
│  │  │ Auto-generated │  │ RLS Enforced   │  │ Real-time     │  │  │
│  │  │ REST API       │  │ Policies       │  │ Subscriptions │  │  │
│  │  └────────────────┘  └────────────────┘  └───────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   AUTHENTICATION (GoTrue)                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐    │  │
│  │  │ Email/PWD  │  │ Magic Link │  │ Session Management  │    │  │
│  │  │ Auth       │  │ Auth       │  │ (JWT Tokens)        │    │  │
│  │  └────────────┘  └────────────┘  └─────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                DATABASE (PostgreSQL 15)                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐    │  │
│  │  │ Tables     │  │ RLS        │  │ Migrations          │    │  │
│  │  │ • personen │  │ Policies   │  │ • Version Control   │    │  │
│  │  │ • produkt. │  │            │  │ • Schema Changes    │    │  │
│  │  │ • termine  │  │            │  │                     │    │  │
│  │  └────────────┘  └────────────┘  └─────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                STORAGE (Optional - Future)                    │  │
│  │  • Dokumente (PDFs, Bilder)                                   │  │
│  │  • S3-Compatible Object Storage                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ n8n          │  │ Google       │  │ GitHub                   │ │
│  │ Workflows    │  │ Gemini AI    │  │ • Issues                 │ │
│  │              │  │              │  │ • Pull Requests          │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architectural Layers

### Layer 1: Presentation Layer (Frontend)

**Technology:** Next.js 15 App Router, React 19, Tailwind CSS

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  App Router Structure                                 │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  app/                                           │  │  │
│  │  │  ├── layout.tsx          (Root Layout)          │  │  │
│  │  │  ├── page.tsx            (Landing)              │  │  │
│  │  │  │                                               │  │  │
│  │  │  ├── (auth)/             (Auth Routes)          │  │  │
│  │  │  │   ├── login/                                  │  │  │
│  │  │  │   ├── signup/                                 │  │  │
│  │  │  │   ├── forgot-password/                        │  │  │
│  │  │  │   └── reset-password/                         │  │  │
│  │  │  │                                               │  │  │
│  │  │  ├── (public)/           (Public Routes)        │  │  │
│  │  │  │   ├── helfer/[token]/ (Helper Registration)  │  │  │
│  │  │  │   └── mitmachen/      (Public Helper Portal) │  │  │
│  │  │  │                                               │  │  │
│  │  │  └── (protected)/        (Protected Routes)     │  │  │
│  │  │      ├── dashboard/      (Role-based Dashboard) │  │  │
│  │  │      ├── mitglieder/     (Members + Invites)    │  │  │
│  │  │      ├── veranstaltungen/(Events)               │  │  │
│  │  │      ├── auffuehrungen/  (Performances)         │  │  │
│  │  │      ├── stuecke/        (Plays + Scenes)       │  │  │
│  │  │      ├── produktionen/   (Productions)          │  │  │
│  │  │      ├── proben/         (Rehearsals)           │  │  │
│  │  │      ├── templates/      (Perf. Templates)      │  │  │
│  │  │      ├── kalender/       (Calendar)             │  │  │
│  │  │      ├── raeume/         (Rooms)                │  │  │
│  │  │      ├── ressourcen/     (Equipment)            │  │  │
│  │  │      ├── partner/        (Partners)             │  │  │
│  │  │      ├── helfereinsaetze/(Legacy Helpers)       │  │  │
│  │  │      ├── mitmachen/      (New Helpers)          │  │  │
│  │  │      ├── vorstand/       (Board Member Area)    │  │  │
│  │  │      ├── willkommen/     (Onboarding)           │  │  │
│  │  │      └── admin/          (Admin Panel)          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Component Architecture                               │  │
│  │  ┌────────────────────┐  ┌────────────────────────┐  │  │
│  │  │ Server Components  │  │ Client Components      │  │  │
│  │  │ ──────────────────│  │ ──────────────────────│  │  │
│  │  │ • Data Fetching    │  │ • User Interactions    │  │  │
│  │  │ • Direct DB Access │  │ • State Management     │  │  │
│  │  │ • No Hydration     │  │ • Event Handlers       │  │  │
│  │  │ • SEO Friendly     │  │ • Animations           │  │  │
│  │  │ • Zero JS Bundle   │  │ • Form Validation      │  │  │
│  │  │                    │  │ • 'use client' directive│  │  │
│  │  └────────────────────┘  └────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Patterns:**

1. **Server Components First:**
   - Default für alle Components
   - Direct Database Access via Supabase
   - Keine Client-Side JS nötig

2. **Client Components Only When Needed:**
   - Interaktive Forms
   - Tables mit Sorting/Filtering
   - Modal Dialogs
   - Animations

3. **Co-location:**
   - Components nahe bei ihren Routes
   - Shared Components in `/components`

---

### Layer 2: Business Logic Layer

**Technology:** TypeScript, Supabase Client SDK

```
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  lib/                                                 │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  supabase/                                      │  │  │
│  │  │  ├── client.ts         (Browser Client)        │  │  │
│  │  │  ├── server.ts         (Server Client)         │  │  │
│  │  │  └── middleware.ts     (Edge Middleware)       │  │  │
│  │  │                                                  │  │  │
│  │  │  utils/                                         │  │  │
│  │  │  ├── validation.ts     (Zod Schemas)           │  │  │
│  │  │  ├── formatters.ts     (Date, Currency)        │  │  │
│  │  │  └── helpers.ts        (General Utils)         │  │  │
│  │  │                                                  │  │  │
│  │  │  services/                                      │  │  │
│  │  │  ├── members.ts        (CRUD Operations)       │  │  │
│  │  │  ├── produktionen.ts                           │  │  │
│  │  │  └── termine.ts                                │  │  │
│  │  │                                                  │  │  │
│  │  │  types/                                         │  │  │
│  │  │  ├── database.ts       (Supabase Generated)    │  │  │
│  │  │  ├── domain.ts         (Business Types)        │  │  │
│  │  │  └── api.ts            (API Response Types)    │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Access Patterns                                 │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Server Component (Preferred)                   │  │  │
│  │  │  ─────────────────────────────────────────────│  │  │
│  │  │  import { createClient } from '@/lib/supabase/  │  │  │
│  │  │         server'                                 │  │  │
│  │  │                                                  │  │  │
│  │  │  const supabase = createClient()                │  │  │
│  │  │  const { data } = await supabase               │  │  │
│  │  │    .from('personen').select()                  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Client Component                               │  │  │
│  │  │  ─────────────────────────────────────────────│  │  │
│  │  │  import { createClient } from '@/lib/supabase/  │  │  │
│  │  │         client'                                 │  │  │
│  │  │                                                  │  │  │
│  │  │  const supabase = createClient()                │  │  │
│  │  │  // Used in event handlers, not render         │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │  │
└─────────────────────────────────────────────────────────────┘
```

---

### Layer 3: Data Layer

**Technology:** PostgreSQL 15 (Supabase), Row Level Security

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│                  (PostgreSQL Database)                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Core Tables (78 Migrationen, Stand Feb 2026)          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  PERSONEN & AUTH                                │  │  │
│  │  │  ─────────────────                              │  │  │
│  │  │  personen          - Mitglieder/Personen        │  │  │
│  │  │  profiles          - User Accounts + Rollen     │  │  │
│  │  │  (7 Rollen: ADMIN, VORSTAND, MITGLIED_AKTIV,   │  │  │
│  │  │   MITGLIED_PASSIV, HELFER, PARTNER, FREUNDE)    │  │  │
│  │  │                                                  │  │  │
│  │  │  VERANSTALTUNGEN & AUFFUEHRUNGEN                │  │  │
│  │  │  ─────────────────────────────                  │  │  │
│  │  │  veranstaltungen   - Events (4 Typen)           │  │  │
│  │  │  anmeldungen       - Event-Registrierungen      │  │  │
│  │  │  zeitbloecke       - Performance-Zeitbloecke    │  │  │
│  │  │  auffuehrung_schichten  - Schichten             │  │  │
│  │  │  auffuehrung_zuweisungen - Zuweisungen          │  │  │
│  │  │                                                  │  │  │
│  │  │  KUENSTLERISCHE PLANUNG                         │  │  │
│  │  │  ─────────────────────                          │  │  │
│  │  │  stuecke           - Theaterstuecke             │  │  │
│  │  │  szenen            - Szenen pro Stueck          │  │  │
│  │  │  rollen            - Rollen pro Stueck          │  │  │
│  │  │  besetzungen       - Besetzung (M:N)            │  │  │
│  │  │  produktionen      - Produktionen               │  │  │
│  │  │  proben            - Proben                     │  │  │
│  │  │  proben_szenen     - Proben-Szenen-Zuordnung    │  │  │
│  │  │  proben_teilnehmer - Proben-Teilnehmer          │  │  │
│  │  │                                                  │  │  │
│  │  │  HELFER-SYSTEM                                  │  │  │
│  │  │  ──────────────                                 │  │  │
│  │  │  helfer_events     - Helfer-Events              │  │  │
│  │  │  helfer_rollen_templates  - Rollen-Vorlagen     │  │  │
│  │  │  helfer_rollen_instanzen  - Rollen-Instanzen    │  │  │
│  │  │  helfer_anmeldungen      - Anmeldungen          │  │  │
│  │  │  helfereinsaetze   - Legacy Helfer-Events       │  │  │
│  │  │  helferrollen      - Legacy Rollen              │  │  │
│  │  │  helferschichten   - Legacy Schichten           │  │  │
│  │  │                                                  │  │  │
│  │  │  TEMPLATES                                      │  │  │
│  │  │  ─────────                                      │  │  │
│  │  │  auffuehrung_templates    - Auffu.-Templates    │  │  │
│  │  │  template_zeitbloecke     - Template-Bloecke    │  │  │
│  │  │  template_schichten       - Template-Schichten  │  │  │
│  │  │  template_info_bloecke    - Info-Bloecke        │  │  │
│  │  │  template_sachleistungen  - Sachleistungen      │  │  │
│  │  │  info_bloecke / sachleistungen  - Instanzen     │  │  │
│  │  │                                                  │  │  │
│  │  │  RESSOURCEN                                     │  │  │
│  │  │  ──────────                                     │  │  │
│  │  │  raeume / ressourcen      - Raeume/Equipment    │  │  │
│  │  │  raum_reservierungen      - Raum-Buchungen      │  │  │
│  │  │  ressourcen_reservierungen- Geraete-Buchungen   │  │  │
│  │  │  partner                  - Partnerorganisationen│  │  │
│  │  │  stundenkonto             - Stunden-Ledger      │  │  │
│  │  │                                                  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Indexes & Constraints                                │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  • Primary Keys: UUID (gen_random_uuid())      │  │  │
│  │  │  • Foreign Keys: ON DELETE CASCADE             │  │  │
│  │  │  • Unique Constraints: email, junction tables  │  │  │
│  │  │  • Indexes:                                     │  │  │
│  │  │    - personen.email (UNIQUE)                   │  │  │
│  │  │    - termine.start_zeit (BTREE)                │  │  │
│  │  │    - besetzung(produktion_id, person_id)       │  │  │
│  │  │  • CHECK Constraints: ENUMs für typ, status    │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
│                                                             │
│  Layer 1: Network Security                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • HTTPS/TLS 1.3 (Vercel)                            │  │
│  │  • DDoS Protection (Vercel Edge)                     │  │
│  │  • Rate Limiting (Supabase)                          │  │
│  │  • CORS Policy                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ▼                                    │
│  Layer 2: Authentication                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Supabase Auth (GoTrue)                            │  │
│  │  • Email + Magic Link                                │  │
│  │  • JWT Tokens (HttpOnly Cookies)                     │  │
│  │  • Session Management                                │  │
│  │  • Password Hashing (bcrypt)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ▼                                    │
│  Layer 3: Authorization (Middleware)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  middleware.ts                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  1. Check Session Cookie                       │  │  │
│  │  │  2. Validate JWT Token                         │  │  │
│  │  │  3. Check Route Protection                     │  │  │
│  │  │  4. Redirect if unauthenticated                │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ▼                                    │
│  Layer 4: Row Level Security (RLS)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL RLS Policies                             │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  RLS Helper Functions:                           │  │  │
│  │  │  ─────────────────────                           │  │  │
│  │  │  is_management()  - ADMIN or VORSTAND            │  │  │
│  │  │  is_admin()       - ADMIN only                   │  │  │
│  │  │  get_user_role()  - Current user's role          │  │  │
│  │  │  has_role_permission(perm) - Permission check    │  │  │
│  │  │                                                  │  │  │
│  │  │  personen:                                      │  │  │
│  │  │  ─────────                                      │  │  │
│  │  │  SELECT: has_role_permission('mitglieder:read') │  │  │
│  │  │  INSERT/UPDATE: mitglieder:write                │  │  │
│  │  │  DELETE: mitglieder:delete                      │  │  │
│  │  │                                                  │  │  │
│  │  │  veranstaltungen:                               │  │  │
│  │  │  ────────────────                               │  │  │
│  │  │  SELECT: veranstaltungen:read                   │  │  │
│  │  │  INSERT/UPDATE/DELETE: veranstaltungen:write    │  │  │
│  │  │                                                  │  │  │
│  │  │  helfer_*:                                      │  │  │
│  │  │  ─────────                                      │  │  │
│  │  │  SELECT: authenticated (public via token)       │  │  │
│  │  │  INSERT/UPDATE: helfereinsaetze:write           │  │  │
│  │  │  Anmeldungen: self-service + management         │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ▼                                    │
│  Layer 5: Application Security                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Input Validation (Zod Schemas)                    │  │
│  │  • XSS Prevention (React Auto-Escape)                │  │
│  │  • CSRF Protection (SameSite Cookies)                │  │
│  │  • SQL Injection Prevention (Parameterized Queries)  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────┐
│  User    │
│ Browser  │
└────┬─────┘
     │ 1. Visit /login (or receive Invitation Email)
     ▼
┌─────────────────┐
│  Login Page     │  OR  Invitation Link (branded SMTP email)
│  (Public Route) │
└────┬────────────┘
     │ 2. Enter Email / Password  OR  Click Invitation Link
     ▼
┌─────────────────────┐
│  Supabase Auth      │
│  (GoTrue Service)   │
└────┬────────────────┘
     │ 3. Authenticate (Password / Magic Link / Invitation)
     ▼
┌──────────────────────────┐
│  Auth Callback           │
│  /auth/callback          │
│  /auth/confirm           │
└────┬─────────────────────┘
     │ 4. Exchange Token, Create Session, Set Cookie
     │ 5. Auto-link Profile to Person (if invited)
     ▼
┌─────────────────────┐
│  Middleware         │
│  - Check Cookie     │
│  - Validate Session │
│  - Check onboarding │
└────┬────────────────┘
     │ 6a. First Login? → /willkommen (Onboarding Wizard)
     │ 6b. Returning?   → /dashboard (Role-based)
     ▼
┌─────────────────────┐     ┌─────────────────────┐
│  /willkommen        │ ──► │  /dashboard          │
│  2-Step Wizard      │     │  Role-based Content  │
│  (Profile + Skills) │     │  ADMIN/VORSTAND/     │
│                     │     │  MITGLIED/HELFER     │
└─────────────────────┘     └─────────────────────┘
```

### Invitation Flow (Member Onboarding)

```
Admin/Vorstand                     Existing Person (no app access)
───────────                        ──────────────────────────────
1. /mitglieder → "Einladen"
2. Select person(s)
3. Send invitation                 → Branded email via SMTP
   (single or bulk)                  (Supabase fallback)
                                   4. Click invitation link
                                   5. Create account / Login
                                   6. Profile auto-linked to Person
                                   7. Onboarding Wizard
                                   8. → Dashboard

Tracking: invitation_status (pending/accepted/expired)
Resend: Available for pending invitations
```

### RLS Policy Example

```sql
-- personen table policies

-- Enable RLS
ALTER TABLE personen ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can view active members
CREATE POLICY "view_active_members"
ON personen
FOR SELECT
TO authenticated
USING (active = true);

-- INSERT: Only admins can create members
CREATE POLICY "admin_create_members"
ON personen
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- UPDATE: Only admins can modify members
CREATE POLICY "admin_update_members"
ON personen
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- DELETE: Only admins (soft delete via active=false)
CREATE POLICY "admin_delete_members"
ON personen
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

---

## 🚀 Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  GitHub Repository                                    │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  main branch                                    │  │  │
│  │  │  ─────────────                                  │  │  │
│  │  │  • Protected Branch                             │  │  │
│  │  │  • Requires PR + Review                         │  │  │
│  │  │  • CI Checks pass                               │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │ Webhook                             │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Vercel Build Pipeline                                │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  1. Clone Repository                            │  │  │
│  │  │  2. Install Dependencies (npm install)          │  │  │
│  │  │  3. Type Check (tsc)                            │  │  │
│  │  │  4. Build (next build)                          │  │  │
│  │  │  5. Generate Static Assets                      │  │  │
│  │  │  6. Deploy to Edge Network                      │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Vercel Edge Network (Global CDN)                    │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Regions:                                       │  │  │
│  │  │  • ams1 (Amsterdam)     - Primary EU           │  │  │
│  │  │  • fra1 (Frankfurt)     - Secondary EU         │  │  │
│  │  │  • iad1 (Washington)    - US East              │  │  │
│  │  │  • sfo1 (San Francisco) - US West              │  │  │
│  │  │  • hnd1 (Tokyo)         - Asia                 │  │  │
│  │  │  • syd1 (Sydney)        - Oceania              │  │  │
│  │  │                                                  │  │  │
│  │  │  Features:                                      │  │  │
│  │  │  • Automatic SSL/TLS                            │  │  │
│  │  │  • HTTP/2, HTTP/3                               │  │  │
│  │  │  • Brotli Compression                           │  │  │
│  │  │  • Smart Caching                                │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase (Backend)                                   │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Region: eu-central-1 (Frankfurt)              │  │  │
│  │  │                                                  │  │  │
│  │  │  Components:                                    │  │  │
│  │  │  • PostgreSQL (Primary + Read Replica)         │  │  │
│  │  │  • Auth Service (GoTrue)                        │  │  │
│  │  │  • PostgREST API Gateway                        │  │  │
│  │  │  • Realtime Server                              │  │  │
│  │  │                                                  │  │  │
│  │  │  Backups:                                       │  │  │
│  │  │  • Daily automated backups (retention: 7 days) │  │  │
│  │  │  • Point-in-time recovery                       │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
┌──────────┐
│ Developer│
│ git push │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ GitHub Actions  │  (Future - not yet implemented)
│ ──────────────  │
│ • Run Tests     │
│ • Type Check    │
│ • Lint          │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Vercel Build    │
│ ──────────────  │
│ • npm install   │
│ • next build    │
│ • Optimize      │
└────┬────────────┘
     │
     ▼
┌──────────────────┐
│ Preview Deploy   │  (for PR branches)
│ ───────────────  │
│ • Unique URL     │
│ • PR Comment     │
└────┬─────────────┘
     │
     │ (if main branch)
     ▼
┌──────────────────┐
│ Production Deploy│
│ ───────────────  │
│ • Atomic Deploy  │
│ • Zero Downtime  │
│ • Instant Rollback│
└──────────────────┘
```

---

## 🔌 Integration Architecture

### n8n AI-Team Workflow Integration

```
┌─────────────────────────────────────────────────────────────┐
│                   AI-TEAM INTEGRATION                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Human Input                                          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  journal/00_inbox/idea.md                       │  │  │
│  │  │  ────────────────────────                       │  │  │
│  │  │  # Feature: Member Search                       │  │  │
│  │  │  Als Admin möchte ich Mitglieder suchen...     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │ Git Push                            │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  n8n Workflow 1: Regisseur                            │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  1. GitHub Webhook (push event)                │  │  │
│  │  │  2. Filter: journal/00_inbox/*.md              │  │  │
│  │  │  3. Get File Content                            │  │  │
│  │  │  4. Call Gemini AI                              │  │  │
│  │  │     Input: Markdown Content                     │  │  │
│  │  │     Prompt: Analyze as Product Manager         │  │  │
│  │  │  5. Parse JSON Response                         │  │  │
│  │  │  6. Create GitHub Issue                         │  │  │
│  │  │     - Title                                     │  │  │
│  │  │     - User Story                                │  │  │
│  │  │     - Acceptance Criteria                       │  │  │
│  │  │     - Labels (feature/bug)                      │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │ GitHub Issue Created                │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  n8n Workflow 2: Bühnenmeister                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  1. GitHub Webhook (issue opened)              │  │  │
│  │  │  2. Extract Issue Data                          │  │  │
│  │  │  3. Call Gemini AI                              │  │  │
│  │  │     Input: Issue Description                    │  │  │
│  │  │     Prompt: Create Tech Plan as Architect      │  │  │
│  │  │  4. Generate Tech Plan                          │  │  │
│  │  │  5. Save to journal/01_decisions/PLAN-{n}.md   │  │  │
│  │  │  6. Commit & Push                               │  │  │
│  │  │  7. Comment on Issue with Plan Link            │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │ Tech Plan Ready                     │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Manual Step: Kulissenbauer (Claude)                 │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  • Review Tech Plan                             │  │  │
│  │  │  • Implement Code                               │  │  │
│  │  │  • Create PR                                    │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### External APIs

```
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Google Gemini 1.5 Flash                              │  │
│  │  ─────────────────────────                            │  │
│  │  • Endpoint: generativelanguage.googleapis.com       │  │
│  │  • Auth: API Key (Header)                             │  │
│  │  • Rate Limit: 60 requests/min                        │  │
│  │  • Use Cases:                                         │  │
│  │    - Issue Generation (Regisseur)                     │  │
│  │    - Tech Plan Creation (Bühnenmeister)               │  │
│  │  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  GitHub API                                           │  │
│  │  ───────────                                          │  │
│  │  • Endpoint: api.github.com                           │  │
│  │  • Auth: OAuth2 (GitHub App)                          │  │
│  │  • Operations:                                        │  │
│  │    - Create Issues                                    │  │
│  │    - Comment on Issues                                │  │
│  │    - Create Files (Tech Plans)                        │  │
│  │    - Webhooks (Push, Issue Events)                    │  │
│  │  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SMTP Email (Nodemailer)                              │  │
│  │  ───────────────────────                              │  │
│  │  • Provider: Gmail SMTP                               │  │
│  │  • Fallback: Supabase Auth Email                      │  │
│  │  • Use Cases:                                         │  │
│  │    - Branded Invitation Emails                        │  │
│  │    - Helper Registration Confirmations                │  │
│  │    - Booking Confirmations                            │  │
│  │    - Reminder Notifications (via Cron)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Scalability & Performance

### Current Scale (Late MVP / Early Production)

```
Current State:
├── Database: 78 migrations, 30+ tables
├── Protected Routes: 28 route groups
├── Public Routes: Helper registration + Mitmachen
├── Users: 10-50 concurrent (expected)
├── Requests: < 1k/day
└── Storage: < 1 GB
```

### Scalability Approach

```
┌─────────────────────────────────────────────────────────────┐
│                   SCALABILITY LAYERS                        │
│                                                             │
│  Frontend (Vercel)                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Auto-Scaling (Serverless Functions)               │  │
│  │  • Edge Caching (CDN)                                 │  │
│  │  • Static Generation (Build Time)                    │  │
│  │  • Incremental Static Regeneration                   │  │
│  │  • Code Splitting (Route-based)                      │  │
│  │  • Image Optimization (Next/Image)                   │  │
│  │                                                        │  │
│  │  Capacity: ~1M requests/day (Vercel Pro Plan)        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Database (Supabase)                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Current: Free Tier                                   │  │
│  │  ├── 500 MB Database                                  │  │
│  │  ├── 2 GB Bandwidth/month                             │  │
│  │  ├── 50k MAU (Monthly Active Users)                   │  │
│  │  └── Paused after 1 week inactivity                   │  │
│  │                                                        │  │
│  │  Upgrade Path:                                        │  │
│  │  ├── Pro: 8 GB DB, 50 GB Bandwidth, No pause         │  │
│  │  ├── Team: 32 GB DB, 250 GB Bandwidth                │  │
│  │  └── Enterprise: Unlimited, Dedicated Resources      │  │
│  │                                                        │  │
│  │  Optimization Strategies:                             │  │
│  │  ├── Indexes on frequently queried columns           │  │
│  │  ├── Pagination (LIMIT/OFFSET)                        │  │
│  │  ├── Connection Pooling (Supabase handles)           │  │
│  │  ├── Read Replicas (Pro+ plan)                        │  │
│  │  └── Caching (React Server Components)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load (Dashboard) | < 2s | Vercel Analytics |
| Time to Interactive | < 3s | Lighthouse |
| First Contentful Paint | < 1s | Core Web Vitals |
| API Response Time | < 500ms | Supabase Logs |
| Database Query Time | < 100ms | pg_stat_statements |

### Performance Optimizations

```typescript
// 1. Server Component Data Fetching (No Client JS)
// apps/web/app/members/page.tsx
export default async function MembersPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('personen')
    .select('id, vorname, nachname, rolle')
    .eq('active', true)
    .order('nachname')
    .limit(100) // Pagination
  
  return <MembersTable members={data} />
}

// 2. Static Generation for Public Pages
// apps/web/app/page.tsx
export const revalidate = 3600 // ISR: Revalidate every hour

// 3. Image Optimization
import Image from 'next/image'
<Image 
  src="/logo.png" 
  width={200} 
  height={200} 
  alt="Logo"
  priority // LCP optimization
/>

// 4. Dynamic Import for Heavy Components
const HeavyCalendar = dynamic(() => import('./Calendar'), {
  loading: () => <Skeleton />,
  ssr: false // Client-only component
})
```

---

## 📈 Monitoring & Observability

### Monitoring Stack

```
┌─────────────────────────────────────────────────────────────┐
│                   MONITORING & LOGGING                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Vercel Analytics (Built-in)                          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  • Web Vitals (LCP, FID, CLS, TTFB)            │  │  │
│  │  │  • Real User Monitoring (RUM)                  │  │  │
│  │  │  • Deployment Analytics                        │  │  │
│  │  │  • Function Execution Logs                     │  │  │
│  │  │  • Build Logs                                  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase Dashboard                                   │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  • Database Metrics                             │  │  │
│  │  │    - Connection Pool Usage                      │  │  │
│  │  │    - Query Performance                          │  │  │
│  │  │    - Slow Query Log                             │  │  │
│  │  │  • Auth Metrics                                 │  │  │
│  │  │    - Login Success/Failure Rate                 │  │  │
│  │  │    - Active Sessions                            │  │  │
│  │  │  • API Metrics                                  │  │  │
│  │  │    - Request Count                              │  │  │
│  │  │    - Error Rate                                 │  │  │
│  │  │    - Response Time (p50, p95, p99)             │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Error Tracking (Future - Sentry)                    │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  • Client-Side Errors                           │  │  │
│  │  │  • Server-Side Errors                           │  │  │
│  │  │  • Performance Traces                           │  │  │
│  │  │  • Release Tracking                             │  │  │
│  │  │  • Source Maps                                  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Metrics Dashboard

```
Production Health Dashboard (Conceptual)
─────────────────────────────────────────

┌─────────────────────────────────────────┐
│ Uptime (Last 30 days)                   │
│ ████████████████████████████████ 99.9% │
└─────────────────────────────────────────┘

┌─────────────────┬─────────────────────┐
│ Active Users    │ Response Time (avg) │
│ 42              │ 156 ms              │
└─────────────────┴─────────────────────┘

┌─────────────────────────────────────────┐
│ Error Rate (Last 24h)                   │
│ ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.1%  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Database Performance                    │
│ • Connections: 5 / 100                  │
│ • Query Time (p95): 45 ms               │
│ • Slow Queries: 0                       │
└─────────────────────────────────────────┘
```

---

## 💾 Backup & Disaster Recovery

### Backup Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                   BACKUP & RECOVERY                         │
│                                                             │
│  Database Backups (Supabase Automated)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Daily Full Backups                                 │  │
│  │    - Retention: 7 days (Free Tier)                    │  │
│  │    - Time: 02:00 UTC                                  │  │
│  │    - Storage: S3 (encrypted)                          │  │
│  │                                                        │  │
│  │  • Point-in-Time Recovery (PITR)                      │  │
│  │    - Available on Pro+ plan                           │  │
│  │    - Granularity: 1 second                            │  │
│  │    - Retention: 30 days                               │  │
│  │                                                        │  │
│  │  • Manual Backups                                     │  │
│  │    - On-Demand via Supabase CLI                       │  │
│  │    - Before major migrations                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Application Code (GitHub)                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Git Version Control                                │  │
│  │  • Protected main branch                              │  │
│  │  • All commits preserved                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Deployment Artifacts (Vercel)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • All deployments preserved                          │  │
│  │  • Instant rollback to any deployment                 │  │
│  │  • Build cache stored                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Disaster Recovery Plan

```
RTO (Recovery Time Objective): 1 hour
RPO (Recovery Point Objective): 24 hours (daily backups)

Scenario 1: Database Corruption
────────────────────────────────
1. Pause application (set maintenance mode)
2. Restore from latest backup via Supabase Dashboard
3. Verify data integrity
4. Resume application
Estimated Time: 30 minutes

Scenario 2: Complete Vercel Outage
───────────────────────────────────
1. Deploy to alternative platform (Netlify/Railway)
2. Update DNS (if custom domain)
3. Update environment variables
4. Test deployment
Estimated Time: 2 hours

Scenario 3: Supabase Outage
───────────────────────────
1. Wait for Supabase recovery (SLA: 99.9% uptime)
2. OR: Migrate to self-hosted PostgreSQL
   - Export database dump
   - Provision PostgreSQL instance
   - Import data
   - Update connection strings
Estimated Time: 4-6 hours

Scenario 4: Accidental Data Deletion
─────────────────────────────────────
1. Use Point-in-Time Recovery (if Pro+ plan)
2. OR: Restore from daily backup (data loss: up to 24h)
3. Communicate to affected users
Estimated Time: 1 hour
```

---

## 🔮 Future Architecture Evolution

### Phase 2 Enhancements (Q2 2026)

```
┌─────────────────────────────────────────────────────────────┐
│                   PLANNED ENHANCEMENTS                      │
│                                                             │
│  1. Caching Layer                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Redis (Upstash)                                    │  │
│  │  • Cache Strategies:                                  │  │
│  │    - Static data (members list): 5 min TTL           │  │
│  │    - Session data: Session lifetime                  │  │
│  │    - API responses: 1 min TTL                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  2. File Storage                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Supabase Storage                                   │  │
│  │  • Use Cases:                                         │  │
│  │    - Profile Pictures                                 │  │
│  │    - Production Posters                               │  │
│  │    - Documents (PDFs, Scripts)                        │  │
│  │  • Public/Private Buckets                             │  │
│  │  • RLS Policies on Storage                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  3. Background Jobs                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Vercel Cron Jobs                                   │  │
│  │  • Use Cases:                                         │  │
│  │    - Email Reminders (daily)                          │  │
│  │    - Cleanup old sessions (weekly)                    │  │
│  │    - Generate reports (monthly)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  4. Real-time Features                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Supabase Realtime                                  │  │
│  │  • Use Cases:                                         │  │
│  │    - Live attendance updates                          │  │
│  │    - Collaborative editing                            │  │
│  │    - Notifications                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  5. Search Functionality                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • PostgreSQL Full-Text Search                        │  │
│  │  • OR: Algolia/MeiliSearch                            │  │
│  │  • Search across:                                     │  │
│  │    - Members (name, skills)                           │  │
│  │    - Productions (title, description)                 │  │
│  │    - Events (title, location)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3 Scale (Q3 2026)

```
Multi-Tenant Architecture
─────────────────────────

┌─────────────────────────────────────────┐
│ Tenant 1: Theater Verein Zürich        │
│ Database: backstage_tvz                 │
│ Domain: tvz.backstagepass.app           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Tenant 2: Amateur Theater Bern          │
│ Database: backstage_atb                 │
│ Domain: atb.backstagepass.app           │
└─────────────────────────────────────────┘

Implementation:
• Row-based isolation (tenant_id column)
• OR: Schema-based isolation (separate schemas)
• OR: Database-based isolation (separate DBs)
• Subdomain routing (tenant detection)
```

---

## 📚 Technology Stack Deep-Dive

### Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 15.1.0 | React framework with App Router |
| **UI Library** | React | 19.0.0 | Component-based UI |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS |
| **Icons** | Lucide React | 0.474.0 | Icon library |
| **Forms** | Native | - | HTML5 forms (future: react-hook-form) |
| **State** | React State | - | Local state (future: Zustand if needed) |

### Backend Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Database** | PostgreSQL 15 | Relational database |
| **BaaS** | Supabase | Backend-as-a-Service |
| **API** | PostgREST | Auto-generated REST API |
| **Auth** | GoTrue | Authentication service |
| **Storage** | Supabase Storage | S3-compatible object storage |
| **Realtime** | Supabase Realtime | WebSocket subscriptions |

### Deployment Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Hosting** | Vercel | Serverless deployment |
| **CDN** | Vercel Edge Network | Global content delivery |
| **DNS** | Vercel DNS | Domain management |
| **CI/CD** | Vercel Git Integration | Automatic deployments |
| **Monitoring** | Vercel Analytics | Performance monitoring |

---

## 🎯 Design Decisions & Trade-offs

### Key Architectural Decisions

#### 1. Next.js App Router vs Pages Router

**Decision:** App Router  
**Rationale:**
- Server Components reduce client JS bundle
- Nested layouts reduce code duplication
- Simplified data fetching with async/await
- Future-proof (recommended by Next.js team)

**Trade-offs:**
- Learning curve for Server Components
- Some libraries not yet compatible
- More complex mental model

---

#### 2. Supabase vs Custom Backend

**Decision:** Supabase  
**Rationale:**
- Faster MVP development
- Built-in auth, RLS, realtime
- Managed infrastructure
- PostgreSQL compatibility (no vendor lock-in)
- Free tier for prototyping

**Trade-offs:**
- Less control over backend logic
- Potential vendor lock-in for auth/storage
- Limited customization of API
- Cost increases with scale

---

#### 3. Monorepo vs Multi-repo

**Decision:** Monorepo  
**Rationale:**
- Shared types between frontend/backend
- Unified tooling and dependencies
- Easier refactoring
- Single source of truth

**Trade-offs:**
- Larger repository size
- Potential CI/CD complexity
- All-or-nothing deployments (mitigated by Vercel)

---

#### 4. Tailwind CSS vs CSS-in-JS

**Decision:** Tailwind CSS  
**Rationale:**
- Zero runtime overhead
- Tree-shakeable (smaller bundle)
- Consistent design system
- Fast development with utility classes
- No JS required for styling

**Trade-offs:**
- Class name verbosity
- Learning curve for utility classes
- Less component encapsulation

---

#### 5. Server Components vs Client Components

**Decision:** Server Components by default  
**Rationale:**
- Smaller JS bundle
- Better performance
- Direct database access
- SEO friendly
- Simpler data fetching

**Trade-offs:**
- Cannot use browser APIs
- No interactivity without client components
- More complex component boundaries

---

## 🔍 Quality Attributes

### Security
- **Goal:** Zero security vulnerabilities in production
- **Implementation:** RLS policies, Auth, Input validation, HTTPS
- **Verification:** Security audits, penetration testing

### Performance
- **Goal:** < 2s page load, Lighthouse score > 90
- **Implementation:** Server Components, Edge caching, Code splitting
- **Verification:** Vercel Analytics, Lighthouse CI

### Scalability
- **Goal:** Support 1000+ concurrent users
- **Implementation:** Serverless architecture, database indexing
- **Verification:** Load testing, monitoring

### Reliability
- **Goal:** 99.9% uptime
- **Implementation:** Managed services, backups, monitoring
- **Verification:** Uptime monitoring, incident tracking

### Maintainability
- **Goal:** Easy to understand and modify
- **Implementation:** Clear architecture, TypeScript, documentation
- **Verification:** Code reviews, onboarding time

---

## 📞 Support & Updates

**Maintainer:** AI-Team (Bühnenmeister, Kulissenbauer, Kritiker, Chronist)
**Last Updated:** 2026-02-23
**Next Review:** End of March 2026
**Version:** 2.0.0

---

**This is a living document. Updates welcome!** 🎭
