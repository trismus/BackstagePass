# BackstagePass - Projekt Status

**Stand:** 2026-02-17

---

## Milestone Übersicht

| Milestone | Status | Open | Closed |
|-----------|--------|------|--------|
| **Modul 0** — Foundation & Setup | ✅ Done | 0 | 11 |
| **Modul 1** — Vereinsleben & Helfereinsätze | ✅ Done | 0 | 4 |
| **Modul 2** — Operative Aufführungslogistik | ✅ Done | 0 | 4 |
| **Modul 3** — Künstlerische Planung | ✅ Done | 0 | 10 |
| **Helfer Liste** | ✅ Done | 0 | 20 |
| **UserExperience** | ✅ Done | 0 | 11 |
| **Vorhang auf** — Mitglieder-Integration | ✅ Done | 0 | 9 |
| **Mitglieder** | ✅ Done | 0 | 7 |
| **Produktionen** | ✅ Done | 0 | 10 |
| **Künstlerische Produktion** | ✅ Done | 0 | 7 |
| **Künstlerische Produktion (Features)** | ✅ Done | 0 | 2 |
| **UI/UX Foundation** | ✅ Done | 0 | 6 |
| **Security & DSGVO** | ✅ Done | 0 | 10 |
| **Code Quality & Performance** | ✅ Done | 0 | 4 |
| **M1–M8** (Helferliste Roadmap) | ✅ Done | 0 | 32 |
| **Public Volunteer Booking Flow** | ✅ Done | 0 | 11 |
| **Mitglieder-Onboarding** | ✅ Done | 0 | 5 |
| **Probenplan: Status-Fix & Generator** | ✅ Done | 0 | 7 |
| **Fix Email-Einladungssystem** | ✅ Done | 0 | 1 |

**Gesamt:** 200 Issues (0 open, 200 closed)

---

## Offene Issues

Keine offenen Issues.

---

## Modul 0 - Foundation & Setup ✅

**Beschreibung:** Fundament für alle Module - Authentifizierung & Mitgliederverwaltung

| # | Status | Titel |
|---|--------|-------|
| #83 | ✅ Closed | Epic: Fundament für alle Module |
| #84 | ✅ Closed | 0.1 Benutzer-Authentifizierung & Login-System |
| #85 | ✅ Closed | 0.2 Mitgliederprofil & Benutzerverwaltung |
| #86 | ✅ Closed | 0.3 Rollenmanagement & Permissions |
| #87 | ✅ Closed | 0.4 Audit Log & Activity Tracking |
| #88 | ✅ Closed | 0.1 Benutzer-Authentifizierung & Login-System |
| #89 | ✅ Closed | 0.2 Mitgliederprofil & Benutzerverwaltung |
| #90 | ✅ Closed | 0.3 Rollenmanagement & Permissions |
| #91 | ✅ Closed | 0.4 Audit Log & Activity Tracking |
| #105 | ✅ Closed | Auth-System Supabase SSR + Next.js App Router |
| #107 | ✅ Closed | 0.5 Basis-Layout für Admin-Dashboard |

---

## Modul 1 - Vereinsleben & Helfereinsätze ✅

**Beschreibung:** Core Features - Mitglieder, Veranstaltungen, Events

| # | Status | Titel |
|---|--------|-------|
| #92 | ✅ Closed | Epic: Vereinsleben & Helfereinsätze zentral abbilden |
| #93 | ✅ Closed | 1.1 Vereinsevents verwalten |
| #94 | ✅ Closed | 1.2 Externe Helfereinsätze abbilden |
| #95 | ✅ Closed | 1.3 Persönliche Einsatz- und Kalenderübersicht |

---

## Modul 2 - Operative Aufführungslogistik ✅

**Beschreibung:** Aufführungen, Ressourcen, Templates

| # | Status | Titel |
|---|--------|-------|
| #96 | ✅ Closed | Epic: Operative Aufführungslogistik effizient planen |
| #97 | ✅ Closed | 2.1 Aufführungen mit Zeitblöcken planen |
| #98 | ✅ Closed | 2.2 Ressourcen & Räume verwalten |
| #99 | ✅ Closed | 2.3 Einsatz-Templates für wiederkehrende Abläufe |

---

## Modul 3 - Künstlerische Planung ✅

**Beschreibung:** Stücke, Besetzungen, Proben

