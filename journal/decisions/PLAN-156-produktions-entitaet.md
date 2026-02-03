# Tech Plan: Produktions-Entität erstellen

**Issue:** #156
**Priority:** high
**Author:** Martin (Bühnenmeister)
**Date:** 2026-02-02

## 1. Übersicht

Eine "Produktion" ist das übergeordnete Objekt für Theaterprojekte. Sie verbindet ein Stück mit einem konkreten Aufführungszeitraum und steuert den gesamten Produktionsprozess von der Planung bis zum Abschluss.

### Kernkonzepte

```
Produktion (z.B. "Sommernachtstraum 2026")
├── verknüpft mit: Stück (optional)
├── hat: Status-Workflow
├── hat: Produktionsleitung (Person)
├── enthält: Aufführungsserien
│   └── Serie (z.B. "Hauptserie Widen")
│       ├── Standard-Ort/Zeiten
│       ├── Standard-Ressourcen
│       └── generiert: Aufführungen (Einzeltermine)
```

## 2. Datenbank (Supabase)

### 2.1 ENUM Types

```sql
-- supabase/migrations/20260203000000_produktionen.sql

-- Produktions-Status Workflow
CREATE TYPE produktion_status AS ENUM (
  'draft',           -- Entwurf, noch nicht aktiv
  'planung',         -- Aktive Planungsphase
  'casting',         -- Besetzungsphase
  'proben',          -- Probenphase
  'premiere',        -- Kurz vor/nach Premiere
  'laufend',         -- Aufführungen laufen
  'abgeschlossen',   -- Produktion beendet
  'abgesagt'         -- Produktion abgesagt
);

-- Aufführungsserie-Status
CREATE TYPE serie_status AS ENUM (
  'draft',           -- Entwurf
  'planung',         -- In Planung
  'publiziert',      -- Öffentlich sichtbar
  'abgeschlossen'    -- Serie beendet
);
```

### 2.2 Tabellen

```sql
-- =============================================================================
-- Produktionen (Haupttabelle)
-- =============================================================================

CREATE TABLE produktionen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titel TEXT NOT NULL,
  beschreibung TEXT,
  stueck_id UUID REFERENCES stuecke(id) ON DELETE SET NULL,
  status produktion_status NOT NULL DEFAULT 'draft',
  saison TEXT NOT NULL,  -- z.B. "2026", "2026/2027"
  proben_start DATE,
  premiere DATE,
  derniere DATE,
  produktionsleitung_id UUID REFERENCES personen(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Aufführungsserien (gruppiert Einzelaufführungen)
-- =============================================================================

CREATE TABLE auffuehrungsserien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produktion_id UUID NOT NULL REFERENCES produktionen(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- z.B. "Hauptserie Widen", "Gastspiel Bremgarten"
  beschreibung TEXT,
  status serie_status NOT NULL DEFAULT 'draft',
  -- Standard-Werte für generierte Aufführungen
  standard_ort TEXT,
  standard_startzeit TIME,
  standard_einlass_minuten INTEGER DEFAULT 30,
  -- Template für Schichten
  template_id UUID REFERENCES auffuehrung_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Serienaufführungen (Einzeltermine einer Serie)
-- =============================================================================

CREATE TABLE serienaufführungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serie_id UUID NOT NULL REFERENCES auffuehrungsserien(id) ON DELETE CASCADE,
  veranstaltung_id UUID REFERENCES veranstaltungen(id) ON DELETE SET NULL,
  datum DATE NOT NULL,
  startzeit TIME,
  ort TEXT,
  typ TEXT DEFAULT 'regulaer',  -- regulaer, premiere, derniere, schulvorstellung, sondervorstellung
  ist_ausnahme BOOLEAN DEFAULT false,  -- Manuell ausgeschlossen
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(serie_id, datum, startzeit)
);

-- =============================================================================
-- Produktions-Stab (Team-Zuweisung) - für Issue #159
-- =============================================================================

CREATE TABLE produktions_stab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produktion_id UUID NOT NULL REFERENCES produktionen(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  funktion TEXT NOT NULL,  -- z.B. "Regie", "Regieassistenz", "Bühnenbild"
  ist_leitung BOOLEAN DEFAULT false,
  von DATE,
  bis DATE,
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(produktion_id, person_id, funktion)
);
```

### 2.3 Indexes

