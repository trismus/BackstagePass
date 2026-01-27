# BackstagePass - Projekt Status

**Stand:** 2026-01-27

---

## Milestone Übersicht

| Milestone | Status | Open | Closed | Due Date |
|-----------|--------|------|--------|----------|
| **Modul 0** | In Progress | 5 | 6 | 2026-02-06 |
| **Modul 1** | In Progress | 15 | 4 | - |
| **Modul 2** | ✅ Done | 0 | 4 | - |
| **Modul 3** | In Progress | 6 | 4 | - |
| **Helfer Liste** | ✅ Done | 3 | 17 | 2026-02-28 |
| **UserExperience** | In Progress | 7 | 4 | - |

**Gesamt:** 36 Open, 39 Closed

---

## Modul 0 - Foundation & Setup

**Beschreibung:** Fundament für alle Module - Authentifizierung & Mitgliederverwaltung

| # | Status | Titel |
|---|--------|-------|
| #83 | 🟡 Open | Epic: Fundament für alle Module |
| #84 | 🟡 Open | 0.1 Benutzer-Authentifizierung & Login-System |
| #85 | 🟡 Open | 0.2 Mitgliederprofil & Benutzerverwaltung |
| #86 | 🟡 Open | 0.3 Rollenmanagement & Permissions |
| #87 | 🟡 Open | 0.4 Audit Log & Activity Tracking |
| #88 | ✅ Closed | 0.1 Benutzer-Authentifizierung & Login-System |
| #89 | ✅ Closed | 0.2 Mitgliederprofil & Benutzerverwaltung |
| #90 | ✅ Closed | 0.3 Rollenmanagement & Permissions |
| #91 | ✅ Closed | 0.4 Audit Log & Activity Tracking |
| #105 | ✅ Closed | Auth-System Supabase SSR + Next.js App Router |
| #107 | ✅ Closed | 0.5 Basis-Layout für Admin-Dashboard |

---

## Modul 1 - Vereinsleben & Helfereinsätze

**Beschreibung:** Core Features - Mitglieder, Veranstaltungen, Events

| # | Status | Titel |
|---|--------|-------|
| #57 | 🟡 Open | Epic: Vereinsleben & Helfereinsätze zentral abbilden |
| #58 | 🟡 Open | Vereinsevents verwalten (Erstellen/Planen/Anmelden) |
| #59 | 🟡 Open | Externe Helfereinsätze abbilden |
| #60 | 🟡 Open | Persönliche Einsatz- und Kalenderübersicht |
| #61 | 🟡 Open | Epic: Operative Aufführungslogistik effizient planen |
| #62 | 🟡 Open | Aufführungen mit Zeitblöcken planen |
| #63 | 🟡 Open | Ressourcen & Räume verwalten |
| #64 | 🟡 Open | Einsatz-Templates für wiederkehrende Abläufe |
| #70 | 🟡 Open | Feature: Events anlegen und verwalten |
| #71 | 🟡 Open | Feature: An- und Abmeldung zu Events |
| #72 | 🟡 Open | Feature: Rollen und Schichten für Helfereinsätze |
| #73 | 🟡 Open | Feature: Meine Einsätze und Helferstunden einsehen |
| #75 | 🟡 Open | Feature: Aufführungen und Spieltermine verwalten |
| #76 | 🟡 Open | Feature: Helfer-Schichten pro Aufführung definieren |
| #77 | 🟡 Open | Feature: Räume und technische Ressourcen verwalten |
| #92 | ✅ Closed | Epic: Vereinsleben & Helfereinsätze zentral abbilden |
| #93 | ✅ Closed | 1.1 Vereinsevents verwalten |
| #94 | ✅ Closed | 1.2 Externe Helfereinsätze abbilden |
| #95 | ✅ Closed | 1.3 Persönliche Einsatz- und Kalenderübersicht |

---

## Modul 2 - Operative Aufführungslogistik ✅

**Beschreibung:** Aufführungen, Ressourcen, Templates - **ABGESCHLOSSEN**

