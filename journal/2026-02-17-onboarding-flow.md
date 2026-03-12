# Onboarding-Flow nach erstem Login

**Datum:** 2026-02-17
**Issue:** #328
**PR:** #338

## Kontext

Nach dem Akzeptieren einer Einladung und dem ersten Login landeten neue Benutzer direkt auf ihrer rollenspezifischen Startseite, ohne Begrüssung oder Möglichkeit, ihr Profil zu vervollständigen. Es fehlte eine First-Login-Erkennung.

## Implementierung

### DB-Migration (`20260303000000_onboarding_flag.sql`)
- `onboarding_completed BOOLEAN NOT NULL DEFAULT false` auf `profiles`
- Bestehende Profile auf `true` backfilled
- `handle_new_user()` Trigger aktualisiert (setzt `onboarding_completed = false`)

### Middleware-Redirect
- Benutzer mit `onboarding_completed = false` werden zu `/willkommen` weitergeleitet
- Ausnahmen: `/willkommen` und `/profile` (verhindert Redirect-Loops)
- Auth-Routen leiten ebenfalls zu `/willkommen` statt zur Startseite

### OnboardingWizard (2-Schritt Client Component)
- **Schritt 1:** Begrüssung mit Name, App-Erklärung
- **Schritt 2:** Optionales Profil — Telefon, Notfallkontakt (Name, Telefon, Beziehung), Skills (TagInput)
- Alle Felder optional, vorbefüllt aus Personen-Daten
- "Überspringen" jederzeit möglich

### Server Actions (`lib/actions/onboarding.ts`)
- `completeOnboarding(data)` — Personen-Felder + Flag setzen
- `skipOnboarding()` — Nur Flag setzen
- `getOnboardingPersonData()` — Vorbefüllungs-Daten laden

### Willkommen-Seite (umgebaut)
- `onboarding_completed = false` → Wizard anzeigen
- `onboarding_completed = true` + FREUNDE → Statische Willkommen-Seite (wie bisher)
- `onboarding_completed = true` + andere Rolle → Redirect zur Startseite

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `supabase/migrations/20260303000000_onboarding_flag.sql` | Neu |
| `lib/supabase/types.ts` | `onboarding_completed` zu Profile |
| `lib/supabase/server.ts` | SELECT erweitert |
| `app/actions/profile.ts` | SELECT erweitert |
| `lib/supabase/middleware.ts` | Onboarding-Redirect-Logik |
| `lib/validations/onboarding.ts` | Neu — Zod Schema |
| `lib/actions/onboarding.ts` | Neu — Server Actions |
| `components/onboarding/OnboardingWizard.tsx` | Neu — Wizard Component |
| `app/(protected)/willkommen/page.tsx` | Umgebaut (3 Cases) |

## Nebenarbeiten

- **Supabase CLI** erstmals eingerichtet (`supabase login` + `link`)
- ~50 lokale Migrationen als "applied" in Remote-History repariert
- Duplicate-Timestamp-Bug behoben: `20260202120001_create_helfer_rollen_templates.sql` → `20260202120002` umbenannt und Migrationen idempotent gemacht

## Design-Entscheidungen

- **DB-Flag statt Timestamp-Vergleich:** `onboarding_completed` ist explizit und zuverlässig, vermeidet fragile `last_sign_in == created_at` Checks
- **Kein separater Stepper:** 2-Schritt-Flow rechtfertigt keine wiederverwendbare Stepper-Abstraktion
- **FREUNDE-Koexistenz:** `/willkommen` bleibt permanente FREUNDE-Startseite, zeigt konditionell Wizard vs. statische Seite
