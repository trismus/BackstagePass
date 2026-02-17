#!/bin/bash
# =============================================================================
# Milestone "Probenplan: Status-Mismatch & Generator-Fixes" erstellen
# Voraussetzung: gh CLI authentifiziert (gh auth login)
# Ausführen: bash scripts/create-milestone-probenplan-fix.sh
# =============================================================================

set -e
REPO="trismus/BackstagePass"

echo "🎭 Erstelle Milestone: Probenplan Fixes"
echo "========================================"

# 1. Milestone erstellen
MILESTONE_NUMBER=$(gh api repos/$REPO/milestones --method POST \
  -f title="Probenplan: Status-Fix & Generator" \
  -f description="$(cat <<'DESC'
## Zusammenfassung

Der Probenplan-Generator ist komplett unbenutzbar wegen eines Status-Mismatch:
Die Queries filtern nach `in_produktion` / `in_vorbereitung`, aber diese Werte
existieren nicht im `stueck_status` ENUM. Gültige Werte sind: `in_planung`,
`in_proben`, `aktiv`, `abgeschlossen`, `archiviert`.

**Auswirkung:** Egal welchen Status ein Stück hat - der Generator zeigt immer
"Keine aktiven Stücke" und ist komplett blockiert.

## Scope

- Phase A: Kritische Bugfixes (Generator benutzbar machen)
- Phase B: Error-Message & UX-Verbesserungen
- Phase C: Tests & Absicherung

## Betroffene Module
- Probenplan-Generator (Page + Server Actions)
- Stücke-Status-System (Error Messages, Konsistenz)
- Proben-Teilnehmer-System (RPC-Funktion Mismatch)

## Ergebnis
Nach Abschluss dieses Milestones:
- Generator funktioniert mit `in_proben` + `in_planung` Stücken
- Error Messages sind korrekt und hilfreich
- Tests sichern die Status-Werte ab
DESC
)" \
  -f state="open" \
  --jq '.number')

echo "✅ Milestone #$MILESTONE_NUMBER erstellt"
echo ""

# Helper function to create issue
create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"

  gh issue create --repo "$REPO" \
    --milestone "Probenplan: Status-Fix & Generator" \
    --label "$labels" \
    --title "$title" \
    --body "$body"
}

# =============================================================================
# PHASE A: Kritische Bugfixes
# =============================================================================

echo "📝 Issue 1/7: [CRITICAL] Status-Mismatch im Generator"
create_issue \
  "fix: Probenplan-Generator filtert nach nicht-existierenden Status-Werten" \
  "$(cat <<'EOF'
## Bug-Beschreibung

Der Probenplan-Generator ist **komplett unbenutzbar**, weil zwei Stellen nach
Status-Werten filtern, die nicht im `stueck_status` DB-ENUM existieren.

### Root Cause

**Datenbankschema** (`20260131000000_stuecke_szenen_rollen.sql`):
```sql
CREATE TYPE stueck_status AS ENUM (
  'in_planung', 'in_proben', 'aktiv', 'abgeschlossen', 'archiviert'
);
```

**Generator-Page** (`app/(protected)/proben/generator/page.tsx:22`):
```typescript
.in('status', ['in_produktion', 'in_vorbereitung'])  // ❌ Existieren NICHT
```

**Server Action** (`lib/actions/probenplan.ts:559`):
```typescript
.eq('status', 'in_produktion')  // ❌ Existiert NICHT
```

### Symptom
- User erstellt Stück "Haarige Zeite" → setzt Status auf `in_proben` oder `aktiv`
- Generator-Page zeigt: "Keine aktiven Stücke"
- User denkt, Status wurde nicht richtig gesetzt (obwohl das UI korrekt funktioniert)

## Fix

### 1. `generator/page.tsx` Zeile 22
```diff
- .in('status', ['in_produktion', 'in_vorbereitung'])
+ .in('status', ['in_proben', 'in_planung'])
```

### 2. `lib/actions/probenplan.ts` Zeile 559
```diff
- .eq('status', 'in_produktion')
+ .in('status', ['in_proben', 'in_planung'])
```

## Akzeptanzkriterien

- [ ] Generator zeigt Stücke mit Status `in_proben` (Hauptfall)
- [ ] Generator zeigt Stücke mit Status `in_planung` (Sekundärfall, für Vorbereitungen)
- [ ] "Haarige Zeite" mit Status `in_proben` erscheint im Generator
- [ ] `getStueckeMitSzenen()` gibt korrekte Resultate zurück
- [ ] Kein Stück mit Status `aktiv`, `abgeschlossen`, `archiviert` erscheint im Generator