| # | Status | Titel |
|---|--------|-------|
| #96 | ✅ Closed | Epic: Operative Aufführungslogistik effizient planen |
| #97 | ✅ Closed | 2.1 Aufführungen mit Zeitblöcken planen |
| #98 | ✅ Closed | 2.2 Ressourcen & Räume verwalten |
| #99 | ✅ Closed | 2.3 Einsatz-Templates für wiederkehrende Abläufe |

---

## Modul 3 - Künstlerische Planung

**Beschreibung:** Stücke, Besetzungen, Proben

| # | Status | Titel | Labels |
|---|--------|-------|--------|
| #100 | ✅ Closed | Epic: Künstlerische Planung | - |
| #101 | ✅ Closed | 3.1 Stück, Szenen und Rollen strukturieren | - |
| #102 | ✅ Closed | 3.2 Besetzung verwalten | - |
| #103 | ✅ Closed | 3.3 Probenplanung mit künstlerischen Funktionen | - |
| #109 | 🟡 Open | fix(db): RLS Policy für Teilnehmer-Status | bug, prio:high |
| #110 | 🟡 Open | refactor: TypeScript 'any' Casts ersetzen | enhancement |
| #111 | 🟡 Open | fix(ui): confirm() durch Modal ersetzen | enhancement |
| #112 | 🟡 Open | perf(db): Index auf proben_teilnehmer.status | enhancement |
| #113 | 🟡 Open | test: Tests für Künstlerische Planung | enhancement |
| #114 | 🟡 Open | fix: Server-side Authorization Check | enhancement |

---

## Helfer Liste (Feature) ✅

**Beschreibung:** Helferliste zur strukturierten Planung und Besetzung von Helferrollen
**Due:** 2026-02-28
**Status:** IMPLEMENTIERT (2026-01-27)

### Implementierte Funktionen

#### Database (4 Issues) ✅
| # | Status | Titel |
|---|--------|-------|
| #115 | ✅ Done | DB: Create helfer_events table and RLS policies |
| #116 | ✅ Done | DB: Create helfer_rollen_templates table and RLS policies |
| #117 | ✅ Done | DB: Create helfer_rollen_instanzen table and RLS policies |
| #118 | ✅ Done | DB: Create helfer_anmeldungen table and RLS policies |

**Migration:** `20260227000000_helferliste.sql`
- 4 Tabellen mit RLS Policies
- Helper Functions für Auth-Checks
- Seed-Daten für Templates

#### Backend/API (6 Issues) ✅
| # | Status | Titel |
|---|--------|-------|
| #119 | ✅ Done | Integrate helferliste actions with audit logging |
| #120 | ✅ Done | API: Implement CRUD for helfer_events |
| #121 | ✅ Done | API: Implement CRUD for helfer_rollen_instanzen |
| #122 | ✅ Done | API: Implement HelferAnmeldungen actions |
| #123 | ✅ Done | API: Implement double-booking/overlap prevention |
| #131 | ✅ Done | API: Implement public link generation |

**Server Actions:**
- `lib/actions/helferliste.ts` - Haupt-CRUD für Events, Rollen, Anmeldungen
- `lib/actions/helfer-templates.ts` - Template-Verwaltung

#### Frontend/UI (7 Issues) ✅
| # | Status | Titel |
|---|--------|-------|
| #124 | ✅ Done | UI: Admin page for HelferEvent creation/management |
| #125 | ✅ Done | UI: Implement HelferAnmeldung forms |
| #126 | ✅ Done | UI: Admin page for HelferRollenTemplate management |
| #127 | ✅ Done | UI: Member/Public view for HelferEvents/Rollen |
| #128 | ✅ Done | UI: Admin dashboard for HelferAnmeldungen management |
| #129 | ✅ Done | UI: Admin component for HelferRollenInstanz management |
| #134 | ✅ Done | Improve error handling and UI feedback |

**Routes:**
- `/helferliste` - Events-Liste
- `/helferliste/neu` - Neues Event erstellen
- `/helferliste/[id]` - Event-Details mit Rollen-Management
- `/helferliste/templates` - Templates-Verwaltung
- `/helferliste/templates/neu` - Neues Template
- `/helfer/[token]` - Öffentliche Ansicht für externe Helfer

