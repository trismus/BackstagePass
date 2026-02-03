# PLAN-158: Besetzungs-Management

**Issue:** #158 - [Produktionen] Besetzungs-Management
**Autor:** Martin (Bühnenmeister/Architect)
**Datum:** 2026-02-03

---

## 1. Ausgangslage

### Bestehendes System
Das aktuelle Besetzungssystem arbeitet auf **Stück-Ebene**:
- `besetzungen` Tabelle: verknüpft `rolle_id` (aus Stücke) mit `person_id`
- Typen: `hauptbesetzung | zweitbesetzung | ersatz`
- Keine Status-Felder (offen/besetzt/etc.)
- `BesetzungenList` Komponente in `components/stuecke/`
- Audit via `besetzungen_historie` Tabelle

### Problem
Eine Produktion referenziert ein Stück (`produktion.stueck_id`), aber die Besetzung ist nicht produktionsspezifisch. Wenn dasselbe Stück in zwei verschiedenen Produktionen (z.B. verschiedene Saisons) aufgeführt wird, gibt es keine Trennung der Besetzung.

### Lösung
Neue `produktions_besetzungen` Tabelle, die Besetzungen an eine **Produktion** bindet. Die bestehende `besetzungen` Tabelle bleibt als "Stück-Default" erhalten.

---

## 2. Datenmodell

### Neue Tabelle: `produktions_besetzungen`

```sql
CREATE TYPE produktions_besetzung_status AS ENUM (
  'offen',
  'vorgemerkt',
  'besetzt',
  'abgesagt'
);

CREATE TABLE produktions_besetzungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produktion_id UUID NOT NULL REFERENCES produktionen(id) ON DELETE CASCADE,
  rolle_id UUID NOT NULL REFERENCES rollen(id) ON DELETE CASCADE,
  person_id UUID REFERENCES personen(id) ON DELETE SET NULL,
  typ besetzung_typ NOT NULL DEFAULT 'hauptbesetzung',  -- bestehendes ENUM wiederverwendet
  status produktions_besetzung_status NOT NULL DEFAULT 'offen',
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(produktion_id, rolle_id, person_id, typ)
);
```

### Beziehungen

```
Produktion (1) --stueck_id--> (1) Stück
Stück (1) -------> (M) Rollen
Produktion (1) --> (M) ProduktionsBesetzungen
Rollen (1) ------> (M) ProduktionsBesetzungen
Personen (1) ----> (M) ProduktionsBesetzungen
```

### Indexes
- `idx_prod_besetzungen_produktion` ON (produktion_id)
- `idx_prod_besetzungen_rolle` ON (rolle_id)
- `idx_prod_besetzungen_person` ON (person_id)
- `idx_prod_besetzungen_status` ON (status)

### RLS
- SELECT: alle authentifizierten User
- INSERT/UPDATE/DELETE: `is_management()` (ADMIN, VORSTAND)

### Audit
- `updated_at` Trigger
- Status-Change Audit in `audit_logs` (gleich wie bei Produktionen)

---

## 3. Types

```typescript
// In lib/supabase/types.ts

export type ProduktionsBesetzungStatus = 'offen' | 'vorgemerkt' | 'besetzt' | 'abgesagt'

export const PRODUKTIONS_BESETZUNG_STATUS_LABELS: Record<ProduktionsBesetzungStatus, string> = {
  offen: 'Offen',
  vorgemerkt: 'Vorgemerkt',
  besetzt: 'Besetzt',
  abgesagt: 'Abgesagt',
}

export type ProduktionsBesetzung = {
  id: string
  produktion_id: string
  rolle_id: string
  person_id: string | null
  typ: BesetzungTyp
  status: ProduktionsBesetzungStatus
  notizen: string | null
  created_at: string
  updated_at: string
}

export type ProduktionsBesetzungInsert = Omit<ProduktionsBesetzung, 'id' | 'created_at' | 'updated_at'>
export type ProduktionsBesetzungUpdate = Partial<Omit<ProduktionsBesetzungInsert, 'produktion_id'>>

// Erweiterte Typen für UI
export type ProduktionsBesetzungMitDetails = ProduktionsBesetzung & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'skills'> | null
  rolle: Pick<StueckRolle, 'id' | 'name' | 'typ'>
}

export type RolleMitProduktionsBesetzungen = StueckRolle & {
  besetzungen: (ProduktionsBesetzung & {
    person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'skills'> | null
  })[]
}
```