## Betroffene Dateien

- `apps/web/app/(protected)/proben/generator/page.tsx` (Zeile 22)
- `apps/web/lib/actions/probenplan.ts` (Zeile 559, `getStueckeMitSzenen()`)

## Priorität

**CRITICAL** - Generator komplett blockiert, kein Workaround möglich.

**Phase A** | Geschätzter Aufwand: 15 Minuten
EOF
" \
  "bug,backend,frontend,prio:high"

echo "📝 Issue 2/7: Error-Message korrigieren"
create_issue \
  "fix: Irreführende Fehlermeldung im Probenplan-Generator" \
  "$(cat <<'EOF'
## Bug-Beschreibung

Die Fehlermeldung im Generator referenziert Status-Werte, die nicht existieren:

**Aktuell** (`generator/page.tsx:80-82`):
```
"Um den Probenplan-Generator zu nutzen, muss mindestens ein Stück
in Produktion oder Vorbereitung sein."
```

Die Begriffe "Produktion" und "Vorbereitung" entsprechen keinen existierenden
Status-Werten. Die korrekten Labels sind "In Proben" und "In Planung".

## Fix

```diff
- Um den Probenplan-Generator zu nutzen, muss mindestens ein Stück in
- Produktion oder Vorbereitung sein.
+ Um den Probenplan-Generator zu nutzen, muss mindestens ein Stück den
+ Status «In Proben» oder «In Planung» haben.
```

Optional: Link direkt zum Stück mit Quick-Action zum Status-Setzen ergänzen.

## Akzeptanzkriterien

- [ ] Error-Message referenziert die korrekten Status-Labels
- [ ] Message ist für Benutzer verständlich und actionable
- [ ] "Stücke verwalten"-Link bleibt erhalten

## Betroffene Dateien

- `apps/web/app/(protected)/proben/generator/page.tsx` (Zeilen 77-89)

**Phase A** | Geschätzter Aufwand: 5 Minuten
EOF
" \
  "bug,frontend,prio:high"

# =============================================================================
# PHASE B: Konsistenz & UX
# =============================================================================

echo "📝 Issue 3/7: Status-Konsistenz zwischen Generator und Action absichern"
create_issue \
  "refactor: Einheitliche Status-Konstanten für Probenplan-Generator" \
  "$(cat <<'EOF'
## Beschreibung

Aktuell verwenden die Generator-Page und die `getStueckeMitSzenen()`-Action
unterschiedliche Status-Filter (selbst nach dem Bugfix). Das führt zu
Inkonsistenzen wenn die erlaubten Status-Werte geändert werden.

### Problem
- `generator/page.tsx` → eigener Supabase-Query mit Status-Filter
- `probenplan.ts` → `getStueckeMitSzenen()` mit separatem Status-Filter
- Beide müssen synchron gehalten werden → fehleranfällig

## Lösung

### Option A: Zentrale Konstante (empfohlen)
```typescript
// lib/constants/stueck-status.ts (oder in types.ts)
export const PROBENPLAN_AKTIVE_STATUS: StueckStatus[] = ['in_proben', 'in_planung']
```

Verwendung:
```typescript
// generator/page.tsx
import { PROBENPLAN_AKTIVE_STATUS } from '@/lib/constants/stueck-status'
.in('status', PROBENPLAN_AKTIVE_STATUS)

// probenplan.ts
import { PROBENPLAN_AKTIVE_STATUS } from '@/lib/constants/stueck-status'
.in('status', PROBENPLAN_AKTIVE_STATUS)
```

### Option B: Page nutzt getStueckeMitSzenen()
Die Page delegiert die Query komplett an die Server Action.

## Akzeptanzkriterien

- [ ] Beide Stellen nutzen die gleiche Status-Filterung
- [ ] Status-Werte für "probenplan-aktiv" sind an einer einzigen Stelle definiert
- [ ] Bei zukünftigen Änderungen muss nur eine Stelle angepasst werden

## Betroffene Dateien

- Neue Datei oder Ergänzung in `lib/supabase/types.ts`
- `apps/web/app/(protected)/proben/generator/page.tsx`
- `apps/web/lib/actions/probenplan.ts`

**Phase B** | Geschätzter Aufwand: 30 Minuten
EOF
" \
  "enhancement,backend,frontend,prio:medium"

