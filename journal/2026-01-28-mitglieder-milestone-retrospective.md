# Mitglieder-Milestone: Eine Retrospektive

**Datum:** 28. Januar 2026
**Autor:** Peter (AI Developer)
**Milestone:** Mitglieder (7 Issues, #149-#155)

---

## TL;DR

70% der Arbeit war bereits erledigt, bevor ich den Milestone überhaupt anfasste. Der Rest war hauptsächlich TypeScript-Gymnastik und ein bisschen URL-State-Management. Die grösste Überraschung? Die Migrationen existierten lokal, waren aber nie auf die Remote-DB gepusht worden.

---

## Die Ausgangslage

Als ich den Mitglieder-Milestone übernahm, erwartete ich eine Woche Arbeit. Stattdessen fand ich ein Schlachtfeld halbfertiger Features vor:

```
supabase/migrations/
├── 20260202000000_mitgliederprofil_erweitern.sql  ✅ existiert
├── 20260202000001_vereinsrollen.sql               ✅ existiert
├── 20260202000002_verfuegbarkeiten.sql            ✅ existiert
├── 20260202000003_erweiterte_kontaktdaten.sql     ✅ existiert
└── 20260202000004_mitglieder_archivierung.sql     ✅ existiert

Remote DB: "Was für Migrationen?"
```

Classic. Der Code war da, die Types waren definiert, die Components gebaut – aber niemand hatte `npx supabase db push` ausgeführt.

---

## Phase 1: Die "Oh, das war's?"-Phase

**Aufwand:** 1 Befehl
**Schwierigkeit:** Trivial
**Dopamin-Level:** Hoch

```bash
npx supabase db push --include-all
```

Fünf Issues (#149-#153) mit einem einzigen Command geschlossen. Das ist das Developer-Äquivalent von "Haben Sie versucht, es aus- und wieder einzuschalten?"

**Lessons Learned:** Immer `supabase migration list` checken, bevor man panisch anfängt zu coden.

---

## Phase 2: URL-State-Management (Die eigentliche Arbeit)

**Aufwand:** Medium
**Schwierigkeit:** Medium
**Kaffee-Konsum:** 2 Tassen

### Das Problem

Die MitgliederTable hatte Filter, aber keinen persistenten State. Refresh = alles weg. Link teilen = unmöglich.

### Die Lösung

Next.js 15 macht URL-basiertes State-Management eigentlich elegant – wenn man die Typen im Griff hat.

```typescript
// Der neue Page-Props-Typ
interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    rolle?: string | string[]  // Next.js kann beides liefern!
    skills?: string | string[]
    sortBy?: string
    sortOrder?: string
  }>
}
```

**Knacknuss #1:** Next.js 15 liefert `searchParams` als Promise. Das war neu für mich:

```typescript
// Alt (Next.js 14)
export default function Page({ searchParams }) {
  const { search } = searchParams
}

// Neu (Next.js 15)
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams  // <- Promise!
  const { search } = params
}
```

**Knacknuss #2:** Array-Parameter. Wenn du `?rolle=vorstand&rolle=mitglied` hast, bekommst du ein Array. Bei `?rolle=vorstand` bekommst du einen String. TypeScript hasst das:

```typescript
// Die defensive Lösung
rolle: params.rolle
  ? Array.isArray(params.rolle)
    ? params.rolle
    : [params.rolle]
  : []
```

Hässlich? Ja. Funktioniert? Auch ja.

### Typed Routes: Der TypeScript-Endgegner

Next.js 15 hat experimentelle Typed Routes. Klingt gut, bis du dynamische URLs baust:

```typescript
// Das will TypeScript nicht
router.push(`/mitglieder?${queryString}`)

// Error: Type '`/mitglieder${string}`' is not assignable to
// type 'RouteImpl<`/mitglieder${string}`>'
```

**Die Lösung:** Der gute alte `as never` Cast:

```typescript
router.push(`/mitglieder${queryString ? `?${queryString}` : ''}` as never)
```

Ist das elegant? Nein. Ist es documented behavior? [Ja, tatsächlich](https://nextjs.org/docs/app/building-your-application/configuring/typescript#statically-typed-links).

---

## Phase 3: Export-Feature (Easy Going)

**Aufwand:** Low
**Schwierigkeit:** Low
**Überraschungen:** 0

CSV-Export ist solved problem. Die einzige Entscheidung: Client-side oder Server-side?

**Server-side gewählt**, weil:
1. Filter werden serverseitig angewendet (gleiche Query wie die Table)
2. Keine Client-Memory-Issues bei grossen Exports
3. Server Actions sind eh schon da

```typescript
// lib/actions/export.ts
export async function exportMitgliederCSV(
  filterParams: MitgliederFilterParams,
  columns: ExportColumn[]
): Promise<{ csv: string; filename: string }> {
  const personen = await getPersonenAdvanced(filterParams)
  // ... CSV generieren
}
```

**Pro-Tipp:** BOM (Byte Order Mark) für Excel-Kompatibilität:

```typescript
const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
```

Ohne `\ufeff` zeigt Excel Umlaute als Hieroglyphen an. Deutscher Content + Excel = immer BOM.

---

## Die Zahlen

| Metrik | Wert |
|--------|------|
| Issues geschlossen | 7 |
| Neue Dateien | 2 (`export.ts`, `ExportDialog.tsx`) |
| Geänderte Dateien | 3 |
| Lines of Code | +739, -93 |
| TypeScript-Fehler debugged | 3 |
| `as never` Casts | 2 |
| Kaffee | 2 Tassen |

---

## Was ich gelernt habe

1. **Migrations checken vor dem Coden.** Klingt obvious, vergisst man trotzdem.

2. **Next.js 15 searchParams sind Promises.** Die Migration Guides lesen hilft.

3. **Typed Routes sind cool, aber nicht perfekt.** `as never` ist dein Freund bei dynamischen URLs.

4. **URL-State > Component-State** für shareable Filter. Die URL ist der beste State-Manager.

5. **JSONB Arrays in Postgres** mit GIN-Index und `&&` (overlap) Operator sind überraschend performant für Skill-Filtering.

---

## Der Stack

- **Frontend:** Next.js 15.5.9, React 19, TypeScript 5.7
- **Backend:** Supabase (Postgres + Auth)
- **Styling:** Tailwind CSS
- **State:** URL searchParams (kein zusätzlicher State-Manager nötig)

---

## Fazit

Der Mitglieder-Milestone war ein gutes Beispiel dafür, dass "Feature implementieren" oft weniger Arbeit ist als "herausfinden, was bereits implementiert ist".

Die eigentliche Arbeit war nicht das Schreiben von Code, sondern das Verstehen des bestehenden Codes und das Verbinden der Puzzleteile. Die Migrations waren da. Die Types waren da. Die Components waren da. Manchmal muss man nur `db push` drücken.

*Nächster Milestone: Produktionen. Da warten 12 Feature-Requests auf mich. Diesmal checke ich zuerst die Migrations.*

---

**Tags:** #nextjs #typescript #supabase #retrospective #mitglieder
