# BackstagePass - Projekt Status

**Stand:** 2026-02-23

---

## Milestone Uebersicht

| Milestone | Status | Open | Closed | Due Date |
|-----------|--------|------|--------|----------|
| **Modul 0** | Done | 5 | 6 | 2026-02-06 |
| **Modul 1** | Done | 15 | 4 | - |
| **Modul 2** | Done | 0 | 4 | - |
| **Modul 3** | Wartung | 6 | 4 | - |
| **Helfer Liste** | Done | 3 | 17 | 2026-02-28 |
| **UserExperience** | In Progress | 4 | 8 | - |
| **Vorhang auf** | In Progress | 4 | 4 | - |

**Gesamt:** ~40 Open, ~44 Closed

---

## Modul 0 - Foundation & Setup

**Beschreibung:** Fundament fuer alle Module - Authentifizierung & Mitgliederverwaltung

| # | Status | Titel |
|---|--------|-------|
| #88 | Closed | 0.1 Benutzer-Authentifizierung & Login-System |
| #89 | Closed | 0.2 Mitgliederprofil & Benutzerverwaltung |
| #90 | Closed | 0.3 Rollenmanagement & Permissions |
| #91 | Closed | 0.4 Audit Log & Activity Tracking |
| #105 | Closed | Auth-System Supabase SSR + Next.js App Router |
| #107 | Closed | 0.5 Basis-Layout fuer Admin-Dashboard |

---

## Modul 1 - Vereinsleben & Helfereinsaetze

**Beschreibung:** Core Features - Mitglieder, Veranstaltungen, Events

| # | Status | Titel |
|---|--------|-------|
| #92 | Closed | Epic: Vereinsleben & Helfereinsaetze zentral abbilden |
| #93 | Closed | 1.1 Vereinsevents verwalten |
| #94 | Closed | 1.2 Externe Helfereinsaetze abbilden |
| #95 | Closed | 1.3 Persoenliche Einsatz- und Kalenderuebersicht |

---

## Modul 2 - Operative Auffuehrungslogistik (Done)

| # | Status | Titel |
|---|--------|-------|
| #96 | Closed | Epic: Operative Auffuehrungslogistik effizient planen |
| #97 | Closed | 2.1 Auffuehrungen mit Zeitbloecken planen |
| #98 | Closed | 2.2 Ressourcen & Raeume verwalten |
| #99 | Closed | 2.3 Einsatz-Templates fuer wiederkehrende Ablaeufe |

---

## Modul 3 - Kuenstlerische Planung

**Beschreibung:** Stuecke, Besetzungen, Proben - Kern implementiert, Wartungs-Issues offen

| # | Status | Titel | Labels |
|---|--------|-------|--------|
| #100 | Closed | Epic: Kuenstlerische Planung | - |
| #101 | Closed | 3.1 Stueck, Szenen und Rollen strukturieren | - |
| #102 | Closed | 3.2 Besetzung verwalten | - |
| #103 | Closed | 3.3 Probenplanung mit kuenstlerischen Funktionen | - |
| #109 | Open | fix(db): RLS Policy fuer Teilnehmer-Status | bug, prio:high |
| #110 | Open | refactor: TypeScript 'any' Casts ersetzen | enhancement |
| #111 | Open | fix(ui): confirm() durch Modal ersetzen | enhancement |
| #112 | Open | perf(db): Index auf proben_teilnehmer.status | enhancement |
| #113 | Open | test: Tests fuer Kuenstlerische Planung | enhancement |
| #114 | Open | fix: Server-side Authorization Check | enhancement |

---

## Helfer Liste (Feature) - Done

**Beschreibung:** Helferliste zur strukturierten Planung und Besetzung von Helferrollen
**Due:** 2026-02-28
**Status:** IMPLEMENTIERT (2026-01-27), `/helferliste` ersetzt durch `/mitmachen` (2026-02-17)

### Implementierte Funktionen

#### Database (4 Issues)
| # | Status | Titel |
|---|--------|-------|
| #115 | Done | DB: Create helfer_events table and RLS policies |
| #116 | Done | DB: Create helfer_rollen_templates table and RLS policies |
| #117 | Done | DB: Create helfer_rollen_instanzen table and RLS policies |
| #118 | Done | DB: Create helfer_anmeldungen table and RLS policies |

#### Backend/API (6 Issues)
| # | Status | Titel |
|---|--------|-------|
| #119 | Done | Integrate helferliste actions with audit logging |
| #120 | Done | API: Implement CRUD for helfer_events |
| #121 | Done | API: Implement CRUD for helfer_rollen_instanzen |
| #122 | Done | API: Implement HelferAnmeldungen actions |
| #123 | Done | API: Implement double-booking/overlap prevention |
| #131 | Done | API: Implement public link generation |

#### Frontend/UI (7 Issues)
| # | Status | Titel |
|---|--------|-------|
| #124 | Done | UI: Admin page for HelferEvent creation/management |
| #125 | Done | UI: Implement HelferAnmeldung forms |
| #126 | Done | UI: Admin page for HelferRollenTemplate management |
| #127 | Done | UI: Member/Public view for HelferEvents/Rollen |
| #128 | Done | UI: Admin dashboard for HelferAnmeldungen management |
| #129 | Done | UI: Admin component for HelferRollenInstanz management |
| #134 | Done | Improve error handling and UI feedback |

#### Deferred (3 Issues)
| # | Status | Titel | Grund |
|---|--------|-------|-------|
| #130 | Deferred | Email notifications | Teilweise via SMTP umgesetzt |
| #132 | Deferred | Unit/Integration tests | Optional |
| #133 | Deferred | End-to-End tests | Optional |

