# Database Schema: Modul 2 - Produktion & Logistik

**Version:** 1.0
**Date:** 2026-02-05
**Status:** Current

## Overview

This document describes the database schema for Modul 2 (Produktion & Logistik), which manages performance series, templates, and helper scheduling for the Theatergruppe Widen.

## Core Concepts

### Two-Level Architecture

The system uses a **template-instance pattern** where reusable templates are defined once and applied to create concrete instances:

```
TEMPLATE LEVEL (Reusable)          INSTANCE LEVEL (Concrete)
├── auffuehrung_templates     →    ├── auffuehrungsserien
├── template_zeitbloecke      →    │   └── (generates) auffuehrungen
├── template_info_bloecke     →    ├── auffuehrung_schichten
└── template_sachleistungen   →    ├── info_bloecke
                                   └── sachleistungen
```

## Entity Relationship Diagram

```
┌─────────────────┐
│     stuecke     │
│   (Play/Show)   │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────┐
│  auffuehrungsserien     │
│  (Performance Series)   │
│  ──────────────────────│
│  • stueck_id            │
│  • datum_von, datum_bis │
│  • template_id          │
└────────┬────────────────┘
         │
         │ 1:N (generated)
         ▼
┌─────────────────────────┐
│    auffuehrungen        │
│    (Performances)       │
│    ─────────────────   │
│    • serie_id           │
│    • datum, start_zeit  │
└────────┬────────────────┘
         │
         ├─────────────────┐
         │                 │
         │ 1:N             │ 1:N
         ▼                 ▼
┌──────────────────┐  ┌─────────────────┐
│ auffuehrung_     │  │  info_bloecke   │
│ schichten        │  │  (Info Blocks)  │
│ (Shifts)         │  │  ──────────────│
│ ──────────────  │  │  • start_zeit   │
│ • start_zeit     │  └─────────────────┘
│ • end_zeit       │
│ • slots          │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│ auffuehrung_     │
│ zuweisungen      │
│ (Assignments)    │
│ ──────────────  │
│ • person_id      │
│ • slot_nummer    │
└──────────────────┘

┌─────────────────────────┐
│ auffuehrung_templates   │
│ (Templates)             │
│ ─────────────────────  │
│ • name                  │
│ • beschreibung          │
└────────┬────────────────┘
         │
         ├──────────────────┬────────────────────┐
         │                  │                    │
         │ 1:N              │ 1:N                │ 1:N
         ▼                  ▼                    ▼
┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ template_        │  │ template_       │  │ template_       │
│ zeitbloecke      │  │ info_bloecke    │  │ sachleistungen  │
│ (Shift Templates)│  │ (Info Templates)│  │ (Contributions) │
│ ──────────────  │  │ ──────────────  │  │ ──────────────  │
│ • start_offset_  │  │ • offset_       │  │ • bezeichnung   │
│   minuten        │  │   minuten       │  │ • menge         │
│ • dauer_minuten  │  └─────────────────┘  └─────────────────┘
└──────────────────┘
```

## Tables

### 1. auffuehrungsserien

Performance series serve as the master planning level for a set of related performances.

