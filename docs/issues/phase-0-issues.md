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

*Erstellt am 2026-01-24 vom Bühnenmeister*