---

## 4. Server Actions

### Datei: `lib/actions/produktions-besetzungen.ts`

| Action | Beschreibung | Permission |
|--------|-------------|------------|
| `getProduktionsBesetzungen(produktionId)` | Alle Besetzungen einer Produktion mit Details | `produktionen:read` |
| `getRollenMitProduktionsBesetzungen(produktionId)` | Rollen des Stücks mit zugehörigen Besetzungen | `produktionen:read` |
| `createProduktionsBesetzung(data)` | Neue Besetzung anlegen | `produktionen:write` |
| `updateProduktionsBesetzung(id, data)` | Status/Typ/Notizen aktualisieren | `produktionen:write` |
| `deleteProduktionsBesetzung(id)` | Besetzung entfernen | `produktionen:write` |
| `initBesetzungenFromStueck(produktionId)` | Rollen des Stücks als "offen" importieren | `produktionen:write` |
| `getBesetzungsVorschlaege(rolleId, produktionId)` | Skills-basierte Vorschläge | `produktionen:read` |

### `initBesetzungenFromStueck` (Kernfunktion)
Wenn eine Produktion ein Stück zugewiesen hat, erstellt diese Funktion für jede Rolle einen Eintrag mit `status: 'offen'` und `person_id: null`. Optionale Übernahme bestehender Stück-Besetzungen als Vorschlag (`status: 'vorgemerkt'`).

### `getBesetzungsVorschlaege` (Skills-Matching)
- Holt die Rolle und deren Beschreibung/Typ
- Sucht aktive Personen mit passenden Skills
- Prüft Konflikte: Person schon für andere Rolle in dieser Produktion besetzt
- Sortiert nach Relevanz (Skills-Übereinstimmung, keine Konflikte zuerst)

---

## 5. Validierung

### Datei: `lib/validations/produktions-besetzungen.ts`

```typescript
export const produktionsBesetzungSchema = z.object({
  produktion_id: z.string().uuid(),
  rolle_id: z.string().uuid(),
  person_id: z.string().uuid().nullable().optional(),
  typ: z.enum(['hauptbesetzung', 'zweitbesetzung', 'ersatz']).default('hauptbesetzung'),
  status: z.enum(['offen', 'vorgemerkt', 'besetzt', 'abgesagt']).default('offen'),
  notizen: z.string().max(500).nullable().optional(),
})
```

---

## 6. UI-Komponenten

### 6.1 `BesetzungsMatrix.tsx`
**Zweck:** Überblick aller Rollen × Besetzungen in Matrixform

- Zeilen: Rollen des Stücks (gruppiert nach Rollentyp: Haupt, Neben, Ensemble, Statisterie)
- Spalten: Hauptbesetzung, Zweitbesetzung, Ersatz
- Zellen zeigen: Person + Status-Badge
- Leere Zellen bei `status: 'offen'` → Call-to-Action Button
- Fortschrittsbalken oben: X von Y Rollen besetzt
- Filter: nach Rollentyp, nach Status

### 6.2 `BesetzungsEditor.tsx`
**Zweck:** Bearbeitungsmodus für eine einzelne Rolle

- Slide-over Panel (rechts) oder Modal
- Person-Auswahl Dropdown (gefiltert auf aktive, nicht-konfligierende)
- Typ-Auswahl (Haupt/Zweit/Ersatz)
- Status-Auswahl (Offen → Vorgemerkt → Besetzt, oder Abgesagt)
- Notizfeld
- Vorschläge-Section (Skills-Match, siehe 6.3)
- Besetzungshistorie der Rolle

### 6.3 `BesetzungsVorschlag.tsx`
**Zweck:** Zeigt vorgeschlagene Personen für eine Rolle

