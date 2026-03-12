# Dashboard & Mein Bereich zusammengelegt

**Datum:** 2026-02-16
**PR:** #317

## Ausgangslage

Bisher gab es zwei getrennte Seiten für Mitglieder:

- `/dashboard` — zeigte für MITGLIED_AKTIV nur 4 generische Stat-Cards (Mitglieder, Partner, Events, Helfer) und eine Event-Liste. Wenig persönlich, wenig nützlich.
- `/mein-bereich` — vollwertiger persönlicher Bereich mit Kalender, Profil-Card, Stundenkonto, Helfer-Einsätze, Rollen-/Einsatz-Historie.

Das Problem: Mitglieder landeten nach dem Login auf `/mein-bereich`, die generische Dashboard-Seite war für sie praktisch unsichtbar. Vorstand hatte sein eigenes Dashboard unter `/dashboard`, aber die zwei getrennten Konzepte für verschiedene Rollen waren verwirrend.

## Was wurde geändert?

### Ein Dashboard für alle Rollen

`/dashboard` ist jetzt die zentrale Startseite für alle Rollen:

| Rolle | Was sie sehen |
|-------|--------------|
| ADMIN, VORSTAND | Vorstand-Dashboard (3-Säulen-Layout, unverändert) |
| MITGLIED_AKTIV | Persönliches Dashboard (Outlook-Style: Kalender, Profil, Widgets, Historie) |
| MITGLIED_PASSIV | Vereinfachte Ansicht (Kalender, Profil, Events, CTA) |

### Mein Bereich → Redirect

`/mein-bereich` leitet jetzt auf `/dashboard` weiter. Sub-Pages bleiben unter `/mein-bereich/...`:
- `/mein-bereich/stundenkonto` — funktioniert weiterhin
- `/mein-bereich/verfuegbarkeit` — funktioniert weiterhin
- `/mein-bereich/einstellungen` — funktioniert weiterhin

Back-Links in diesen Sub-Pages zeigen jetzt auf `/dashboard` statt `/mein-bereich`.

### Mitglieder-Ansicht für Vorstand

Neuer Sidebar-Eintrag unter "Ansichten": **Mitglieder-Ansicht** (`/dashboard?ansicht=mitglied`). Damit kann der Vorstand das Mitglieder-Dashboard previwen — analog zu den bestehenden Helfer- und Partner-Ansichten.

### Navigation

- Startseite für MITGLIED_AKTIV und MITGLIED_PASSIV: `/mein-bereich` → `/dashboard`
- Sidebar erstes Item: "Mein Bereich" (home icon) → "Dashboard" (dashboard icon)
- Route-Zugriff: `/dashboard` erlaubt für alle 4 Rollen (ADMIN, VORSTAND, MITGLIED_AKTIV, MITGLIED_PASSIV)

### revalidatePath

`revalidatePath('/dashboard')` wurde neben `revalidatePath('/mein-bereich')` in 8 Server-Action-Dateien ergänzt (18 Stellen), damit Änderungen an Profil, Anmeldungen, Stundenkonto etc. das Dashboard korrekt invalidieren.

## Geänderte Dateien (14)

| Kategorie | Dateien |
|-----------|---------|
| Kern | `dashboard/page.tsx`, `mein-bereich/page.tsx`, `navigation.ts` |
| Sub-Pages | `stundenkonto/page.tsx`, `verfuegbarkeit/page.tsx`, `einstellungen/page.tsx` |
| Server Actions | `anmeldungen`, `helfer-anmeldung`, `helferliste`, `helferschichten`, `notifications`, `personen`, `stundenkonto`, `stundenkonto-erfassung` |

## Verifikation

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test:run` — 96/96 ✅
