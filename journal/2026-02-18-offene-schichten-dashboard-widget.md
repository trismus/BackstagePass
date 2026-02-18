# Offene Schichten Widget im Mitglieder-Dashboard

**Datum:** 2026-02-18

## Kontext

Schichten mit `sichtbarkeit = 'intern'` (nur für Mitglieder) waren nirgends für Mitglieder sichtbar. Die `/mitmachen`-Seite zeigt nur `sichtbarkeit = 'public'` Schichten. Das Mitglieder-Dashboard zeigte nur Legacy-`helfereinsaetze`, kannte `auffuehrung_schichten` gar nicht.

## Implementierung

### Neue Server Action: `getOffeneSchichtenForDashboard()`

**Datei:** `lib/actions/auffuehrung-schichten.ts`

- Query `veranstaltungen` mit `helfer_status = 'veroeffentlicht'` und `datum >= today`
- Fetch `auffuehrung_schichten` mit nested `zeitbloecke` für Zeitanzeige
- Count non-cancelled `auffuehrung_zuweisungen` pro Schicht
- Berechnung `freie_plaetze = anzahl_benoetigt - count(zuweisungen)`
- Kein `sichtbarkeit`-Filter — zeigt sowohl `intern` als auch `public`
- Sortierung: Datum aufsteigend, dann Zeitblock-Startzeit
- Limit: 8 Schichten

Neuer Typ `DashboardSchicht` exportiert für Widget-Props.

### Neues Widget: `OffeneSchichtenWidget`

**Datei:** `components/mein-bereich/DashboardWidgets.tsx`

- Orange-Farbschema (`bg-orange-50`, `text-orange-900`)
- Pro Schicht: Rolle, Veranstaltungstitel, Datum, Zeitblock, freie Plätze
- `intern`-Schichten mit "Intern"-Badge markiert
- Jede Schicht verlinkt auf `/auffuehrungen/{veranstaltung_id}/helferliste`
- Footer: "Alle Aufführungen" → `/auffuehrungen`
- Empty State: "Keine offenen Schichten"

### Dashboard-Integration

**Datei:** `app/(protected)/dashboard/page.tsx`

- `getOffeneSchichtenForDashboard()` parallel via `Promise.all` (nur für aktive Mitglieder)
- Widget als eigenständige volle Breite unterhalb des 3-Spalten-Widget-Grids

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `lib/actions/auffuehrung-schichten.ts` | Neue Action + `DashboardSchicht` Typ |
| `components/mein-bereich/DashboardWidgets.tsx` | Neues `OffeneSchichtenWidget` |
| `app/(protected)/dashboard/page.tsx` | Import, Datenfetch, Widget-Rendering |

## Design-Entscheidungen

| Entscheidung | Begründung |
|-------------|------------|
| Kein `sichtbarkeit`-Filter | Mitglieder sollen sowohl interne als auch öffentliche Schichten sehen |
| Volle Breite statt im Grid | Bessere Sichtbarkeit und Differenzierung von den 3 bestehenden Widgets |
| Limit 8 | Kompakt für Dashboard, ausreichend für Überblick |
| `neq('status', 'abgesagt')` statt Whitelist | Zählt alle aktiven Zuweisungen unabhängig vom genauen Status |
