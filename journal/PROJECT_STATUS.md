# BackstagePass - Projekt Status

**Stand:** 2026-02-17

---

## Milestone Übersicht

| Milestone | Status | Open | Closed | Due Date |
|-----------|--------|------|--------|----------|
| **Modul 0** | In Progress | 5 | 6 | 2026-02-06 |
| **Modul 1** | In Progress | 15 | 4 | - |
| **Modul 2** | ✅ Done | 0 | 4 | - |
| **Modul 3** | In Progress | 6 | 4 | - |
| **Helfer Liste** | ✅ Done | 3 | 17 | 2026-02-28 |
| **UserExperience** | In Progress | 7 | 5 | - |
| **Vorhang auf** | In Progress | 4 | 4 | - |

**Gesamt:** 40 Open, 44 Closed

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
**Status:** Admin-UI entfernt (#355), Funktionalität in `/mitmachen` und `/auffuehrungen` integriert

### Aktueller Stand (nach #355)

Die eigenständigen `/helferliste`-Admin-Routes wurden entfernt. Die Funktionalität ist jetzt integriert in:
- `/mitmachen` — Öffentliche Mitmachen-Seite (ersetzt `/helferliste`)
- `/auffuehrungen/[id]/helferliste` — Helferliste pro Aufführung
- `/helfer/[token]` — Öffentliche Helfer-Registrierung (unverändert)
- `/helfer/helferliste/abmeldung/[token]` — Öffentliche Abmeldung (unverändert)

**Erhaltene Komponenten:** `StatusBadge`, `PublicEventView`, `MultiSelectContext`
**Erhaltene Server Actions:** `getPublicEventByToken`, `anmeldenPublicMulti` (in `lib/actions/helferliste.ts`)
**DB-Tabellen & RPC-Funktionen:** Alle erhalten (weiterhin genutzt)

### Entfernt mit #355
- Admin-Routes: `/helferliste`, `/helferliste/neu`, `/helferliste/[id]`, `/helferliste/templates/*`
- 10 exklusive Komponenten, `helfer-templates.ts`, Dashboard-Widget
- E2E-Tests: `helferliste-admin.spec.ts`, `helferliste-member.spec.ts`

### Database (4 Issues) ✅
| # | Status | Titel |
|---|--------|-------|
| #115 | ✅ Done | DB: Create helfer_events table and RLS policies |
| #116 | ✅ Done | DB: Create helfer_rollen_templates table and RLS policies |
| #117 | ✅ Done | DB: Create helfer_rollen_instanzen table and RLS policies |
| #118 | ✅ Done | DB: Create helfer_anmeldungen table and RLS policies |

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
| #143 | ✅ Closed | [UX] Mein-Bereich Dashboard für aktive Mitglieder (via #317) |
| #144 | 🟡 Open | [UX] Mein-Bereich für passive Mitglieder |
| #145 | ✅ Closed | [UX] Helfer-Dashboard erstellen (via #318) |
| #146 | 🟡 Open | [UX] Partner-Portal erstellen |
| #147 | 🟡 Open | [UX] Willkommen-Seite für Gäste/Freunde |
| #328 | ✅ Closed | Onboarding-Flow nach erstem Login (PR #338) |

---

## Vorhang auf — Mitglieder-Integration (Milestone #24)

**Beschreibung:** Integration von Mitgliederprofilen mit Schichtplanung, Veranstaltungen/Aufführungen und künstlerischen Produktionen.

| # | Status | Titel | Prio |
|---|--------|-------|------|
| #343 | ✅ Closed | Verfügbarkeitskonflikt-Erkennung bei Schichtzuweisung (PR #351) | high |
| #344 | ✅ Closed | Besetzung → Aufführungs-Zuweisungen automatisch erstellen (PR #352) | high |
| #345 | ✅ Closed | Proben-Teilnehmer aus Besetzung auto-befüllen (PR #354) | - |
| #346 | ✅ Closed | Zentrale Personen-Einsatzübersicht (Mein Kalender) (PR #353) | high |
| #347 | 🟡 Open | Skills-basierte Schicht-Vorschläge | - |
| #348 | 🟡 Open | Produktions-Dashboard: Besetzungs- und Schicht-Fortschritt | - |
| #349 | 🟡 Open | Personen-Detailseite: Rollen- und Einsatzhistorie | - |
| #350 | 🟡 Open | Verfügbarkeiten bei Produktionsplanung berücksichtigen | - |

**Empfohlene Reihenfolge:** #343 → #346 + #349 parallel → #344 + #345 + #350 → #347 → #348

---

## Changelog

### 2026-02-17: /helferliste Admin-Modul entfernt (#355, PR #356)

- `/helferliste`-Admin-Routes entfernt (ersetzt durch `/mitmachen`)
- 10 exklusive Komponenten, `helfer-templates.ts` und Dashboard-Widget gelöscht
- `helferliste.ts` auf 2 öffentliche Funktionen reduziert (`getPublicEventByToken`, `anmeldenPublicMulti`)
- Navigation, Breadcrumbs und Route-ACL bereinigt
- Homepage-Link von `/helferliste` auf `/mitmachen` umgestellt
- Stale `revalidatePath('/helferliste')` in öffentlicher Abmeldung bereinigt
- E2E-Tests `helferliste-admin.spec.ts` und `helferliste-member.spec.ts` entfernt
- **26 Dateien, -3.776 Zeilen**

### 2026-02-17: Proben-Teilnehmer aus Besetzung auto-befüllen (#345, PR #354)

- "Aus Besetzungen"-Button öffnet jetzt Vorschau-Dialog statt direkt einzufügen
- `suggestProbenTeilnehmer()`: Read-only Server Action, liefert Vorschläge mit Rollennamen, Duplikat-Erkennung und Konflikt-Prüfung pro Person (max 50)
- Fallback: Ohne zugewiesene Szenen werden alle Besetzungen des Stücks vorgeschlagen
- `confirmProbenTeilnehmer()`: Batch-Upsert mit Status `eingeladen` und Duplikat-Sicherheit
- `TeilnehmerPreviewDialog`: Select/Deselect-All, Rollen-Anzeige, `ConflictWarning` inline, "bereits vorhanden" ausgegraut
- Button nicht mehr durch fehlende Szenen blockiert (Szenen-Gate entfernt)
- 10 Unit Tests für beide Server Actions

### 2026-02-17: Zentrale Personen-Einsatzübersicht (#346, PR #353)

- `getPersonalEvents()` erweitert um 2 neue Quellen: **Helfer-Anmeldungen** (neues System via `profile_id`) und **Helferschichten** (Legacy via `person_id`) — insgesamt 5 Quellen
- Neuer optionaler `personId`-Parameter für Management-Ansicht (erfordert `mitglieder:read`)
- `getPersonVerfuegbarkeiten()`: Neue Funktion für Verfügbarkeits-Abfrage
- `PersonalCalendar`: Verfügbarkeiten als FullCalendar-Hintergrund-Layer (grün/gelb/rot), neues `readOnly`-Prop, Filter/Legende/Statistik für neue Event-Typen
- `/mitglieder/[id]`: Einsatzübersicht-Sektion mit readOnly-Kalender (Layout max-w-3xl → max-w-5xl)
- `/mein-bereich/termine` und `/vorstand/termine`: Verfügbarkeiten parallel geladen
- `declinePersonalEvent` und iCal-Export um `ha-` und `hs-`-Prefixe erweitert
- 9 Unit Tests für alle 5 Quellen, Permission-Checks, Verfügbarkeiten und Decline-Actions

### 2026-02-17: Besetzung → Aufführungs-Zuweisungen (#344, PR #352)

- Neuer Status `vorgeschlagen` für `auffuehrung_zuweisungen` (Migration + Typen + Validation + UI-Label)
- Server Action `generateZuweisungenPreview()`: Traversiert Produktion → Serien → Veranstaltungen → Zeitblöcke → Schichten, erstellt Kreuzprodukt-Vorschläge mit Duplikat-Erkennung und Konflikt-Prüfung (gebatcht, max 50)
- Server Action `confirmZuweisungen()`: Batch-Insert mit `ON CONFLICT` Duplikat-Sicherheit
- Vorschau-Dialog gruppiert nach Veranstaltung mit Alles/Gruppen-Auswahl, inline `ConflictWarning`, zwei Bestätigungs-Modi ("Als Vorschlag" / "Direkt zusagen")
- "Zuweisungen generieren"-Button in `BesetzungsMatrix`-Header integriert
- 10 Unit Tests für Server Actions

### 2026-02-17: Verfügbarkeitskonflikt-Erkennung (#343, PR #351)

- DB-Funktion `check_person_conflicts()` erkennt Überschneidungen mit Verfügbarkeiten, Schichtzuweisungen, Anmeldungen, Proben und Helfereinsätzen
- Nicht-blockierende Konfliktwarnung in SchichtZuweisungListe (Aufführungen) und TeilnehmerList (Proben)
- Cross-System-Konflikterkennung in HelferAssignmentModal mit Admin-Override
- Neues `ConflictWarning`-UI-Komponente und `checkPersonConflicts` Server Action
- 5 Unit Tests für Server Action

### 2026-02-17: Onboarding-Flow nach erstem Login (#328)

- `onboarding_completed` Boolean auf `profiles` Tabelle (Migration + Backfill)
- Middleware-Redirect: Neue Benutzer werden zu `/willkommen` weitergeleitet
- 2-Schritt OnboardingWizard: Begrüssung + optionales Profil (Telefon, Notfallkontakt, Skills)
- `/willkommen` Seite umgebaut: Wizard / FREUNDE-Startseite / Redirect je nach Status
- Supabase CLI eingerichtet, Migration-History repariert, Duplicate-Timestamp-Bug behoben

### 2026-02-16: Dashboard-Restructuring & Vorstand Mein Bereich

#### Stundenkonto aus MITGLIED_AKTIV entfernt (PR #323)
- StundenWidget, Stunden-Statistiken und Quick-Links aus dem Mitglieder-Dashboard entfernt
- `/mein-bereich/stundenkonto` mit Management-Rollencheck abgesichert
- Stundenkonto ist ab sofort nur noch für ADMIN/VORSTAND zugänglich

#### Neue `/vorstand/`-Sektion für persönliche Management-Seiten (PR #323)
- `/vorstand/termine` — Persönlicher Kalender (nutzt `PersonalCalendar`)
- `/vorstand/stundenkonto` — Eigenes Stundenkonto (nutzt `StundenkontoTable`)
- `/vorstand/einsaetze` — Kombinierte Ansicht beider Helfer-Systeme (neu + legacy)
- "Mein Bereich"-Sektion in der Management-Sidebar
- Middleware + Route-Access-Control für `/vorstand`-Prefix
- Alle 16 Testfälle bestanden (Issue #329)

#### Branch-Cleanup
- 43 veraltete Remote-Branches gelöscht (40 merged + 3 stale unmerged)

### 2026-02-16: Dashboard-Konsolidierung & Template-Editor Complete

#### Dashboard & Mein-Bereich Merge (PR #317)
Zentrale Dashboard-Seite für alle Rollen implementiert:
- ADMIN/VORSTAND: Vorstand-Dashboard (3-Säulen-Layout)
- MITGLIED_AKTIV: Persönliches Dashboard (Outlook-Style mit Kalender, Profil, Widgets)
- MITGLIED_PASSIV: Vereinfachte Ansicht
- `/mein-bereich` → Redirect zu `/dashboard`
- Neue "Mitglieder-Ansicht" für Vorstand
- 14 Dateien angepasst, 18 `revalidatePath` ergänzt

#### Helfer-Dashboard (PR #318)
Authentifizierter Bereich für HELFER-Rolle:
- `/meine-einsaetze` - Persönliche Einsatzübersicht
- Dashboard mit kommenden Schichten und Historie
- Filter nach Status (bestätigt, ausstehend, abgelehnt)

#### Template-Editor Vollständig Editierbar (PRs #307-#315)
Alle Template-Elemente jetzt inline editierbar:
- **nur_mitglieder-Flag** (#307): Schichten nur für Vereinsmitglieder markieren
- **Info-Blöcke** (#308): Titel, Beschreibung, Start/Endzeit editieren
- **Sachleistungen** (#309): Name, Anzahl, Beschreibung editieren
- **Ressourcen** (#310): Menge editieren
- **Zod v4 Bug-Fix** (#311-#315): UUID-Validierung für Seed-Daten korrigiert

#### Email-Integration
- SMTP-Konfiguration und Verification
- Email-Versand für Helfer-Registrierung
- Buchungsbestätigungen für Aufführungen

### 2026-02-05: M1 - Datenmodell & Templates Complete

#### Template-System Erweiterung (Issue #171)
- Neue DB-Tabellen: `template_info_bloecke`, `info_bloecke`, `template_sachleistungen`, `sachleistungen`
- Offset-basiertes Zeitsystem (siehe ADR-001)
- TypeScript-Typen erweitert (`TemplateMitDetails`)
- Server Actions für CRUD-Operationen
- UI-Komponenten für Info-Blöcke und Sachleistungen
- Seed-Daten: "Abendvorstellung" Template mit 10 Schichten + 2 Info-Blöcken

### 2026-01-27: Helferliste Feature - Vollständig implementiert

> **Hinweis:** Die `/helferliste`-Admin-Routes wurden mit #355 (2026-02-17) entfernt.
> Funktionalität ist jetzt in `/mitmachen` und `/auffuehrungen/[id]/helferliste` integriert.

**Aktuelle Dateien (nach #355):**

| Datei | Beschreibung |
|-------|--------------|
| `supabase/migrations/20260227000000_helferliste.sql` | Database Migration |
| `lib/actions/helferliste.ts` | Öffentliche Actions (`getPublicEventByToken`, `anmeldenPublicMulti`) |
| `app/(public)/helfer/[token]/page.tsx` | Öffentliche Helfer-Ansicht |
| `components/helferliste/StatusBadge.tsx` | Status-Badge (shared) |
| `components/helferliste/PublicEventView.tsx` | Öffentliche Event-Ansicht (shared) |
| `components/helferliste/MultiSelectContext.tsx` | Multi-Select Context (intern) |

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
Total Issues:     84 (40 open, 44 closed)
Milestones:       7

Progress by Milestone:
├── Modul 0:              55% (6/11 closed)
├── Modul 1:              21% (4/19 closed)
├── Modul 2:             100% (4/4 closed) ✅
├── Modul 3:              40% (4/10 closed)
├── Helfer Liste:         85% (17/20 closed) ✅
├── UserExperience:       64% (7/11 closed)
└── Vorhang auf:          50% (4/8 closed)
```

## Aktuelle Entwicklungen (Feb 2026)

### Abgeschlossene Features
- ✅ /helferliste Admin-Modul entfernt, ersetzt durch /mitmachen (#355)
- ✅ Proben-Teilnehmer aus Besetzung auto-befüllen mit Vorschau-Dialog (#345)
- ✅ Zentrale Personen-Einsatzübersicht mit 5 Quellen + Verfügbarkeiten (#346)
- ✅ Besetzung → Aufführungs-Zuweisungen automatisch erstellen (#344)
- ✅ Verfügbarkeitskonflikt-Erkennung bei Schichtzuweisung (#343)
- ✅ Onboarding-Flow nach erstem Login (#328)
- ✅ Dashboard-Restructuring: Stundenkonto aus MITGLIED_AKTIV entfernt
- ✅ Vorstand "Mein Bereich" mit Termine, Stundenkonto, Einsätze
- ✅ Kombinierte Einsätze-Ansicht (neues + legacy Helfer-System)
- ✅ Template-Editor vollständig editierbar (alle Elemente inline)
- ✅ Dashboard-Konsolidierung (einheitliche Startseite für alle Rollen)
- ✅ Helfer-Dashboard mit persönlicher Einsatzübersicht
- ✅ Email-Integration (SMTP, Registrierungsbestätigungen)
- ✅ nur_mitglieder-Flag für Template-Schichten
- ✅ Zod v4 Kompatibilität

### In Bearbeitung / Geplant
- 🆕 Vorhang auf: 4 Issues (#347-#350) — Skills-Matching, Produktions-Dashboard, Einsatzhistorie, Verfügbarkeiten
- 🔄 Partner-Portal (#146)
- 🔄 Passive Mitglieder Ansicht (#144)
- 🔄 Willkommen-Seite für Gäste (#147)
- 🔄 Management-Dashboard Erweiterungen (#142)

### Technische Verbesserungen
- Server Actions mit robustem Error Handling
- revalidatePath für alle relevanten Routen
- TypeScript-Typsicherheit durchgängig
- Konsistente UI-Patterns über alle Module

---

*Aktualisiert am 2026-02-17*