| # | Status | Titel |
|---|--------|-------|
| #100 | ✅ Closed | Epic: Künstlerische Planung |
| #101 | ✅ Closed | 3.1 Stück, Szenen und Rollen strukturieren |
| #102 | ✅ Closed | 3.2 Besetzung verwalten |
| #103 | ✅ Closed | 3.3 Probenplanung mit künstlerischen Funktionen |
| #109 | ✅ Closed | fix(db): RLS Policy für Teilnehmer-Status |
| #110 | ✅ Closed | refactor: TypeScript 'any' Casts ersetzen |
| #111 | ✅ Closed | fix(ui): confirm() durch Modal ersetzen |
| #112 | ✅ Closed | perf(db): Index auf proben_teilnehmer.status |
| #113 | ✅ Closed | test: Tests für Künstlerische Planung |
| #114 | ✅ Closed | fix: Server-side Authorization Check |

---

## Helfer Liste ✅

**Beschreibung:** Helferliste zur strukturierten Planung und Besetzung von Helferrollen
**Status:** VOLLSTÄNDIG ABGESCHLOSSEN

#### Database (4 Issues) ✅
| # | Status | Titel |
|---|--------|-------|
| #115 | ✅ Closed | DB: Create helfer_events table and RLS policies |
| #116 | ✅ Closed | DB: Create helfer_rollen_templates table and RLS policies |
| #117 | ✅ Closed | DB: Create helfer_rollen_instanzen table and RLS policies |
| #118 | ✅ Closed | DB: Create helfer_anmeldungen table and RLS policies |

#### Backend/API (6 Issues) ✅
| # | Status | Titel |
|---|--------|-------|
| #119 | ✅ Closed | Integrate helferliste actions with audit logging |
| #120 | ✅ Closed | API: Implement CRUD for helfer_events |
| #121 | ✅ Closed | API: Implement CRUD for helfer_rollen_instanzen |
| #122 | ✅ Closed | API: Implement HelferAnmeldungen actions |
| #123 | ✅ Closed | API: Implement double-booking/overlap prevention |
| #131 | ✅ Closed | API: Implement public link generation |

#### Frontend/UI (7 Issues) ✅
| # | Status | Titel |
|---|--------|-------|
| #124 | ✅ Closed | UI: Admin page for HelferEvent creation/management |
| #125 | ✅ Closed | UI: Implement HelferAnmeldung forms |
| #126 | ✅ Closed | UI: Admin page for HelferRollenTemplate management |
| #127 | ✅ Closed | UI: Member/Public view for HelferEvents/Rollen |
| #128 | ✅ Closed | UI: Admin dashboard for HelferAnmeldungen management |
| #129 | ✅ Closed | UI: Admin component for HelferRollenInstanz management |
| #134 | ✅ Closed | Improve error handling and UI feedback |

#### Ehemals Ausstehend (3 Issues) ✅
| # | Status | Titel |
|---|--------|-------|
| #130 | ✅ Closed | Email notifications |
| #132 | ✅ Closed | Unit/Integration tests |
| #133 | ✅ Closed | End-to-End tests |

---

## UserExperience ✅

**Beschreibung:** Rollenbasierte UI/UX Verbesserungen

| # | Status | Titel |
|---|--------|-------|
| #137 | ✅ Closed | [UX] Navigation-Konfiguration zentralisieren |
| #138 | ✅ Closed | [UX] Rollenbasierte Redirects implementieren |
| #139 | ✅ Closed | [UX] Sidebar-Komponente erstellen |
| #140 | ✅ Closed | [UX] Header-Komponente anpassen |
| #141 | ✅ Closed | [UX] Layout-Struktur für Bereiche implementieren |
| #142 | ✅ Closed | [UX] Management-Dashboard erweitern |
| #143 | ✅ Closed | [UX] Mein-Bereich Dashboard für aktive Mitglieder (via #317) |
| #144 | ✅ Closed | [UX] Mein-Bereich für passive Mitglieder |
| #145 | ✅ Closed | [UX] Helfer-Dashboard erstellen (via #318) |
| #146 | ✅ Closed | [UX] Partner-Portal erstellen |
| #147 | ✅ Closed | [UX] Willkommen-Seite für Gäste/Freunde |
| #328 | ✅ Closed | Onboarding-Flow nach erstem Login (PR #338) |

---

## Vorhang auf — Mitglieder-Integration ✅