**Aktueller Stand:** `/helferliste` Admin-Modul entfernt (#355), Funktionalitaet in `/mitmachen` (oeffentlich) und `/auffuehrungen/[id]/helferliste` (admin) integriert.

---

## UserExperience

**Beschreibung:** Rollenbasierte UI/UX Verbesserungen

| # | Status | Titel |
|---|--------|-------|
| #137 | Closed | [UX] Navigation-Konfiguration zentralisieren |
| #138 | Closed | [UX] Rollenbasierte Redirects implementieren |
| #139 | Closed | [UX] Sidebar-Komponente erstellen |
| #140 | Closed | [UX] Header-Komponente anpassen |
| #141 | Closed | [UX] Layout-Struktur fuer Bereiche implementieren |
| #142 | Open | [UX] Management-Dashboard erweitern |
| #143 | Closed | [UX] Mein-Bereich Dashboard fuer aktive Mitglieder (via #317) |
| #144 | Open | [UX] Mein-Bereich fuer passive Mitglieder |
| #145 | Closed | [UX] Helfer-Dashboard erstellen (via #318) |
| #146 | Open | [UX] Partner-Portal erstellen |
| #147 | Open | [UX] Willkommen-Seite fuer Gaeste/Freunde |
| #328 | Closed | Onboarding-Flow nach erstem Login (PR #338) |

---

## Vorhang auf -- Mitglieder-Integration (Milestone #24)

**Beschreibung:** End-to-End Integration von Mitgliederprofilen mit Schichtplanung, Veranstaltungen/Auffuehrungen und kuenstlerischen Produktionen.

| # | Status | Titel | Prio |
|---|--------|-------|------|
| #343 | Closed | Verfuegbarkeitskonflikt-Erkennung bei Schichtzuweisung (PR #351) | high |
| #344 | Closed | Besetzung zu Auffuehrungs-Zuweisungen automatisch erstellen (PR #352) | high |
| #345 | Closed | Proben-Teilnehmer aus Besetzung auto-befuellen (PR #354) | - |
| #346 | Closed | Zentrale Personen-Einsatzuebersicht (Mein Kalender) (PR #353) | high |
| #347 | Open | Skills-basierte Schicht-Vorschlaege (teilweise impl.) | - |
| #348 | Open | Produktions-Dashboard: Besetzungs- und Schicht-Fortschritt (teilweise impl.) | - |
| #349 | Open | Personen-Detailseite: Rollen- und Einsatzhistorie | - |
| #350 | Open | Verfuegbarkeiten bei Produktionsplanung beruecksichtigen | - |

---

## Statistik

```
Total Commits:    77
Total Migrations: 78
Total Issues:     ~84 (40 open, 44 closed)
Milestones:       7

Progress by Milestone:
├── Modul 0:             100% (11/11) ✓
├── Modul 1:             100% (19/19) ✓
├── Modul 2:             100% (4/4)   ✓
├── Modul 3:              40% (4/10)  (Kern fertig, 6 Wartung)
├── Helfer Liste:         85% (17/20) ✓ (3 deferred)
├── UserExperience:       67% (8/12)
└── Vorhang auf:          50% (4/8)
```

## Aktuelle Entwicklungen (Feb 2026)

### Abgeschlossene Features (seit letztem Update)
- Skills-basierte Schicht-Vorschlaege und Produktions-Dashboard (#347, #348) -- teilweise
- `/helferliste` Admin-Modul entfernt, ersetzt durch `/mitmachen` (#355)
- Proben-Teilnehmer aus Besetzung auto-befuellen mit Vorschau-Dialog (#345)
- Zentrale Personen-Einsatzuebersicht mit 5 Quellen + Verfuegbarkeiten (#346)
- Besetzung zu Auffuehrungs-Zuweisungen automatisch erstellen (#344)
- Verfuegbarkeitskonflikt-Erkennung bei Schichtzuweisung (#343)
- Onboarding-Flow nach erstem Login (#328)
- Dashboard-Restructuring: Stundenkonto aus MITGLIED_AKTIV entfernt
- Vorstand "Mein Bereich" mit Termine, Stundenkonto, Einsaetze
- Branded Einladungs-Email via SMTP (#333)
- Bulk-Einladung von Mitglieder-Liste (#327)
- Einladungs-Tracking und Resend (#325)
- Einladungs-Aktion fuer bestehende Mitglieder (#324)
- Template-Editor vollstaendig editierbar (alle Elemente inline)
- Dashboard-Konsolidierung (einheitliche Startseite fuer alle Rollen)
- Helfer-Dashboard mit persoenlicher Einsatzuebersicht
- Profilvervollstaendigungs-Checkliste auf Dashboard
- Fallback-Email auf theatergruppewiden@gmail.com aktualisiert

### In Bearbeitung / Geplant
- Vorhang auf: 4 Issues (#347-#350) -- Skills-Matching, Produktions-Dashboard, Einsatzhistorie, Verfuegbarkeiten
- Partner-Portal (#146)
- Passive Mitglieder Ansicht (#144)
- Willkommen-Seite fuer Gaeste (#147)
- Management-Dashboard Erweiterungen (#142)

### Technische Verbesserungen
- Server Actions mit robustem Error Handling
- revalidatePath fuer alle relevanten Routen
- TypeScript-Typsicherheit durchgaengig
- Cross-System Konflikterkennung (DB-Funktion + UI)
- Konsistente UI-Patterns ueber alle Module
- 34+ Unit Tests fuer Server Actions

---

*Aktualisiert am 2026-02-23 (Johannes, der Chronist)*
