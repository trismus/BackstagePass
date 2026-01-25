# Phase 0 - GitHub Issues

> Diese Issues können manuell auf GitHub erstellt werden oder mit `gh issue create` wenn die CLI installiert ist.

---

## Issue 1: Vercel Projekt erstellen und verbinden

**Titel:** `Phase 0.2: Vercel Projekt erstellen und verbinden`

**Labels:** `phase-0`, `infrastructure`, `P0`

### Beschreibung
Vercel Projekt für BackstagePass erstellen und mit GitHub verbinden.

### Tasks
- [ ] Vercel Projekt erstellen (backstagepass)
- [ ] GitHub Repo verbinden
- [ ] `develop` Branch als Preview Environment
- [ ] `main` Branch als Production Environment
- [ ] Custom Domain konfigurieren (optional)

### Befehle
```bash
cd apps/web
vercel link
vercel env pull
```

### Akzeptanzkriterien
- [ ] App erreichbar unter `*.vercel.app`
- [ ] Preview Deploys funktionieren bei PRs
- [ ] Production Deploy bei Merge auf main

### Referenz
Siehe `docs/strategy/dev-prod-strategy.md`

---

## Issue 2: Supabase Projekt erstellen und integrieren

**Titel:** `Phase 0.3: Supabase Projekt erstellen und integrieren`

**Labels:** `phase-0`, `infrastructure`, `P0`

### Beschreibung
Supabase Projekt für BackstagePass erstellen und mit Vercel verbinden.

### Tasks
- [ ] Supabase Projekt erstellen (`backstagepass-dev`)
- [ ] Vercel Integration aktivieren
- [ ] Environment Variables automatisch syncen
- [ ] Supabase Client testen (Connection Check)