```sql
CREATE TABLE auffuehrungsserien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titel TEXT NOT NULL,
  stueck_id UUID REFERENCES stuecke(id) ON DELETE SET NULL,
  datum_von DATE,
  datum_bis DATE,
  template_id UUID REFERENCES auffuehrung_templates(id) ON DELETE SET NULL,
  beschreibung TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Groups multiple performances (e.g., "Summer Run 2026") and associates them with a play and template.

**Key Fields:**
- `stueck_id` - Link to the play being performed (optional)
- `datum_von/datum_bis` - Date range for the series
- `template_id` - Default template for performances in this series

**Extended:** Migration `20260205000000_auffuehrungsserien_erweitern.sql`

### 2. auffuehrungen

Individual performances generated from a series or created standalone.

```sql
CREATE TABLE auffuehrungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serie_id UUID REFERENCES auffuehrungsserien(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  datum DATE NOT NULL,
  start_zeit TIMESTAMPTZ NOT NULL,
  ort TEXT,
  beschreibung TEXT,
  status TEXT DEFAULT 'geplant',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Represents a single performance with a specific date and time.

**Status Values:** `geplant`, `publiziert`, `ausverkauft`, `abgeschlossen`, `abgesagt`

### 3. template_info_bloecke

Template-level information blocks using offset-based timing.

```sql
CREATE TABLE template_info_bloecke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES auffuehrung_templates(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  offset_minuten INTEGER NOT NULL,
  sortierung INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_offset CHECK (
    offset_minuten >= -480 AND offset_minuten <= 480
  )
);
```

**Purpose:** Define reusable information markers (e.g., "Einlass", "Pause") relative to performance start.

**Key Fields:**
- `offset_minuten` - Minutes before (negative) or after (positive) performance start
- `sortierung` - Display order in UI

**Offset Range:** -480 to +480 minutes (-8h to +8h)

**Created:** Migration `20260205000001_template_info_bloecke.sql`

### 4. info_bloecke

Instance-level information blocks with calculated absolute times.

```sql
CREATE TABLE info_bloecke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auffuehrung_id UUID NOT NULL REFERENCES auffuehrungen(id) ON DELETE CASCADE,
  template_info_block_id UUID REFERENCES template_info_bloecke(id) ON DELETE SET NULL,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  start_zeit TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Concrete information blocks for a specific performance with absolute times.

**Key Fields:**
- `template_info_block_id` - Reference to source template (nullable for manual entries)
- `start_zeit` - Calculated from template offset or manually set

**Created:** Migration `20260205000001_template_info_bloecke.sql`

### 5. template_sachleistungen

Template-level in-kind contributions (Sachleistungen).

```sql
CREATE TABLE template_sachleistungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES auffuehrung_templates(id) ON DELETE CASCADE,
  bezeichnung TEXT NOT NULL,
  beschreibung TEXT,
  menge NUMERIC(10,2) NOT NULL DEFAULT 0,
  einheit TEXT,
  sortierung INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT positive_menge CHECK (menge > 0)
);
```

**Purpose:** Define reusable contribution types (e.g., "Kuchen für Pause", "Blumendeko").

**Key Fields:**
- `menge` - Quantity (numeric with 2 decimal places)
- `einheit` - Unit of measurement (e.g., "Stück", "kg", "Liter")
- `sortierung` - Display order

**Created:** Migration `20260205000002_template_sachleistungen.sql`

### 6. sachleistungen

Instance-level in-kind contributions for specific performances.

```sql
CREATE TABLE sachleistungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auffuehrung_id UUID NOT NULL REFERENCES auffuehrungen(id) ON DELETE CASCADE,
  template_sachleistung_id UUID REFERENCES template_sachleistungen(id) ON DELETE SET NULL,
  bezeichnung TEXT NOT NULL,
  beschreibung TEXT,
  menge NUMERIC(10,2) NOT NULL DEFAULT 0,
  einheit TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT positive_menge CHECK (menge > 0)
);
```

**Purpose:** Track actual contributions for a specific performance.

**Key Fields:**
- `template_sachleistung_id` - Reference to source template (nullable)
- Can be manually adjusted after template application

**Created:** Migration `20260205000002_template_sachleistungen.sql`

### 7. template_zeitbloecke

Template-level shift definitions with offset-based timing.

```sql
CREATE TABLE template_zeitbloecke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES auffuehrung_templates(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  start_offset_minuten INTEGER NOT NULL,
  dauer_minuten INTEGER NOT NULL,
  slots INTEGER NOT NULL DEFAULT 1,
  helferrolle_id UUID REFERENCES helferrollen(id) ON DELETE SET NULL,
  sortierung INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_offset CHECK (
    start_offset_minuten >= -480 AND start_offset_minuten <= 480
  ),
  CONSTRAINT positive_duration CHECK (dauer_minuten > 0),
  CONSTRAINT positive_slots CHECK (slots > 0)
);
```

**Purpose:** Define reusable shift patterns with relative timing.

**Key Fields:**
- `start_offset_minuten` - Start time relative to performance
- `dauer_minuten` - Duration in minutes
- `slots` - Number of helper positions needed
- `helferrolle_id` - Optional role requirement

### 8. auffuehrung_schichten

Instance-level shifts with absolute times.

```sql
CREATE TABLE auffuehrung_schichten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auffuehrung_id UUID NOT NULL REFERENCES auffuehrungen(id) ON DELETE CASCADE,
  template_zeitblock_id UUID REFERENCES template_zeitbloecke(id) ON DELETE SET NULL,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  start_zeit TIMESTAMPTZ NOT NULL,
  end_zeit TIMESTAMPTZ NOT NULL,
  slots INTEGER NOT NULL DEFAULT 1,
  helferrolle_id UUID REFERENCES helferrollen(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'offen',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_zeit > start_zeit),
  CONSTRAINT positive_slots CHECK (slots > 0)
);
```

**Purpose:** Concrete shifts for a specific performance with calculated times.

**Status Values:** `offen`, `teilweise`, `voll`, `geschlossen`

## Indexes

```sql
-- Performance lookups
CREATE INDEX idx_auffuehrungen_serie ON auffuehrungen(serie_id);
CREATE INDEX idx_auffuehrungen_datum ON auffuehrungen(datum);
CREATE INDEX idx_auffuehrungen_start_zeit ON auffuehrungen(start_zeit);

