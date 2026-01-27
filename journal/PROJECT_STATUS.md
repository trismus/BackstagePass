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
| **Helfer Liste** | Open | 20 | 0 | 2026-02-28 |
| **UserExperience** | In Progress | 7 | 4 | - |

**Gesamt:** 53 Open, 22 Closed

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

## Helfer Liste (Feature)

**Beschreibung:** Helferliste zur strukturierten Planung und Besetzung von Helferrollen
**Due:** 2026-02-28

### Database (4 Issues)
| # | Titel | Labels |
|---|-------|--------|
| #115 | DB: Create helfer_events table and RLS policies | database, migration |
| #116 | DB: Create helfer_rollen_templates table and RLS policies | database, migration |
| #117 | DB: Create helfer_rollen_instanzen table and RLS policies | database, migration |
| #118 | DB: Create helfer_anmeldungen table and RLS policies | database, migration |

### Backend/API (6 Issues)
| # | Titel | Labels |
|---|-------|--------|
| #119 | Integrate helferliste actions with audit logging | backend |
| #120 | API: Implement CRUD for helfer_events | backend, api |
| #121 | API: Implement CRUD for helfer_rollen_instanzen | backend, api |
| #122 | API: Implement HelferAnmeldungen actions | backend, api |
| #123 | API: Implement double-booking/overlap prevention | backend, api |
| #131 | API: Implement public link generation | backend, api |

### Frontend/UI (7 Issues)
| # | Titel | Labels |
|---|-------|--------|
| #124 | UI: Admin page for HelferEvent creation/management | frontend, ui, admin |
| #125 | UI: Implement HelferAnmeldung forms | frontend, ui |
| #126 | UI: Admin page for HelferRollenTemplate management | frontend, ui, admin |
| #127 | UI: Member/Public view for HelferEvents/Rollen | frontend, ui |
| #128 | UI: Admin dashboard for HelferAnmeldungen management | frontend, ui, admin |
| #129 | UI: Admin component for HelferRollenInstanz management | frontend, ui, admin |
| #134 | Improve error handling and UI feedback | frontend, ui |

### Sonstige (3 Issues)
| # | Titel | Labels |
|---|-------|--------|
| #130 | Integrate email notifications for Helferliste | backend |
| #132 | Tests: Unit/Integration tests for Helferliste | tests |
| #133 | Tests: End-to-End tests for Helferliste workflows | tests |

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

## Geschlossene Issues ohne Milestone

Diese Issues wurden geschlossen (Duplikate, erledigt, oder veraltet):

| # | Titel | Grund |
|---|-------|-------|
| #65 | Epic: Künstlerische Planung | Abgeschlossen in #100 |
| #66 | Stück, Szenen und Rollen | Duplikat von #101 |
| #67 | Besetzung verwalten | Duplikat von #102 |
| #68 | Probenplanung | Duplikat von #103 |
| #69 | Epic: Vereinsleben | Duplikat von #57 |
| #74 | Epic: Produktion & Logistik | Duplikat von #61 |
| #78 | Epic: Künstlerische Leitung | Abgeschlossen |
| #79-82 | Feature: Stücke/Szenen/Rollen/Proben | Duplikate von #101-103 |
| #104 | UI/UX Design-Vorgaben | Erledigt |
| #108 | Erweiterte Nutzerrollen | Implementiert |
| #135 | Frontend Styling Cleanup | Erledigt |

---

## Statistik

```
Total Issues:     75 (53 open, 22 closed)
Milestones:       6

Progress by Milestone:
├── Modul 0:      55% (6/11 closed)
├── Modul 1:      21% (4/19 closed)
├── Modul 2:     100% (4/4 closed) ✅
├── Modul 3:      40% (4/10 closed)
├── Helfer Liste:  0% (0/20 closed)
└── UserExperience: 45% (5/11 closed)
```

---

*Generiert am 2026-01-27*
