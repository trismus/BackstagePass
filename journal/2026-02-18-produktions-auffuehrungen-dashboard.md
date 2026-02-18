# Produktions-Aufführungen im Dashboard & Kalender

**Datum:** 2026-02-18

## Kontext

Generierte Aufführungen aus Produktionen erscheinen unter `/auffuehrungen` (via verknüpfte `veranstaltungen`), aber nicht im persönlichen Dashboard unter "Meine Veranstaltungen". Das Dashboard zeigte nur Events mit einer `anmeldungen`-Zeile. Mitglieder die in einer Produktion besetzt sind (via `produktions_besetzungen` oder `produktions_stab`) sahen ihre Aufführungen nicht.

## Implementierung

### Neue Server Action: `getMeineProduktionsAuffuehrungen(personId)`

**Datei:** `lib/actions/produktionen.ts`

Multi-Query mit in-memory Join (Pattern analog zu `getMeineProben`):
1. `produktions_besetzungen` (status: besetzt/vorgemerkt) + `produktions_stab` → `produktion_id`s
2. `produktionen` → Titel-Lookup
3. `auffuehrungsserien` → `serie_id`s
4. `serienauffuehrungen` → verknüpfte Veranstaltungen (WHERE `veranstaltung_id IS NOT NULL`, `datum >= today`)
5. In-memory Join zu Ergebnis-Array (max 10, sortiert nach Datum)

### UpcomingEventsWidget erweitert

**Datei:** `components/mein-bereich/DashboardWidgets.tsx`

- Neuer optionaler Prop `produktionsAuffuehrungen`
- Merge beider Listen zu `MergedEvent[]`, Deduplizierung nach `veranstaltung_id`
- Sortierung nach Datum, erste 5 angezeigt
- Aufführungen verlinken auf `/auffuehrungen/{veranstaltung_id}`

### Dashboard-Integration

**Datei:** `app/(protected)/dashboard/page.tsx`

- `getMeineProduktionsAuffuehrungen` parallel mit `getAnmeldungenForPerson` und `getMeineProben` via `Promise.all`
- Ergebnisse zu `kalenderTermine` hinzugefügt (MiniKalender) mit Deduplizierung
- An beide `UpcomingEventsWidget`-Instanzen weitergereicht (passive + active View)

### Persönlicher Kalender: Quelle #6

**Datei:** `lib/actions/persoenlicher-kalender.ts`

- Neuer Block #6 in `getPersonalEvents()`: gleiche Query-Logik
- Deduplizierung gegen bereits geladene `veranstaltung_id`s (aus Anmeldungen + Schicht-Zuweisungen)
- `PersonalEvent` mit `typ: 'veranstaltung'`, `kann_zusagen: false`, `kann_absagen: false`
- Erscheint in `/mein-bereich/termine` und iCal-Feed

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `lib/actions/produktionen.ts` | Neue Action `getMeineProduktionsAuffuehrungen` + Typ `MeineProduktionsAuffuehrung` |
| `components/mein-bereich/DashboardWidgets.tsx` | `UpcomingEventsWidget` erweitert mit Merge-Logik |
| `app/(protected)/dashboard/page.tsx` | Parallele Datenabfrage, Kalender- und Widget-Integration |
| `lib/actions/persoenlicher-kalender.ts` | Quelle #6 für Produktions-Aufführungen |
| `lib/actions/persoenlicher-kalender.test.ts` | Mock-Chains erweitert (`.in()`, `.order()`, `.limit()`) |

## Design-Entscheidungen

| Entscheidung | Begründung |
|-------------|------------|
| Multi-Query statt SQL-Join | Supabase REST-API unterstützt keine tiefen N:M Joins über 4+ Tabellen; in-memory Join ist explizit und debugbar |
| Deduplizierung client-seitig | Dieselbe Veranstaltung kann via Anmeldung UND Besetzung erscheinen — zeige sie nur einmal |
| `kann_zusagen: false, kann_absagen: false` im Kalender | Besetzungs-basierte Aufführungen sind nicht abmeldbar — Absage geht über die Produktion |
| Dashboard-Fetch parallelisiert | Zuvor sequentiell, jetzt `Promise.all` für bessere Performance |
