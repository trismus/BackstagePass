# Probenplan Status-Konstanten, Filter, Hints & Tests

**Datum:** 2026-02-17
**Issues:** #378, #379, #380, #381, #382
**PR:** #370

## Kontext

Die StueckStatus-Labels waren an mehreren Stellen dupliziert (`StatusBadge.tsx`, `StueckForm.tsx`, Generator-Page). Der Probenplan-Generator zeigte nur Stücke mit Status `in_proben` oder `in_planung` — Stücke im Status `aktiv` fehlten. Zudem gab es keine Hinweise auf der Stücke-Detailseite, dass der Generator verfügbar ist, und die Typisierung war zu locker (`string` statt `StueckStatus`).

## Implementierung

### Zentrale Konstanten (`lib/supabase/types.ts`)
- `STUECK_STATUS_LABELS: Record<StueckStatus, string>` — alle 5 Labels zentral definiert
- `PROBENPLAN_ELIGIBLE_STATUS: readonly StueckStatus[]` — `['in_planung', 'in_proben', 'aktiv']`
- Folgt bestehendem Pattern (`PRODUKTION_STATUS_LABELS`, `HELFER_STATUS_LABELS`)

### Deduplizierung (#378)
- `StatusBadge.tsx` — referenziert `STUECK_STATUS_LABELS` statt Inline-Strings
- `StueckForm.tsx` — leitet `statusOptions` aus `STUECK_STATUS_LABELS` ab via `Object.entries()`

### Generator-Filter (#379)
- `proben/generator/page.tsx` — `.in('status', [...PROBENPLAN_ELIGIBLE_STATUS])`
- `lib/actions/probenplan.ts` — `getStueckeMitSzenen()` ebenfalls via Konstante
- Empty-State-Text aktualisiert: «In Proben», «In Planung» oder «Aktiv»

### Detailseite Hinweis (#380)
- `stuecke/[id]/page.tsx` — Callout-Banner mit Kalender-Icon und Link zum Generator
- Nur sichtbar wenn Status eligible ist und User Bearbeitungsrechte hat

### Stricter Typing (#382)
- `ProbenplanGenerator.tsx` — `StueckMitSzenen.status` von `string` zu `StueckStatus` geändert

### Unit Tests (#381)
- 10 Tests in `lib/actions/probenplan.test.ts`:
  - `PROBENPLAN_ELIGIBLE_STATUS` enthält korrekte Statuses
  - `STUECK_STATUS_LABELS` deckt alle 5 Werte ab
  - `getStueckeMitSzenen()` ruft `.in()` mit korrektem Filter auf
  - `previewGeneratedProben()` — Berechtigungsprüfung und valide Generierung
  - `generateProben()` — Erstellung und leerer Datumsbereich
  - `createProbenplanTemplate()` und `deleteProbenplanTemplate()` — Berechtigungsprüfung

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `lib/supabase/types.ts` | `STUECK_STATUS_LABELS` + `PROBENPLAN_ELIGIBLE_STATUS` hinzugefügt |
| `components/stuecke/StatusBadge.tsx` | Labels aus Konstante referenziert |
| `components/stuecke/StueckForm.tsx` | `statusOptions` aus Konstante abgeleitet |
| `app/(protected)/proben/generator/page.tsx` | Filter via Konstante, Text aktualisiert |
| `lib/actions/probenplan.ts` | `getStueckeMitSzenen()` via Konstante |
| `app/(protected)/stuecke/[id]/page.tsx` | Generator-Hinweis Callout |
| `components/proben/ProbenplanGenerator.tsx` | `status: StueckStatus` statt `string` |
| `lib/actions/probenplan.test.ts` | 10 neue Tests |

## Design-Entscheidungen

| Entscheidung | Begründung |
|-------------|------------|
| Konstanten in `types.ts` | Folgt bestehendem Pattern, Single Source of Truth |
| `readonly` Array für eligible Status | Verhindert versehentliche Mutation |
| Spread `[...PROBENPLAN_ELIGIBLE_STATUS]` in `.in()` | Supabase erwartet mutable Array |
| Hinweis nur für `canEdit` User | Nicht-Editoren haben keinen Zugriff auf den Generator |