```sql
-- Performance-Indexes
CREATE INDEX idx_produktionen_status ON produktionen(status);
CREATE INDEX idx_produktionen_saison ON produktionen(saison);
CREATE INDEX idx_produktionen_stueck ON produktionen(stueck_id);
CREATE INDEX idx_produktionen_leitung ON produktionen(produktionsleitung_id);

CREATE INDEX idx_serien_produktion ON auffuehrungsserien(produktion_id);
CREATE INDEX idx_serien_status ON auffuehrungsserien(status);

CREATE INDEX idx_serienauffuehrungen_serie ON serienaufführungen(serie_id);
CREATE INDEX idx_serienauffuehrungen_datum ON serienaufführungen(datum);
CREATE INDEX idx_serienauffuehrungen_veranstaltung ON serienaufführungen(veranstaltung_id);

CREATE INDEX idx_produktions_stab_produktion ON produktions_stab(produktion_id);
CREATE INDEX idx_produktions_stab_person ON produktions_stab(person_id);
```

### 2.4 Triggers

```sql
-- Updated_at Triggers
CREATE TRIGGER set_produktionen_updated_at
  BEFORE UPDATE ON produktionen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_auffuehrungsserien_updated_at
  BEFORE UPDATE ON auffuehrungsserien
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_serienauffuehrungen_updated_at
  BEFORE UPDATE ON serienaufführungen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.5 RLS Policies

```sql
-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE produktionen ENABLE ROW LEVEL SECURITY;
ALTER TABLE auffuehrungsserien ENABLE ROW LEVEL SECURITY;
ALTER TABLE serienaufführungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE produktions_stab ENABLE ROW LEVEL SECURITY;

-- Produktionen: Alle authentifizierten können lesen
CREATE POLICY "Authenticated users can view produktionen"
  ON produktionen FOR SELECT
  TO authenticated
  USING (true);

-- Management kann schreiben (ADMIN, VORSTAND)
CREATE POLICY "Management can insert produktionen"
  ON produktionen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update produktionen"
  ON produktionen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Admins can delete produktionen"
  ON produktionen FOR DELETE
  TO authenticated
  USING (is_admin());

-- Serien: Gleiche Policies
CREATE POLICY "Authenticated users can view serien"
  ON auffuehrungsserien FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert serien"
  ON auffuehrungsserien FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update serien"
  ON auffuehrungsserien FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Admins can delete serien"
  ON auffuehrungsserien FOR DELETE
  TO authenticated
  USING (is_admin());

-- Serienaufführungen: Gleiche Policies
CREATE POLICY "Authenticated users can view serienauffuehrungen"
  ON serienaufführungen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert serienauffuehrungen"
  ON serienaufführungen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update serienauffuehrungen"
  ON serienaufführungen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete serienauffuehrungen"
  ON serienaufführungen FOR DELETE
  TO authenticated
  USING (is_management());