- Listet Personen sortiert nach Skills-Relevanz
- Zeigt: Name, passende Skills (gehighlightet), aktuelle Auslastung in der Produktion
- Warnt bei Konflikten (schon für andere Rolle besetzt)
- Quick-Action: "Vormerken" Button

### 6.4 `BesetzungsStatusBadge.tsx`
**Zweck:** Farbkodiertes Status-Badge

| Status | Farbe |
|--------|-------|
| offen | gray-100/gray-700 |
| vorgemerkt | amber-100/amber-700 |
| besetzt | green-100/green-700 |
| abgesagt | red-100/red-700 |

---

## 7. Routing & Integration

### Produktionen Detail-Seite erweitern
In `app/(protected)/produktionen/[id]/page.tsx`:
- Neuer Abschnitt "Besetzung" zwischen "Status ändern" und "Aufführungsserien"
- Nur anzeigen wenn `produktion.stueck_id` vorhanden
- Kompakte Matrix-Ansicht mit Link zu voller Besetzungsseite

### Dedizierte Besetzungsseite (optional für MVP)
`app/(protected)/produktionen/[id]/besetzung/page.tsx`:
- Volle BesetzungsMatrix mit BesetzungsEditor
- Breadcrumb: Produktionen > {Titel} > Besetzung

---

## 8. Dateistruktur

```
supabase/migrations/
  20260203100000_produktions_besetzungen.sql

apps/web/lib/
  supabase/types.ts                          # + neue Types
  actions/produktions-besetzungen.ts          # NEU
  validations/produktions-besetzungen.ts      # NEU

apps/web/components/produktionen/
  BesetzungsMatrix.tsx                        # NEU
  BesetzungsEditor.tsx                        # NEU
  BesetzungsVorschlag.tsx                     # NEU
  BesetzungsStatusBadge.tsx                   # NEU
  index.ts                                    # + neue Exports

apps/web/app/(protected)/produktionen/
  [id]/page.tsx                               # MODIFIED - Besetzungs-Abschnitt
  [id]/besetzung/page.tsx                     # NEU (optional)
```

---

## 9. Implementierungsreihenfolge

| # | Schritt | Dateien |
|---|---------|---------|
| 1 | Migration: `produktions_besetzungen` Tabelle | `20260203100000_produktions_besetzungen.sql` |
| 2 | Types + Status-Labels in `types.ts` | `lib/supabase/types.ts` |
| 3 | Zod-Validierung | `lib/validations/produktions-besetzungen.ts` |
| 4 | Server Actions (CRUD + Init + Vorschläge) | `lib/actions/produktions-besetzungen.ts` |
| 5 | BesetzungsStatusBadge | `components/produktionen/BesetzungsStatusBadge.tsx` |
| 6 | BesetzungsVorschlag | `components/produktionen/BesetzungsVorschlag.tsx` |
| 7 | BesetzungsEditor | `components/produktionen/BesetzungsEditor.tsx` |
| 8 | BesetzungsMatrix | `components/produktionen/BesetzungsMatrix.tsx` |
| 9 | Detail-Seite Integration | `app/(protected)/produktionen/[id]/page.tsx` |

---

## 10. Sicherheit

- **Permission-Check** in allen Server Actions: `produktionen:write` für Mutationen
- **RLS**: Nur `is_management()` kann schreiben
- **Validierung**: Zod-Schema auf Server-Seite
- **Konsistenz-Check**: Rolle muss zum Stück der Produktion gehören
- **Duplikat-Check**: UNIQUE Constraint verhindert doppelte Einträge

---

## 11. Abgrenzung / Nicht-Scope

- **Drag & Drop Zuweisung** (Issue fordert es, empfehle Verschiebung auf spätere Iteration)
- **Besetzungshistorie** über die audit_logs abgedeckt, kein separates UI in MVP
- **Bulk-Operationen** (z.B. alle Rollen auf "besetzt" setzen) → spätere Iteration
- **Verfügbarkeits-Integration** → eigenes Issue
