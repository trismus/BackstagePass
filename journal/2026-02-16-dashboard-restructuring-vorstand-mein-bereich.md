# Dashboard-Restructuring: Stundenkonto & Vorstand Mein Bereich

**Datum:** 2026-02-16
**PR:** #323
**Testing:** #329 (16/16 passed)

## Kontext

VORSTAND-Mitglieder sind auch normale Vereinsmitglieder, hatten aber bisher nur das Management-Dashboard ohne persönliche Features (Termine, Stundenkonto, Einsätze). Gleichzeitig zeigte das MITGLIED_AKTIV-Dashboard das Stundenkonto — eine Information, die nur für den Vorstand relevant ist.

## Änderungen

### Teil A: Stundenkonto aus MITGLIED_AKTIV entfernt

- StundenWidget, Stunden-Statistiken und Stundenkonto-Quick-Link aus dem Dashboard entfernt
- StundenWidget-Komponente und Barrel-Export bereinigt
- `/mein-bereich/stundenkonto` mit `isManagement()`-Rollencheck abgesichert — Nicht-Management wird auf `/dashboard` umgeleitet
- Stundenkonto-Eintrag aus der MITGLIED_AKTIV-Sidebar-Navigation entfernt

### Teil B: Neue `/vorstand/`-Sektion

- `/vorstand` als geschützten Prefix in der Middleware registriert
- "Mein Bereich"-Sektion in der MANAGEMENT_NAVIGATION hinzugefügt (Termine, Stundenkonto, Einsätze)
- Routenzugriff auf ADMIN/VORSTAND beschränkt

**Neue Seiten:**

| Route | Beschreibung |
|-------|-------------|
| `/vorstand/termine` | Persönlicher Kalender (nutzt `PersonalCalendar`) |
| `/vorstand/stundenkonto` | Eigenes Stundenkonto (nutzt `StundenkontoTable`) |
| `/vorstand/einsaetze` | Kombinierte Ansicht beider Helfer-Systeme |

### Vorstand Einsätze — Kombinierte Ansicht

Die Einsätze-Seite zeigt beide Helfer-Systeme in einer Ansicht:
- **Neues System** (`helfer_anmeldungen`): Via `getAuthenticatedHelferDashboard()` + `HelferDashboardView` mit `showHeader={false}`
- **Legacy-System** (`helferschichten`): Direkte Supabase-Query mit Upcoming/Past-Split

## Technische Details

- `HelferDashboardView` erhielt einen optionalen `showHeader`-Prop (default `true`) um Header + Info-Card ausblendbar zu machen
- Breadcrumb-Label `einsaetze` von "Verfügbare Einsätze" auf "Meine Einsätze" geändert
- Ungenutzer `HelferEinsaetzeWidget`-Import im Dashboard verursachte Vercel-Build-Fehler (strikte Lint-Rules in Produktion) — nachträglich gefixt

## Dateien

- 7 modifizierte Dateien (+ 1 nachträglicher Fix)
- 3 neue Seiten

## Verifikation

- Typecheck: bestanden
- Lint: 0 Fehler
- Unit Tests: 96/96 bestanden
- Manuelle Tests: 16/16 bestanden (MITGLIED_AKTIV, VORSTAND, ADMIN, Access Control)
- Vercel Production Deploy: erfolgreich