### Setup
1. Gehe zu [supabase.com/dashboard](https://supabase.com/dashboard)
2. Neues Projekt erstellen
3. Vercel Integration unter Settings > Integrations aktivieren
4. Environment Variables werden automatisch in Vercel gesetzt

### Akzeptanzkriterien
- [ ] Supabase Projekt existiert
- [ ] `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- [ ] Connection Test erfolgreich

### Referenz
Siehe `docs/strategy/dev-prod-strategy.md`

---

## Issue 3: Basis-Authentifizierung implementieren

**Titel:** `Phase 0.4: Basis-Authentifizierung implementieren`

**Labels:** `phase-0`, `auth`, `P1`

### Beschreibung
Supabase Auth einrichten mit Login/Logout und Protected Routes.

### Tasks
- [ ] Supabase Auth aktivieren (Email/Password)
- [ ] `/login` Page erstellen
- [ ] `/signup` Page erstellen (optional)
- [ ] Logout-Funktion implementieren
- [ ] Protected Routes mit Middleware
- [ ] Session Management testen

### Dateien zu erstellen
```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── (protected)/
│       └── dashboard/page.tsx
```

### Akzeptanzkriterien
- [ ] User kann sich registrieren
- [ ] User kann sich einloggen/ausloggen
- [ ] Dashboard nur sichtbar nach Login
- [ ] Redirect zu Login bei unauthorisiertem Zugriff

### Referenz
Siehe `docs/strategy/prototype-roadmap.md` - Phase 0.4

---

## Issue 4: npm install und Build testen

**Titel:** `Phase 0.1: Dependencies installieren und Build verifizieren`

**Labels:** `phase-0`, `setup`, `P0`

### Beschreibung
Nach dem Foundation-Setup müssen die Dependencies installiert und der Build getestet werden.

### Tasks
- [ ] `npm install` in `apps/web/` ausführen
- [ ] `npm run dev` testen (Dev Server startet)
- [ ] `npm run build` testen (Production Build erfolgreich)
- [ ] `npm run lint` testen (keine Fehler)
- [ ] `npm run typecheck` testen (keine Type-Errors)

### Befehle
```bash
cd apps/web
npm install
npm run dev      # Dev Server auf localhost:3000
npm run build    # Production Build
npm run lint     # ESLint Check
npm run typecheck # TypeScript Check
```

### Akzeptanzkriterien
- [ ] Alle Commands erfolgreich
- [ ] Landing Page sichtbar auf localhost:3000
- [ ] Mockup-Seiten weiterhin funktional

---

## Issue 5: CI/CD Pipeline einrichten

**Titel:** `Phase 0.5: GitHub Actions CI/CD Pipeline`

**Labels:** `phase-0`, `ci-cd`, `P1`

### Beschreibung
GitHub Actions Workflow für automatische Tests und Deploys.

### Tasks
- [ ] `.github/workflows/ci.yml` erstellen
- [ ] Lint + Type-Check bei jedem PR
- [ ] Build-Test bei jedem PR
- [ ] Auto-Deploy zu Vercel (via Vercel GitHub Integration)

### Workflow-Schritte
```yaml
name: CI
on: [push, pull_request]
jobs:
  lint:
    - npm ci
    - npm run lint
    - npm run typecheck
  build:
    - npm ci
    - npm run build
```

### Akzeptanzkriterien
- [ ] CI läuft bei jedem Push/PR
- [ ] PRs werden geblockt bei Lint-Fehlern
- [ ] Build-Fehler werden erkannt

### Referenz
Siehe `docs/strategy/dev-prod-strategy.md` - CI/CD Pipeline

---

# Phase 1 Issues (Vorbereitung)

## Issue 6: Datenbank-Schema für Personen erstellen

**Titel:** `Phase 1.1: Datenbank-Schema für Mitglieder (personen)`

**Labels:** `phase-1`, `database`, `P1`

### Beschreibung
Supabase Tabelle für Mitgliederverwaltung erstellen.

### SQL Schema
```sql
CREATE TABLE personen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  email TEXT UNIQUE,
  telefon TEXT,
  rolle TEXT DEFAULT 'mitglied',
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE personen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mitglieder sichtbar für authentifizierte User"
ON personen FOR SELECT
TO authenticated
USING (true);
```

### Akzeptanzkriterien
- [ ] Tabelle in Supabase erstellt
- [ ] RLS Policies aktiv
- [ ] Test-Daten eingefügt

### Referenz
Siehe `docs/strategy/prototype-roadmap.md` - Phase 1.1

---

## Issue 7: Mitglieder CRUD UI

**Titel:** `Phase 1.2: Mitglieder-Verwaltung UI`

**Labels:** `phase-1`, `frontend`, `P1`

### Beschreibung
UI-Komponenten für Mitgliederverwaltung erstellen.

### Tasks
- [ ] Mitglieder-Liste (Tabelle mit Suche/Filter)
- [ ] Mitglied-Detail-Seite
- [ ] Mitglied-Formular (Create/Edit)
- [ ] Mitglied-Lösch-Dialog
- [ ] Server Actions für CRUD

### Dateien
```
apps/web/
├── app/(protected)/
│   └── mitglieder/
│       ├── page.tsx          # Liste
│       ├── [id]/page.tsx     # Detail
│       └── neu/page.tsx      # Neu anlegen
├── components/
│   └── mitglieder/
│       ├── MitgliederTable.tsx
│       ├── MitgliedForm.tsx
│       └── MitgliedCard.tsx
└── lib/actions/
    └── personen.ts           # Server Actions
```

### Akzeptanzkriterien
- [ ] Mitglieder-Liste mit Suche funktioniert
- [ ] Neues Mitglied kann angelegt werden
- [ ] Mitglied kann bearbeitet werden
- [ ] Mitglied kann (soft) gelöscht werden

---

## Issue 8: Datenbank-Änderungen aus dem Repo steuern

**Titel:** `Phase 1.3: Datenbank-Migrationen aus dem GitHub Repo`

**Labels:** `phase-1`, `backend`, `database`, `P1`

### Beschreibung
Einen klaren, versionierten Kanal für DB-Änderungen aufbauen, damit Schema-Erweiterungen nicht mehr manuell per SQL-Skript erfolgen müssen, sondern aus dem Repo heraus nachvollziehbar deployt werden.

### Tasks
- [ ] Migrations-Ordner und Konvention für Supabase definieren (`supabase/migrations`)
- [ ] Beispiel-Migration für eine kleine Schema-Erweiterung anlegen
- [ ] Dokumentation für den Workflow "DB-Änderung aus Repo" ergänzen
- [ ] Optional: CI-Check vorbereiten, der ungemergte Migrationen erkennt

### Akzeptanzkriterien
- [ ] Migrationen liegen versioniert im Repo
- [ ] Standard-Workflow für DB-Änderungen ist dokumentiert
- [ ] Änderungen können reproduzierbar aus dem Repo ausgerollt werden

---

## Issue 9: UI/UX Designrahmen für BackstagePass

**Titel:** `Phase 1.4: UI/UX Leitlinie (Format, Farben, Layout)`

**Labels:** `phase-1`, `UI/UX`, `P1`

### Beschreibung
Grundlegende UI/UX-Leitlinien definieren (Format, Farben, Typografie, Komponenten-Stil), damit der Maler/UX-Designer ein klares Arbeitsumfeld und konsistente Vorgaben hat. Stilrichtung: **Uber-inspiriert** (clean, modern, viel Weißraum, klare Typografie, dezente Akzentfarbe).
Grundlegende UI/UX-Leitlinien definieren (Format, Farben, Typografie, Komponenten-Stil), damit der Maler/UX-Designer ein klares Arbeitsumfeld und konsistente Vorgaben hat.

### Tasks
- [ ] Designziele und Tonalität festhalten
- [ ] Farbpalette und Typografie definieren
- [ ] Layout-Grundraster und Abstände beschreiben
- [ ] UI-Komponentenstil (Buttons, Karten, Tabellen) skizzieren
- [ ] Beispielseite bzw. UI-Referenz dokumentieren

### Style-Vorschlag (Startpunkt)
- **Look & Feel:** minimal, editorial, ruhig, hochwertig
- **Palette (Beispiel):** Primary #111111, Surface #FFFFFF, Muted #F5F5F5, Text #111111/#6B6B6B, Accent #2EBD85
- **Typografie:** Inter (Heading Semibold, Body Regular)

### Akzeptanzkriterien
- [ ] Dokumentierte UI/UX-Leitlinie existiert
- [ ] Farben, Typografie und Layout-Regeln sind festgelegt
- [ ] UI-Komponentenstil ist klar beschrieben

---

*Erstellt am 2026-01-24 vom Bühnenmeister*

---

# Epics: Modulplanung (Vereinsleben, Produktion, Künstlerische Leitung)

Diese Epics bilden den Rahmen für die drei Kernmodule. Die Issues darunter sind als Start‑Backlog mit User Stories und klaren Akzeptanzkriterien definiert.

---

## Epic 1: Vereinsleben & Helfereinsätze

**Ziel:** Laufender Vereinsbetrieb außerhalb von Produktionen (Events, Einsätze, Engagement).

### Issue 1.1: Vereinsanlässe verwalten

**User Story:** Als Vorstandsmitglied möchte ich Vereinsanlässe anlegen und verwalten, damit Mitglieder jederzeit über kommende Events informiert sind.

**Akzeptanzkriterien**
- [ ] Events können erstellt, bearbeitet und gelöscht werden
- [ ] Event enthält Titel, Datum, Ort, Beschreibung
- [ ] Liste zeigt zukünftige & vergangene Events

### Issue 1.2: Mitglieder‑Anmeldung & Abmeldung

**User Story:** Als Mitglied möchte ich mich zu Vereinsanlässen anmelden oder abmelden, damit ich meinen Einsatz planen kann.

**Akzeptanzkriterien**
- [ ] Mitglieder können sich zu Events anmelden/abmelden
- [ ] Status sichtbar (angemeldet, abgemeldet, Warteliste)

### Issue 1.3: Helfereinsätze mit Rollen & Kontingenten

**User Story:** Als Helferkoordination möchte ich Rollen und Kontingente pro Event definieren, damit Einsätze gezielt besetzt werden können.

**Akzeptanzkriterien**
- [ ] Rollen definierbar (z. B. Bar, Kasse)
- [ ] Kontingent pro Rolle einstellbar
- [ ] Status offen / bestätigt / voll

### Issue 1.4: „Meine Events & Einsätze“ Übersicht

**User Story:** Als Mitglied möchte ich eine Übersicht meiner kommenden Events und Einsätze sehen, damit ich meine Termine im Blick habe.

**Akzeptanzkriterien**
- [ ] Persönliche Liste „Meine Events“
- [ ] Filter nach Datum / Status

### Issue 1.5: Helferstunden dokumentieren

**User Story:** Als Vorstand möchte ich Helferstunden nachvollziehen können, damit Engagement sichtbar wird.

**Akzeptanzkriterien**
- [ ] Einsätze werden mit Stunden gespeichert
- [ ] Übersicht pro Mitglied

---

## Epic 2: Produktion & Logistik

**Ziel:** Operative Planung rund um Aufführungen und Helferplanung.

### Issue 2.1: Aufführungen anlegen

**User Story:** Als Produktionsleitung möchte ich Aufführungen anlegen, damit Termine und Orte definiert sind.

**Akzeptanzkriterien**
- [ ] Aufführung mit Datum, Uhrzeit, Ort
- [ ] Liste aller Aufführungen

### Issue 2.2: Helferrollen & Schichten definieren

**User Story:** Als Logistik möchte ich Rollen & Schichten je Aufführung definieren, damit Einsätze klar geplant sind.

**Akzeptanzkriterien**
- [ ] Rollen (Kasse, Service, Technik …)
- [ ] Schichten mit Start/Ende
- [ ] Status offen / bestätigt / voll

### Issue 2.3: Templates für Standard‑Helferpläne

**User Story:** Als Koordination möchte ich Helfer‑Templates wiederverwenden, damit ich nicht jedes Mal neu planen muss.

**Akzeptanzkriterien**
- [ ] Template erstellen
- [ ] Auf neue Aufführung anwenden

### Issue 2.4: Helferregistrierung intern/extern

**User Story:** Als Helferkoordinator möchte ich interne Mitglieder und externe Helfer einplanen, damit alle Schichten besetzt werden.

**Akzeptanzkriterien**
- [ ] Interne Anmeldung mit Login
- [ ] Externe Anmeldung optional ohne Login

### Issue 2.5: Konflikterkennung (Person / Zeit / Raum)

**User Story:** Als Koordination möchte ich Konflikte sehen, damit Doppelbelegungen vermieden werden.

**Akzeptanzkriterien**
- [ ] Warnung bei Überschneidung
- [ ] Übersicht fehlerhafter Schichten

---

## Epic 3: Künstlerische Leitung

**Ziel:** Kreative Planung, Rollen, Szenen und Probenlogik.

### Issue 3.1: Stücke anlegen & verwalten

**User Story:** Als künstlerische Leitung möchte ich Stücke anlegen, damit jede Produktion strukturiert ist.

**Akzeptanzkriterien**
- [ ] Stück mit Titel, Beschreibung, Saison
- [ ] Liste aller Stücke

### Issue 3.2: Szenen & Rollen definieren

**User Story:** Als Regie möchte ich Szenen und Rollen definieren, damit das Stück strukturiert ist.

**Akzeptanzkriterien**
- [ ] Szenenliste je Stück
- [ ] Rollen pro Szene zuordenbar

### Issue 3.3: Besetzung der Rollen

**User Story:** Als Regie möchte ich Rollen mit Mitgliedern besetzen, damit klar ist, wer spielt.

**Akzeptanzkriterien**
- [ ] Rollen können mehreren Mitgliedern zugeordnet werden
- [ ] Mitglied ≠ Login (künstlerische Person separat)

### Issue 3.4: Probenplanung

**User Story:** Als Regieassistenz möchte ich Proben planen, damit Beteiligte wissen, wann sie gebraucht werden.

**Akzeptanzkriterien**
- [ ] Probe mit Datum/Uhrzeit/Raum
- [ ] Bezug zu Szene & Rollen

### Issue 3.5: Verfügbarkeitsabfrage

**User Story:** Als Regie möchte ich Verfügbarkeiten abfragen, damit Proben effektiv geplant werden.

**Akzeptanzkriterien**
- [ ] Doodle‑ähnliche Verfügbarkeitsabfrage
- [ ] Übersicht pro Person