**Beschreibung:** Integration von Mitgliederprofilen mit Schichtplanung, Veranstaltungen/Aufführungen und künstlerischen Produktionen.

| # | Status | Titel |
|---|--------|-------|
| #343 | ✅ Closed | Verfügbarkeitskonflikt-Erkennung bei Schichtzuweisung (PR #351) |
| #344 | ✅ Closed | Besetzung → Aufführungs-Zuweisungen automatisch erstellen (PR #352) |
| #345 | ✅ Closed | Proben-Teilnehmer aus Besetzung auto-befüllen (PR #354) |
| #346 | ✅ Closed | Zentrale Personen-Einsatzübersicht (Mein Kalender) (PR #353) |
| #347 | ✅ Closed | Skills-basierte Schicht-Vorschläge |
| #348 | ✅ Closed | Produktions-Dashboard: Besetzungs- und Schicht-Fortschritt |
| #349 | ✅ Closed | Personen-Detailseite: Rollen- und Einsatzhistorie (PR #366) |
| #350 | ✅ Closed | Verfügbarkeiten bei Produktionsplanung berücksichtigen (PR #366) |
| #355 | ✅ Closed | Probenplan-Generator: Optimal-Termine und Szenenauswahl |

---

## Weitere abgeschlossene Milestones

### Mitglieder ✅ (7 Issues)
#149–#155 — Mitgliederverwaltung, Profil, Kontaktdaten, Skills, Notfallkontakte

### Produktionen ✅ (10 Issues)
#156–#162, #173–#175 — Produktions-Entität, Serien, Veranstaltungen, Proben-Integration

### Künstlerische Produktion ✅ (9 Issues)
#163–#165, #167–#170, #192–#193 — Szenen, Rollen, Besetzungen, Probenplan

### UI/UX Foundation ✅ (6 Issues)
#176–#181 — Design-System, Tailwind-Palette, Responsive Layout

### Security & DSGVO ✅ (10 Issues)
#186–#191, #269, #270, #274, #276 — RLS Policies, Auth-Hardening, DSGVO-Compliance

### Code Quality & Performance ✅ (4 Issues)
#271–#273, #275 — TypeScript Strict Mode, Linting, Performance-Optimierungen

### M1–M8 Helferliste Roadmap ✅ (32 Issues)
#201–#232 — Datenmodell, Template-Management, Helfer-Profile, Public Booking, Admin-Ansichten, Kommunikation, Live-Ops, Reporting

### Public Volunteer Booking Flow ✅ (11 Issues)
#242–#252 — Öffentliche Anmeldung, Token-System, Warteliste, Feedback

### Mitglieder-Onboarding ✅ (5 Issues)
#324–#328 — Einladungsflow, Passwort-Setup, Onboarding-Wizard

### Probenplan: Status-Fix & Generator ✅ (7 Issues)
#359–#365 — Status-Filterung, Konstanten, Generator-Hints, Tests

### Security Fixes (ohne Milestone)
#368, #369, #371–#377 — Open Redirect Fix, RLS Self-Escalation, IDOR Protections, Permission Checks (alle 12 Dateien)

---

## Changelog

### 2026-02-17: Probenplan Status-Konstanten, Filter, Hints & Tests (#378-382, PR #370)

- Zentrale Konstanten `STUECK_STATUS_LABELS` und `PROBENPLAN_ELIGIBLE_STATUS` in `types.ts`
- Duplizierte Label-Strings in `StatusBadge`, `StueckForm` und Generator-Page durch Konstanten ersetzt
- Probenplan-Generator zeigt nun auch Stücke mit Status `aktiv` an (nicht nur `in_proben`/`in_planung`)
- Stücke-Detailseite zeigt Callout-Hinweis mit Link zum Generator für berechtigte Stücke
- `StueckMitSzenen.status` von `string` zu `StueckStatus` typisiert
- 10 Unit Tests für Konstanten, Filterung, Generierung und Berechtigungsprüfung

### 2026-02-17: Missing Permission Checks komplett (#373, PR #387)

- `requirePermission()` zu allen 12 Server-Action-Dateien hinzugefügt die im Security-Audit aufgefallen sind
- Letzte 2 Funktionen in `externe-helfer.ts` geschlossen: `findOrCreateExternalHelper` (`helfereinsaetze:write`) und `getExterneHelferProfilByEmail` (`mitglieder:read`)
- `notifications.ts` absichtlich ohne `requirePermission()` — implizite Auth via `getUserProfile()` + RLS (user-scoped)