-- Produktions-Stab: Gleiche Policies
CREATE POLICY "Authenticated users can view produktions_stab"
  ON produktions_stab FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can manage produktions_stab"
  ON produktions_stab FOR ALL
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());
```

### 2.6 Audit Logging (Status-Änderungen)

```sql
-- Audit-Log für Status-Änderungen
CREATE OR REPLACE FUNCTION log_produktion_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      user_id
    ) VALUES (
      'produktionen',
      NEW.id,
      'status_change',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_produktion_status
  AFTER UPDATE ON produktionen
  FOR EACH ROW
  EXECUTE FUNCTION log_produktion_status_change();

-- Gleicher Trigger für Serien
CREATE OR REPLACE FUNCTION log_serie_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      user_id
    ) VALUES (
      'auffuehrungsserien',
      NEW.id,
      'status_change',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_serie_status
  AFTER UPDATE ON auffuehrungsserien
  FOR EACH ROW
  EXECUTE FUNCTION log_serie_status_change();
```

## 3. TypeScript Types

```typescript
// lib/supabase/types.ts - Neue Types hinzufügen

// =============================================================================
// Produktionen (Issue #156)
// =============================================================================

export type ProduktionStatus =
  | 'draft'
  | 'planung'
  | 'casting'
  | 'proben'
  | 'premiere'
  | 'laufend'
  | 'abgeschlossen'
  | 'abgesagt'

export type SerieStatus = 'draft' | 'planung' | 'publiziert' | 'abgeschlossen'

export type AuffuehrungsTyp =
  | 'regulaer'
  | 'premiere'
  | 'derniere'
  | 'schulvorstellung'
  | 'sondervorstellung'

export const PRODUKTION_STATUS_LABELS: Record<ProduktionStatus, string> = {
  draft: 'Entwurf',
  planung: 'In Planung',
  casting: 'Casting',
  proben: 'Probenphase',
  premiere: 'Premiere',
  laufend: 'Laufend',
  abgeschlossen: 'Abgeschlossen',
  abgesagt: 'Abgesagt',
}

export const SERIE_STATUS_LABELS: Record<SerieStatus, string> = {
  draft: 'Entwurf',
  planung: 'In Planung',
  publiziert: 'Publiziert',
  abgeschlossen: 'Abgeschlossen',
}

export const AUFFUEHRUNG_TYP_LABELS: Record<AuffuehrungsTyp, string> = {
  regulaer: 'Regulär',
  premiere: 'Premiere',
  derniere: 'Dernière',
  schulvorstellung: 'Schulvorstellung',
  sondervorstellung: 'Sondervorstellung',
}

export type Produktion = {
  id: string
  titel: string
  beschreibung: string | null
  stueck_id: string | null
  status: ProduktionStatus
  saison: string
  proben_start: string | null
  premiere: string | null
  derniere: string | null
  produktionsleitung_id: string | null
  created_at: string
  updated_at: string
}

export type ProduktionInsert = Omit<Produktion, 'id' | 'created_at' | 'updated_at'>
export type ProduktionUpdate = Partial<ProduktionInsert>

export type Auffuehrungsserie = {
  id: string
  produktion_id: string
  name: string
  beschreibung: string | null
  status: SerieStatus
  standard_ort: string | null
  standard_startzeit: string | null
  standard_einlass_minuten: number | null
  template_id: string | null
  created_at: string
  updated_at: string
}

export type AuffuehrungsserieInsert = Omit<Auffuehrungsserie, 'id' | 'created_at' | 'updated_at'>
export type AuffuehrungsserieUpdate = Partial<AuffuehrungsserieInsert>

export type Serienauffuehrung = {
  id: string
  serie_id: string
  veranstaltung_id: string | null
  datum: string
  startzeit: string | null
  ort: string | null
  typ: AuffuehrungsTyp
  ist_ausnahme: boolean
  notizen: string | null
  created_at: string
  updated_at: string
}

export type SerienauffuehrungInsert = Omit<Serienauffuehrung, 'id' | 'created_at' | 'updated_at'>
export type SerienauffuehrungUpdate = Partial<SerienauffuehrungInsert>

export type ProduktionsStab = {
  id: string
  produktion_id: string
  person_id: string
  funktion: string
  ist_leitung: boolean
  von: string | null
  bis: string | null
  notizen: string | null
  created_at: string
}

export type ProduktionsStabInsert = Omit<ProduktionsStab, 'id' | 'created_at'>
export type ProduktionsStabUpdate = Partial<ProduktionsStabInsert>

// Extended types for views
export type ProduktionMitDetails = Produktion & {
  stueck: Pick<Stueck, 'id' | 'titel'> | null
  produktionsleitung: Pick<Person, 'id' | 'vorname' | 'nachname'> | null
  serien_count: number
  naechste_auffuehrung: string | null
}

export type AuffuehrungsserieMitDetails = Auffuehrungsserie & {
  produktion: Pick<Produktion, 'id' | 'titel'>
  auffuehrungen_count: number
  template: Pick<AuffuehrungTemplate, 'id' | 'name'> | null
}

export type ProduktionMitStab = Produktion & {
  stab: (ProduktionsStab & {
    person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
  })[]
}
```

## 4. Dateistruktur

```
apps/web/
├── app/(protected)/produktionen/
│   ├── page.tsx                    # Übersicht aller Produktionen
│   ├── neu/
│   │   └── page.tsx                # Neue Produktion erstellen
│   └── [id]/
│       ├── page.tsx                # Produktions-Detail/Dashboard
│       ├── bearbeiten/
│       │   └── page.tsx            # Produktion bearbeiten
│       └── serien/
│           ├── page.tsx            # Serien-Übersicht
│           ├── neu/
│           │   └── page.tsx        # Neue Serie erstellen
│           └── [serieId]/
│               ├── page.tsx        # Serie-Detail mit Aufführungen
│               └── generieren/
│                   └── page.tsx    # Aufführungen generieren
├── components/produktionen/
│   ├── ProduktionCard.tsx          # Karte für Übersicht
│   ├── ProduktionForm.tsx          # Formular (Create/Edit)
│   ├── ProduktionStatusBadge.tsx   # Status-Anzeige
│   ├── ProduktionStatusSelect.tsx  # Status-Workflow Dropdown
│   ├── SerieCard.tsx               # Serie-Karte
│   ├── SerieForm.tsx               # Serie-Formular
│   ├── AuffuehrungGenerator.tsx    # Termine generieren UI
│   └── AuffuehrungListe.tsx        # Liste der Einzeltermine
└── lib/
    ├── actions/produktionen.ts     # Server Actions
    └── validations/produktionen.ts # Zod Schemas
```

## 5. Server Actions

```typescript
// lib/actions/produktionen.ts

'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type {
  Produktion,
  ProduktionInsert,
  ProduktionUpdate,
  ProduktionMitDetails,
  Auffuehrungsserie,
  AuffuehrungsserieInsert,
  AuffuehrungsserieUpdate,
  Serienauffuehrung,
  SerienauffuehrungInsert,
} from '../supabase/types'