**Components:** 12 Komponenten in `components/helferliste/`

#### Ausstehend (3 Issues)
| # | Status | Titel | Grund |
|---|--------|-------|-------|
| #130 | 🟡 Deferred | Email notifications | Erfordert Email-Infrastruktur |
| #132 | 🟡 Deferred | Unit/Integration tests | Optional |
| #133 | 🟡 Deferred | End-to-End tests | Optional |

---

## UserExperience

**Beschreibung:** Rollenbasierte UI/UX Verbesserungen

| # | Status | Titel |
|---|--------|-------|
| #137 | ✅ Closed | [UX] Navigation-Konfiguration zentralisieren |
| #138 | ✅ Closed | [UX] Rollenbasierte Redirects implementieren |
| #139 | ✅ Closed | [UX] Sidebar-Komponente erstellen |
| #140 | ✅ Closed | [UX] Header-Komponente anpassen |
| #141 | ✅ Closed | [UX] Layout-Struktur für Bereiche implementieren |
| #142 | 🟡 Open | [UX] Management-Dashboard erweitern |
| #143 | 🟡 Open | [UX] Mein-Bereich Dashboard für aktive Mitglieder |
| #144 | 🟡 Open | [UX] Mein-Bereich für passive Mitglieder |
| #145 | 🟡 Open | [UX] Helfer-Dashboard erstellen |
| #146 | 🟡 Open | [UX] Partner-Portal erstellen |
| #147 | 🟡 Open | [UX] Willkommen-Seite für Gäste/Freunde |

---

## Changelog (2026-01-27)

### Helferliste Feature - Vollständig implementiert

**Neue Dateien:**

| Datei | Beschreibung |
|-------|--------------|
| `supabase/migrations/20260227000000_helferliste.sql` | Database Migration |
| `lib/actions/helferliste.ts` | Server Actions (Events, Rollen, Anmeldungen) |
| `lib/actions/helfer-templates.ts` | Server Actions (Templates) |
| `app/(protected)/helferliste/page.tsx` | Events-Liste |
| `app/(protected)/helferliste/neu/page.tsx` | Neues Event |
| `app/(protected)/helferliste/[id]/page.tsx` | Event-Details |
| `app/(protected)/helferliste/templates/page.tsx` | Templates-Liste |
| `app/(protected)/helferliste/templates/neu/page.tsx` | Neues Template |
| `app/(public)/helfer/[token]/page.tsx` | Öffentliche Helfer-Ansicht |
| `components/helferliste/*.tsx` | 12 UI-Komponenten |

**Geänderte Dateien:**

| Datei | Änderung |
|-------|----------|
| `lib/supabase/types.ts` | Neue Typen für Helferliste |
| `lib/supabase/auth-helpers.ts` | Neue Permissions (helferliste:*) |
| `lib/navigation.ts` | Navigation für /helferliste hinzugefügt |

### Build-Fixes

| Datei | Problem | Lösung |
|-------|---------|--------|
| `app/page.tsx` | `let` statt `const` | Geändert zu `const` |
| `app/(protected)/hilfe/page.tsx` | Static Generation + Cookies | `force-dynamic` hinzugefügt |
| `app/(protected)/hilfe/[slug]/page.tsx` | Static Generation + Cookies | `force-dynamic` hinzugefügt |
| `app/(protected)/dashboard/page.tsx` | Unbenutzte Variable `nextWeek` | Entfernt |

---

## Statistik

```
Total Issues:     75 (36 open, 39 closed)
Milestones:       6

Progress by Milestone:
├── Modul 0:       55% (6/11 closed)
├── Modul 1:       21% (4/19 closed)
├── Modul 2:      100% (4/4 closed) ✅
├── Modul 3:       40% (4/10 closed)
├── Helfer Liste:  85% (17/20 closed) ✅
└── UserExperience: 45% (5/11 closed)
```

---

*Aktualisiert am 2026-01-27*
