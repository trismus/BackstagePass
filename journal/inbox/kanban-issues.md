# Kanban Issues für GitHub

> Erstellt vom Springer am 2026-01-24
> Kopiere diese Issues auf: https://github.com/trismus/Argus/issues/new

---

## Issue 1: Vercel-Projekt anlegen

**Title:** `Vercel-Projekt anlegen und Deployment-URL dokumentieren`

**Labels:** `setup`, `prio:high`

**Body:**
```markdown
## User Story
Als Entwickler möchte ich ein Vercel-Projekt haben, damit ich die App deployen kann.

## Akzeptanzkriterien
- [ ] Vercel-Projekt unter trismus Account erstellt
- [ ] Deployment-URL dokumentiert in `apps/web/README.md`
- [ ] GitHub Repo mit Vercel verbunden (auto-deploy on push)

## Milestone
M1 – Basis-Setup
```

---

## Issue 2: Vercel Environment Variables setzen

**Title:** `Vercel Environment Variables konfigurieren`

**Labels:** `setup`, `prio:high`

**Body:**
```markdown
## User Story
Als Entwickler möchte ich die Umgebungsvariablen in Vercel setzen, damit die App auf Supabase zugreifen kann.

## Akzeptanzkriterien
- [ ] `NEXT_PUBLIC_SUPABASE_URL` gesetzt
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt
- [ ] Deployment erfolgreich mit Env Vars

## Abhängigkeit
Benötigt: Supabase-Projekt (#3)

## Milestone
M1 – Basis-Setup
```

---

## Issue 3: Supabase-Projekt anlegen

**Title:** `Supabase-Projekt anlegen und Zugriffsdaten bereitstellen`

**Labels:** `setup`, `prio:high`

**Body:**
```markdown
## User Story
Als Entwickler möchte ich ein Supabase-Projekt haben, damit ich die Datenbank nutzen kann.

## Akzeptanzkriterien
- [ ] Supabase-Projekt erstellt
- [ ] Projekt-URL notiert
- [ ] Anon Key notiert
- [ ] Zugriffsdaten sicher gespeichert (nicht im Repo!)

## Milestone
M1 – Basis-Setup
```

---

## Issue 4: Next.js Mockup-Seiten erstellen

**Title:** `Next.js Mockup-Seiten in apps/web/app/mockup erstellen`

**Labels:** `feature`, `prio:medium`

**Body:**
```markdown
## User Story
Als Stakeholder möchte ich klickbare Mockup-Seiten sehen, damit ich Feedback zum Design geben kann.

## Akzeptanzkriterien
- [ ] `/mockup` Route zeigt Übersicht
- [ ] `/mockup/[slug]` zeigt einzelne Mockup-Seite
- [ ] Server Components verwendet
- [ ] Tailwind CSS Styling

## Tech Plan
Siehe: `journal/2026-01-24.md`

## Milestone
M1 – Basis-Setup
```

---

## Issue 5: Dummy-Daten Layer erstellen

**Title:** `Dummy-Daten Layer in apps/web/lib/mockup/data.ts anlegen`

**Labels:** `feature`, `prio:medium`

**Body:**
```markdown
## User Story
Als Entwickler möchte ich Dummy-Daten haben, damit ich die Mockup-Seiten ohne Supabase testen kann.

## Akzeptanzkriterien
- [ ] `data.ts` exportiert MockupPage Array
- [ ] Mindestens 3 Beispiel-Seiten
- [ ] TypeScript Types definiert

## Milestone
M1 – Basis-Setup
```

---

## Issue 6: Migration für mockup_pages erstellen

**Title:** `Supabase Migration für mockup_pages Tabelle erstellen`

**Labels:** `database`, `prio:low`

**Body:**
```markdown
## User Story
Als Entwickler möchte ich eine Datenbank-Tabelle für Mockup-Seiten haben, damit ich Inhalte persistent speichern kann.

## Akzeptanzkriterien
- [ ] Migration in `supabase/migrations/` erstellt
- [ ] Tabelle `mockup_pages` mit id, slug, title, body, created_at
- [ ] RLS aktiviert
- [ ] Read-Policy für `anon` erstellt

## SQL
```sql
create table if not exists public.mockup_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.mockup_pages enable row level security;

create policy "mockup_pages_read" on public.mockup_pages
  for select to anon using (true);
```

## Milestone
M1 – Basis-Setup
```

---

## Issue 7: Supabase-Client anbinden

**Title:** `Supabase-Client anbinden und Mockup-Seiten aus DB lesen`

**Labels:** `feature`, `prio:low`

**Body:**
```markdown
## User Story
Als Entwickler möchte ich Mockup-Seiten aus Supabase laden, damit Inhalte dynamisch verwaltet werden können.

## Akzeptanzkriterien
- [ ] Supabase Client in `lib/supabase.ts` konfiguriert
- [ ] Query-Funktion für mockup_pages
- [ ] Fallback auf Dummy-Daten wenn DB leer

## Abhängigkeit
Benötigt: Migration (#6), Supabase-Projekt (#3)

## Milestone
M1 – Basis-Setup
```

---

## Schnell-Links für GitHub

1. [Neues Issue erstellen](https://github.com/trismus/Argus/issues/new)
2. [Projekt Board](https://github.com/users/trismus/projects/2/views/1)
3. [Labels verwalten](https://github.com/trismus/Argus/labels)