### 2026-02-17: Security Fixes (#368-369, #371-377)

- Open Redirect in Auth-Routes behoben (#368)
- RLS Self-Escalation verhindert (#369)
- Missing Permission Checks auf Server Actions (#371, #372, #374-377)
- IDOR Protections für geschützte Ressourcen

### 2026-02-17: Proben-Teilnehmer aus Besetzung auto-befüllen (#345, PR #354)

- "Aus Besetzungen"-Button öffnet jetzt Vorschau-Dialog statt direkt einzufügen
- `suggestProbenTeilnehmer()`: Read-only Server Action, liefert Vorschläge mit Rollennamen, Duplikat-Erkennung und Konflikt-Prüfung pro Person (max 50)
- Fallback: Ohne zugewiesene Szenen werden alle Besetzungen des Stücks vorgeschlagen
- `confirmProbenTeilnehmer()`: Batch-Upsert mit Status `eingeladen` und Duplikat-Sicherheit
- `TeilnehmerPreviewDialog`: Select/Deselect-All, Rollen-Anzeige, `ConflictWarning` inline, "bereits vorhanden" ausgegraut
- 10 Unit Tests für beide Server Actions

### 2026-02-17: Zentrale Personen-Einsatzübersicht (#346, PR #353)

- `getPersonalEvents()` erweitert um 2 neue Quellen: **Helfer-Anmeldungen** und **Helferschichten** — insgesamt 5 Quellen
- `PersonalCalendar`: Verfügbarkeiten als FullCalendar-Hintergrund-Layer
- `/mitglieder/[id]`: Einsatzübersicht-Sektion mit readOnly-Kalender
- 9 Unit Tests

### 2026-02-17: Besetzung → Aufführungs-Zuweisungen (#344, PR #352)

- Neuer Status `vorgeschlagen` für `auffuehrung_zuweisungen`
- `generateZuweisungenPreview()` und `confirmZuweisungen()` Server Actions
- Vorschau-Dialog mit Gruppen-Auswahl und Konflikt-Prüfung
- 10 Unit Tests

### 2026-02-17: Verfügbarkeitskonflikt-Erkennung (#343, PR #351)

- DB-Funktion `check_person_conflicts()` für Cross-System-Konflikterkennung
- Nicht-blockierende Konfliktwarnung in Aufführungen, Proben und Helferliste
- 5 Unit Tests

### 2026-02-17: Onboarding-Flow nach erstem Login (#328)

- `onboarding_completed` Boolean auf `profiles` Tabelle
- Middleware-Redirect zu `/willkommen` für neue Benutzer
- 2-Schritt OnboardingWizard

### 2026-02-16: Dashboard-Restructuring & Vorstand Mein Bereich

- Stundenkonto nur noch für ADMIN/VORSTAND
- `/vorstand/termine`, `/vorstand/stundenkonto`, `/vorstand/einsaetze`
- Dashboard-Konsolidierung für alle Rollen
- Helfer-Dashboard mit persönlicher Einsatzübersicht
- Template-Editor vollständig editierbar

### 2026-02-05: M1 - Datenmodell & Templates Complete

- Template-System mit Offset-basiertem Zeitsystem (ADR-001)
- Seed-Daten: "Abendvorstellung" Template

### 2026-01-27: Helferliste Feature - Vollständig implementiert

- 4 DB-Tabellen mit RLS Policies
- Server Actions, 12 UI-Komponenten
- Öffentliche Helfer-Ansicht via Token-Link

---

## Statistik

```
Total Issues:     200 (0 open, 200 closed)
Milestones:       19+ (19 complete)

Offene Issues:    Keine

Abgeschlossene Kern-Module:
├── Modul 0 (Foundation):        100% (11/11) ✅
├── Modul 1 (Vereinsleben):      100% (4/4) ✅
├── Modul 2 (Aufführungen):      100% (4/4) ✅
├── Modul 3 (Künstlerisch):      100% (10/10) ✅
├── Helfer Liste:                 100% (20/20) ✅
├── UserExperience:               100% (11/11) ✅
└── Vorhang auf:                  100% (9/9) ✅
```

---

*Aktualisiert am 2026-02-17*