-- Template relationships
CREATE INDEX idx_template_info_bloecke_template ON template_info_bloecke(template_id);
CREATE INDEX idx_template_sachleistungen_template ON template_sachleistungen(template_id);
CREATE INDEX idx_template_zeitbloecke_template ON template_zeitbloecke(template_id);

-- Instance lookups
CREATE INDEX idx_info_bloecke_auffuehrung ON info_bloecke(auffuehrung_id);
CREATE INDEX idx_sachleistungen_auffuehrung ON sachleistungen(auffuehrung_id);
CREATE INDEX idx_auffuehrung_schichten_auffuehrung ON auffuehrung_schichten(auffuehrung_id);

-- Template traceability
CREATE INDEX idx_info_bloecke_template_source ON info_bloecke(template_info_block_id);
CREATE INDEX idx_sachleistungen_template_source ON sachleistungen(template_sachleistung_id);
CREATE INDEX idx_schichten_template_source ON auffuehrung_schichten(template_zeitblock_id);
```

## Row Level Security (RLS)

All tables have RLS enabled. Standard policies:

```sql
-- SELECT: All authenticated users
CREATE POLICY "authenticated_read" ON table_name
  FOR SELECT TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: Management only (ADMIN + VORSTAND)
CREATE POLICY "management_write" ON table_name
  FOR ALL TO authenticated
  USING (is_management());
```

**Helper Function:**
```sql
CREATE OR REPLACE FUNCTION is_management()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'VORSTAND')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Offset-Based Time System

### Concept

Templates store relative times (offsets) that are converted to absolute times when applied to performances.

### Calculation Formula

```
absolute_time = performance_start_time + (offset_minutes * interval '1 minute')
```

### Example

```
Performance Start: 2026-06-15 19:00:00

Template Shift:
- start_offset_minuten: -120 (2 hours before)
- dauer_minuten: 180 (3 hours)

Calculated Instance:
- start_zeit: 2026-06-15 17:00:00  (19:00 - 2h)
- end_zeit: 2026-06-15 20:00:00    (17:00 + 3h)
```

### Validation Constraints

```sql
CONSTRAINT valid_offset CHECK (
  offset_minuten >= -480 AND   -- Up to 8 hours before
  offset_minuten <= 480         -- Up to 8 hours after
)
```

**Rationale:** See [ADR-001: Offset-Based Template Times](../../journal/decisions/ADR-001-offset-based-template-times.md)

## Seed Data

### Default Template: "Abendvorstellung"

Created in migration `20260205000002_template_sachleistungen.sql`:

**10 Shifts:**
1. Einlass: -60 min, 60 min duration, 3 slots
2. Kasse: -90 min, 90 min duration, 2 slots
3. Service Runde 1: -120 min, 120 min duration, 4 slots
4. Service Runde 2: +15 min, 120 min duration, 4 slots
5. Bar: -90 min, 240 min duration, 2 slots
6. Garderobe: -90 min, 240 min duration, 2 slots
7. Technik Auf-/Abbau: -240 min, 480 min duration, 2 slots
8. Technik Show: -90 min, 180 min duration, 1 slot
9. Inspizienz: -90 min, 180 min duration, 1 slot
10. Requisite: -120 min, 210 min duration, 1 slot

**2 Info Blocks:**
1. Einlass: -30 min
2. Vorstellung Beginn: 0 min

## Migration History

| Date | File | Description |
|------|------|-------------|
| 2026-02-05 | `20260205000000_auffuehrungsserien_erweitern.sql` | Extended series with stueck_id, date range |
| 2026-02-05 | `20260205000001_template_info_bloecke.sql` | Added info blocks (template + instance) |
| 2026-02-05 | `20260205000002_template_sachleistungen.sql` | Added sachleistungen + seed data |

## Usage Examples

### Query 1: Get Template with All Components

```sql
SELECT
  t.id,
  t.name,
  t.beschreibung,
  json_agg(DISTINCT tz.*) FILTER (WHERE tz.id IS NOT NULL) AS zeitbloecke,
  json_agg(DISTINCT ib.*) FILTER (WHERE ib.id IS NOT NULL) AS info_bloecke,
  json_agg(DISTINCT sl.*) FILTER (WHERE sl.id IS NOT NULL) AS sachleistungen
FROM auffuehrung_templates t
LEFT JOIN template_zeitbloecke tz ON tz.template_id = t.id
LEFT JOIN template_info_bloecke ib ON ib.template_id = t.id
LEFT JOIN template_sachleistungen sl ON sl.template_id = t.id
WHERE t.id = $1
GROUP BY t.id;
```

### Query 2: Get Performance with Shifts and Info Blocks

```sql
SELECT
  a.id,
  a.titel,
  a.start_zeit,
  json_agg(DISTINCT s.*) FILTER (WHERE s.id IS NOT NULL) AS schichten,
  json_agg(DISTINCT ib.*) FILTER (WHERE ib.id IS NOT NULL) AS info_bloecke,
  json_agg(DISTINCT sl.*) FILTER (WHERE sl.id IS NOT NULL) AS sachleistungen
FROM auffuehrungen a
LEFT JOIN auffuehrung_schichten s ON s.auffuehrung_id = a.id
LEFT JOIN info_bloecke ib ON ib.auffuehrung_id = a.id
LEFT JOIN sachleistungen sl ON sl.auffuehrung_id = a.id
WHERE a.id = $1
GROUP BY a.id;
```

### Query 3: Calculate Offset for Info Block

```sql
-- PostgreSQL function to calculate absolute time from offset
CREATE OR REPLACE FUNCTION calculate_info_block_time(
  p_performance_start TIMESTAMPTZ,
  p_offset_minutes INTEGER
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN p_performance_start + (p_offset_minutes * interval '1 minute');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Usage
SELECT calculate_info_block_time('2026-06-15 19:00:00', -60);
-- Returns: 2026-06-15 18:00:00
```

## Future Enhancements

### Planned for M2
- Automatic performance generation from series date patterns
- Resource management (rooms, equipment)
- Bulk template application
- Schedule conflict detection

### Planned for M3
- Performance statistics and reporting
- Helper availability tracking
- Automatic shift optimization
- Mobile-friendly helper assignment

## References

- **Milestone Document:** [docs/milestones/produktionsplanung-logistik.md](../milestones/produktionsplanung-logistik.md)
- **ADR-001:** [journal/decisions/ADR-001-offset-based-template-times.md](../../journal/decisions/ADR-001-offset-based-template-times.md)
- **Implementation Log:** [journal/2026-02-05-m1-datenmodell-templates-complete.md](../../journal/2026-02-05-m1-datenmodell-templates-complete.md)
- **Type Definitions:** `apps/web/lib/supabase/types.ts`
- **Migrations:** `supabase/migrations/202602050000*`

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-05 | Initial documentation for M1 completion |