// =============================================================================
// Produktionen
// =============================================================================

export async function getProduktionen(): Promise<ProduktionMitDetails[]>
export async function getAktiveProduktionen(): Promise<ProduktionMitDetails[]>
export async function getProduktion(id: string): Promise<ProduktionMitDetails | null>
export async function createProduktion(data: ProduktionInsert): Promise<{ success: boolean; error?: string; id?: string }>
export async function updateProduktion(id: string, data: ProduktionUpdate): Promise<{ success: boolean; error?: string }>
export async function deleteProduktion(id: string): Promise<{ success: boolean; error?: string }>
export async function updateProduktionStatus(id: string, status: ProduktionStatus): Promise<{ success: boolean; error?: string }>

// =============================================================================
// Aufführungsserien
// =============================================================================

export async function getSerien(produktionId: string): Promise<AuffuehrungsserieMitDetails[]>
export async function getSerie(id: string): Promise<AuffuehrungsserieMitDetails | null>
export async function createSerie(data: AuffuehrungsserieInsert): Promise<{ success: boolean; error?: string; id?: string }>
export async function updateSerie(id: string, data: AuffuehrungsserieUpdate): Promise<{ success: boolean; error?: string }>
export async function deleteSerie(id: string): Promise<{ success: boolean; error?: string }>

// =============================================================================
// Aufführungen generieren
// =============================================================================

export async function generiereAuffuehrungen(
  serieId: string,
  termine: { datum: string; startzeit?: string; typ?: AuffuehrungsTyp }[]
): Promise<{ success: boolean; error?: string; count?: number }>

export async function generiereAuffuehrungenWiederholung(
  serieId: string,
  config: {
    startDatum: string
    endDatum: string
    wochentage: number[]  // 0=So, 1=Mo, ..., 6=Sa
    startzeit?: string
    ausnahmen?: string[]  // Daten die ausgeschlossen werden
  }
): Promise<{ success: boolean; error?: string; count?: number }>

export async function getSerienAuffuehrungen(serieId: string): Promise<Serienauffuehrung[]>
export async function updateSerienauffuehrung(id: string, data: SerienauffuehrungUpdate): Promise<{ success: boolean; error?: string }>
export async function deleteSerienauffuehrung(id: string): Promise<{ success: boolean; error?: string }>
```

## 6. Zod Validations

```typescript
// lib/validations/produktionen.ts

import { z } from 'zod'

export const produktionSchema = z.object({
  titel: z.string().min(1, 'Titel ist erforderlich').max(200),
  beschreibung: z.string().max(2000).optional().nullable(),
  stueck_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'planung', 'casting', 'proben', 'premiere', 'laufend', 'abgeschlossen', 'abgesagt']).default('draft'),
  saison: z.string().min(1, 'Saison ist erforderlich').max(20),
  proben_start: z.string().optional().nullable(),
  premiere: z.string().optional().nullable(),
  derniere: z.string().optional().nullable(),
  produktionsleitung_id: z.string().uuid().optional().nullable(),
})

export const serieSchema = z.object({
  produktion_id: z.string().uuid(),
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  beschreibung: z.string().max(2000).optional().nullable(),
  status: z.enum(['draft', 'planung', 'publiziert', 'abgeschlossen']).default('draft'),
  standard_ort: z.string().max(200).optional().nullable(),
  standard_startzeit: z.string().optional().nullable(),
  standard_einlass_minuten: z.number().int().min(0).max(120).optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
})

export const auffuehrungGeneratorSchema = z.object({
  termine: z.array(z.object({
    datum: z.string(),
    startzeit: z.string().optional(),
    typ: z.enum(['regulaer', 'premiere', 'derniere', 'schulvorstellung', 'sondervorstellung']).optional(),
  })).min(1, 'Mindestens ein Termin erforderlich'),
})