echo "📝 Issue 4/7: Generator-Stücke-Dropdown auch 'aktiv' anzeigen"
create_issue \
  "enhancement: Generator soll auch Stücke mit Status 'aktiv' anzeigen können" \
  "$(cat <<'EOF'
## User Story

**Als** Regisseur
**möchte ich** auch für Stücke mit Status "Aktiv" (laufende Spielzeit) Proben planen können,
**damit** Nachproben oder Wiederaufnahmen möglich sind.

## Kontext

Nach dem Bugfix (#TODO: ref zu Issue 1) zeigt der Generator Stücke mit Status
`in_proben` und `in_planung`. Stücke mit Status `aktiv` (= in der Spielzeit)
werden nicht angezeigt. Für Nachproben oder Auffrischungsproben während der
Spielzeit könnte dies gewünscht sein.

## Vorschlag

Zwei Möglichkeiten:

### Option A: Auch `aktiv` in den Filter aufnehmen
```typescript
PROBENPLAN_AKTIVE_STATUS = ['in_proben', 'in_planung', 'aktiv']
```

### Option B: Optionaler Filter im Generator-UI
- Dropdown/Toggle: "Auch laufende Stücke anzeigen"
- Standard: Aus (nur `in_proben`, `in_planung`)
- Eingeschaltet: + `aktiv`

## Akzeptanzkriterien

- [ ] Entscheidung: Welche Option? (Team-Entscheid)
- [ ] Generator zeigt Stücke gemäss gewählter Option
- [ ] Benutzer versteht, welche Stücke angezeigt werden und warum

## Diskussionsfrage

Sollen Stücke mit Status `aktiv` automatisch im Generator erscheinen oder
nur auf Wunsch? → Team-Entscheid nötig.

**Phase B** | Geschätzter Aufwand: 30-60 Minuten (je nach Option)
EOF
" \
  "enhancement,frontend,prio:low"

echo "📝 Issue 5/7: Stücke-Detailseite: Hinweis bei fehlendem Generator-Status"
create_issue \
  "enhancement: Stücke-Detailseite zeigt Hinweis wenn Probenplan-Generator blockiert" \
  "$(cat <<'EOF'
## User Story

**Als** Regisseur
**möchte ich** auf der Stück-Detailseite sehen, ob das Stück für den
Probenplan-Generator verfügbar ist,
**damit** ich nicht erst zum Generator navigieren muss um herauszufinden,
warum mein Stück dort nicht auftaucht.

## Kontext

Der User hat "Haarige Zeite" erstellt und den Status gesetzt, aber der
Generator zeigte "Keine aktiven Stücke". Es war unklar, welcher Status
benötigt wird. Ein kontextueller Hinweis auf der Stück-Seite selbst
hätte das Problem sofort erklärt.

## Akzeptanzkriterien

- [ ] Stück-Detailseite zeigt Info-Banner wenn Status NICHT `in_proben`/`in_planung`:
  > "Dieses Stück wird im Probenplan-Generator nicht angezeigt.
  > Setze den Status auf «In Proben» oder «In Planung» um Proben zu generieren."
- [ ] Banner hat Quick-Action Button "Status ändern" → öffnet Edit-Modal/Dialog
- [ ] Banner wird nicht angezeigt bei `abgeschlossen`/`archiviert` (irrelevant)
- [ ] Stücke mit `in_proben`/`in_planung` zeigen stattdessen: "✓ Verfügbar im Probenplan-Generator"

## Betroffene Dateien

- `apps/web/app/(protected)/stuecke/[id]/page.tsx`
- Optional: Neue Komponente `components/stuecke/GeneratorStatusHint.tsx`

**Phase B** | Geschätzter Aufwand: 45 Minuten
EOF
" \
  "enhancement,frontend,prio:medium"

# =============================================================================
# PHASE C: Tests & Absicherung
# =============================================================================

echo "📝 Issue 6/7: Unit-Tests für Status-Filterung"
create_issue \
  "test: Unit-Tests für Probenplan-Generator Status-Filterung" \
  "$(cat <<'EOF'
## Beschreibung

Es gibt aktuell keine Tests die sicherstellen, dass der Probenplan-Generator
nach den korrekten Status-Werten filtert. Genau dieser fehlende Test hat dazu
geführt, dass der Status-Mismatch-Bug unbemerkt in Produktion ging.

## Akzeptanzkriterien

- [ ] Test: `getStueckeMitSzenen()` filtert nach `in_proben` und `in_planung`
- [ ] Test: `getStueckeMitSzenen()` gibt keine Stücke mit `abgeschlossen`/`archiviert` zurück
- [ ] Test: Generator-Page rendert "Keine aktiven Stücke" nur wenn wirklich keine passenden Stücke existieren
- [ ] Test: Status-Werte in Queries matchen die `stueck_status` ENUM-Werte

### Snapshot-Test für Status-Konstanten
```typescript
// Verhindert zukünftige Mismatch-Bugs
import { PROBENPLAN_AKTIVE_STATUS } from '@/lib/constants/stueck-status'

test('PROBENPLAN_AKTIVE_STATUS enthält nur gültige StueckStatus-Werte', () => {
  const validStatuses: StueckStatus[] = [
    'in_planung', 'in_proben', 'aktiv', 'abgeschlossen', 'archiviert'
  ]
  for (const status of PROBENPLAN_AKTIVE_STATUS) {
    expect(validStatuses).toContain(status)
  }
})

test('PROBENPLAN_AKTIVE_STATUS enthält erwartete Werte', () => {
  expect(PROBENPLAN_AKTIVE_STATUS).toEqual(
    expect.arrayContaining(['in_proben', 'in_planung'])
  )
})
```

## Betroffene Dateien

- Neuer Test: `apps/web/tests/lib/actions/probenplan-status.test.ts`
- Optional: `apps/web/tests/app/proben/generator.test.tsx`

**Phase C** | Geschätzter Aufwand: 1-2 Stunden
EOF
" \
  "enhancement,backend,prio:medium"

echo "📝 Issue 7/7: TypeScript-Absicherung gegen Status-Literal-Typen"
create_issue \
  "chore: TypeScript strictere Typisierung für Supabase-Status-Queries" \
  "$(cat <<'EOF'
## Beschreibung

Der Status-Mismatch-Bug wurde nicht vom TypeScript-Compiler erkannt, weil
Supabase `.eq()` und `.in()` `string`-Werte akzeptieren ohne gegen den
ENUM-Typ zu validieren. Ziel: Sicherstellen, dass ungültige Status-Werte
zur Compile-Zeit erkannt werden.

## Problem

```typescript
// Kein TS-Fehler, obwohl 'in_produktion' nicht existiert:
.eq('status', 'in_produktion')

// Auch kein TS-Fehler:
.in('status', ['in_produktion', 'in_vorbereitung'])
```

## Lösungsvorschlag

### Wrapper-Funktion mit strikter Typisierung

```typescript
// lib/supabase/query-helpers.ts
import type { StueckStatus } from './types'

/**
 * Type-safe status filter für Stücke-Queries.
 * Verhindert Compile-Time, dass ungültige Status-Werte
 * in Queries verwendet werden.
 */
export function stueckStatusFilter(statuses: StueckStatus[]): string[] {
  return statuses
}
```

Verwendung:
```typescript
.in('status', stueckStatusFilter(['in_proben', 'in_planung']))
// TS Error bei:
.in('status', stueckStatusFilter(['in_produktion']))
// → Type '"in_produktion"' is not assignable to type 'StueckStatus'
```

### Alternative: Supabase Generated Types
Falls Supabase-Codegen verwendet wird, werden die Query-Typen automatisch
validiert. Prüfen ob dies aktiviert werden kann.

## Akzeptanzkriterien

- [ ] Ungültige Status-Werte in Supabase-Queries lösen TS-Fehler aus
- [ ] Bestehende korrekte Queries kompilieren weiterhin
- [ ] Ansatz ist erweiterbar auf andere ENUM-Typen (z.B. `veranstaltung_typ`)

## Betroffene Dateien

- Neue Datei: `apps/web/lib/supabase/query-helpers.ts`
- `apps/web/app/(protected)/proben/generator/page.tsx`
- `apps/web/lib/actions/probenplan.ts`

**Phase C** | Geschätzter Aufwand: 1 Stunde
EOF
" \
  "enhancement,backend,prio:low"

echo ""
echo "========================================"
echo "🎭 Milestone 'Probenplan: Status-Fix & Generator' komplett!"
echo "   1 Milestone + 7 Issues erstellt"
echo "========================================"
echo ""
echo "📋 Übersicht:"
echo "   Phase A (CRITICAL): Issues 1-2 (Status-Fix + Error-Message)"
echo "   Phase B (UX):       Issues 3-5 (Konsistenz, aktiv-Filter, Hints)"
echo "   Phase C (Quality):  Issues 6-7 (Tests, TypeScript-Absicherung)"
echo ""
echo "📋 gh issue list --repo $REPO --milestone 'Probenplan: Status-Fix & Generator'"