export const wiederholungGeneratorSchema = z.object({
  startDatum: z.string(),
  endDatum: z.string(),
  wochentage: z.array(z.number().int().min(0).max(6)).min(1, 'Mindestens ein Wochentag erforderlich'),
  startzeit: z.string().optional(),
  ausnahmen: z.array(z.string()).optional(),
})
```

## 7. Data Flow

### 7.1 Produktion erstellen

```
1. User → /produktionen/neu (ProduktionForm)
2. Form Submit → createProduktion() Server Action
3. Server Action:
   a. getUserProfile() → Check permission 'stuecke:write'
   b. Zod validate input
   c. supabase.from('produktionen').insert()
   d. revalidatePath('/produktionen')
4. Redirect → /produktionen/[id]
```

### 7.2 Aufführungen generieren (Wiederholung)

```
1. User → /produktionen/[id]/serien/[serieId]/generieren
2. User wählt:
   - Zeitraum (Start/Ende)
   - Wochentage (z.B. Fr, Sa, So)
   - Standard-Startzeit
   - Ausnahmen (bestimmte Termine)
3. Preview: Zeigt generierte Termine an
4. Bestätigen → generiereAuffuehrungenWiederholung()
5. Server Action:
   a. Berechnet alle Termine im Zeitraum
   b. Filtert nach Wochentagen
   c. Entfernt Ausnahmen
   d. Bulk-Insert in serienaufführungen
   e. revalidatePath()
```

## 8. Permissions

Neue Permission hinzufügen in `lib/supabase/types.ts`:

```typescript
export type Permission =
  // ... existing permissions
  | 'produktionen:read'
  | 'produktionen:write'
  | 'produktionen:delete'
```

Permission Matrix in `lib/supabase/permissions.ts`:

| Role | produktionen:read | produktionen:write | produktionen:delete |
|------|-------------------|--------------------|--------------------|
| ADMIN | ✅ | ✅ | ✅ |
| VORSTAND | ✅ | ✅ | ❌ |
| MITGLIED_AKTIV | ✅ | ❌ | ❌ |
| Others | ❌ | ❌ | ❌ |

## 9. UI Components

### 9.1 ProduktionStatusBadge

```typescript
// Status-Farben passend zum Theater-Theme
const STATUS_COLORS: Record<ProduktionStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  planung: 'bg-info-100 text-info-700',
  casting: 'bg-warning-100 text-warning-700',
  proben: 'bg-stage-100 text-stage-700',
  premiere: 'bg-curtain-100 text-curtain-700',
  laufend: 'bg-success-100 text-success-700',
  abgeschlossen: 'bg-gray-100 text-gray-500',
  abgesagt: 'bg-error-100 text-error-700',
}
```

### 9.2 Status-Workflow Validierung

Erlaubte Status-Übergänge:

```typescript
const ALLOWED_TRANSITIONS: Record<ProduktionStatus, ProduktionStatus[]> = {
  draft: ['planung', 'abgesagt'],
  planung: ['casting', 'proben', 'abgesagt'],
  casting: ['proben', 'planung', 'abgesagt'],
  proben: ['premiere', 'casting', 'abgesagt'],
  premiere: ['laufend', 'abgesagt'],
  laufend: ['abgeschlossen', 'abgesagt'],
  abgeschlossen: [],  // Endstatus
  abgesagt: [],       // Endstatus
}
```

## 10. Security Considerations

- [x] RLS für alle neuen Tabellen (produktionen, auffuehrungsserien, serienaufführungen, produktions_stab)
- [x] Permission Check in allen Server Actions
- [x] Zod Validation für alle Inputs
- [x] Audit-Logging für Status-Änderungen
- [ ] Input Sanitization für Freitext-Felder (beschreibung, notizen)
- [ ] Rate Limiting für Bulk-Generierung (max. 100 Aufführungen pro Request)

## 11. Migration

Vollständiges Migrations-File: `supabase/migrations/20260203000000_produktionen.sql`

**Peter's Aufgaben:**
1. Migration erstellen und testen
2. Types in `lib/supabase/types.ts` hinzufügen
3. Permissions in `lib/supabase/permissions.ts` erweitern
4. Server Actions implementieren (`lib/actions/produktionen.ts`)
5. Validations erstellen (`lib/validations/produktionen.ts`)
6. Route `/produktionen` mit Übersicht
7. Route `/produktionen/neu` mit Formular
8. Route `/produktionen/[id]` mit Detail-Ansicht

**Scope für Issue #156 (MVP):**
- ✅ Produktion CRUD
- ✅ Status-Workflow
- ✅ Verknüpfung mit Stück
- ✅ Produktionsleitung zuweisen
- ⏳ Serien (Teil von #156, aber kann Folge-Issue werden)
- ⏳ Aufführungen generieren (Teil von #156, aber kann Folge-Issue werden)

---

**Erstellt:** 2026-02-02
**Status:** Ready for Implementation
