# M1: Datenmodell & Templates - Implementation Complete

**Date:** 2026-02-05
**Issue:** #171
**Milestone:** Modul 2 - Produktion & Logistik
**Status:** Complete

## Overview

Successfully implemented M1 of the performance template system, extending the database schema and UI to support info blocks and in-kind contributions (Sachleistungen). This milestone establishes the foundation for reusable performance templates.

## What Was Implemented

### 1. Database Schema Extensions

#### Migration 1: Auffuehrungsserien Extended
**File:** `supabase/migrations/20260205000000_auffuehrungsserien_erweitern.sql`

Extended `auffuehrungsserien` table with:
- `stueck_id` (UUID, FK to stuecke) - Link to play/production
- `datum_von` (DATE) - Series start date
- `datum_bis` (DATE) - Series end date

**Rationale:** Performance series need to be associated with a specific play and have defined date ranges for planning purposes.

#### Migration 2: Template Info Blocks
**File:** `supabase/migrations/20260205000001_template_info_bloecke.sql`

New tables:
- `template_info_bloecke` - Template-level info blocks
  - Uses offset-based timing (offset_minuten)
  - Defines reusable information blocks
  - Linked to templates via template_id

- `info_bloecke` - Instance-level info blocks
  - Calculated absolute times (start_zeit)
  - Linked to specific performances
  - Inherits template properties

**Key Pattern:** Offset-based time system (see ADR-001)

#### Migration 3: Template Sachleistungen
**File:** `supabase/migrations/20260205000002_template_sachleistungen.sql`

New tables:
- `template_sachleistungen` - Template-level in-kind contributions
  - Reusable contribution definitions
  - Quantity and unit fields
  - Linked to templates

- `sachleistungen` - Instance-level contributions
  - Linked to specific performances
  - Tracks actual contributions

**Seed Data:** Created "Abendvorstellung" template with:
- 10 pre-configured shifts (Einlass, Kasse, Service, Bar, Garderobe, Technik, etc.)
- 2 info blocks (Einlass, Vorstellung Beginn)

### 2. TypeScript Type System

**File:** `apps/web/lib/supabase/types.ts`

Added complete type definitions:

```typescript
// Template level (offset-based)
type TemplateInfoBlock = {
  id: string
  template_id: string
  titel: string
  beschreibung: string | null
  offset_minuten: number
  created_at: string
}

type TemplateSachleistung = {
  id: string
  template_id: string
  bezeichnung: string
  beschreibung: string | null
  menge: number
  einheit: string | null
  created_at: string
}

// Instance level (absolute times)
type InfoBlock = {
  id: string
  auffuehrung_id: string
  template_info_block_id: string | null
  titel: string
  beschreibung: string | null
  start_zeit: string
  created_at: string
}

type Sachleistung = {
  id: string
  auffuehrung_id: string
  template_sachleistung_id: string | null
  bezeichnung: string
  beschreibung: string | null
  menge: number
  einheit: string | null
  created_at: string
}
```

Extended `TemplateMitDetails` to include nested info blocks and sachleistungen.

### 3. Validation Schemas

**File:** `apps/web/lib/validations/modul2.ts`

Added Zod schemas for form validation:

```typescript
export const templateInfoBlockSchema = z.object({
  titel: z.string().min(1, 'Titel ist erforderlich'),
  beschreibung: z.string().optional(),
  offset_minuten: z.number()
    .int('Offset muss eine ganze Zahl sein')
    .min(-480, 'Offset darf nicht früher als 8 Stunden vorher sein')
    .max(480, 'Offset darf nicht später als 8 Stunden danach sein'),
})

export const templateSachleistungSchema = z.object({
  bezeichnung: z.string().min(1, 'Bezeichnung ist erforderlich'),
  beschreibung: z.string().optional(),
  menge: z.number().positive('Menge muss positiv sein'),
  einheit: z.string().optional(),
})
```

### 4. Server Actions

**File:** `apps/web/lib/actions/templates.ts`

Implemented CRUD operations:

```typescript
// Info Blocks
async function addTemplateInfoBlock(templateId, data)
async function removeTemplateInfoBlock(id)

// Sachleistungen
async function addTemplateSachleistung(templateId, data)
async function removeTemplateSachleistung(id)

// Extended getTemplate() to include info_bloecke and sachleistungen
// Extended applyTemplate() to transfer info blocks with offset calculation
```

**Offset Calculation Logic:**
```typescript
// In applyTemplate()
for (const infoBlock of template.info_bloecke) {
  const startZeit = new Date(
    auffuehrung.start_zeit.getTime() +
    infoBlock.offset_minuten * 60000
  )

  await supabase.from('info_bloecke').insert({
    auffuehrung_id: auffuehrungId,
    template_info_block_id: infoBlock.id,
    titel: infoBlock.titel,
    beschreibung: infoBlock.beschreibung,
    start_zeit: startZeit.toISOString(),
  })
}
```

### 5. UI Components

**File:** `apps/web/components/templates/TemplateDetailEditor.tsx`

Added two new sections to the template editor:

#### Info-Blöcke Section (Amber Theme)
- List display with calculated times based on offset
- Add form with titel, beschreibung, offset_minuten
- Delete functionality with confirmation
- Time preview: "19:00 (Offset: -60 Min)" format

#### Sachleistungen Section (Green Theme)
- List display with quantity and unit
- Add form with bezeichnung, beschreibung, menge, einheit
- Delete functionality with confirmation
- Visual distinction using color themes

**Design Pattern:** Consistent with existing shift management UI

## Key Design Decisions

### 1. Offset-Based Time System

**Decision:** Use integer minute offsets instead of absolute times in templates.

**Rationale:**
- Enables true template reusability across different performance times
- Simple calculation: `performance_start + offset_minutes = actual_time`
- Supports negative offsets (pre-show) and positive (post-show)
- See ADR-001 for full details

### 2. Two-Level Architecture

**Pattern:** Separate template definitions from instances

```
Template Level (Reusable)          Instance Level (Concrete)
├── template_info_bloecke    →     ├── info_bloecke
│   └── offset_minuten             │   └── start_zeit
├── template_sachleistungen  →     ├── sachleistungen
└── template_zeitbloecke     →     └── auffuehrung_schichten
    └── start_offset_minuten           └── start_zeit
```

**Benefits:**
- Clear separation of concerns
- Templates remain unchanged when applied multiple times
- Instances can be manually adjusted post-creation

### 3. Info Blocks vs. Shifts

**Distinction:**
- **Shifts (Zeitblöcke):** Staffed positions requiring helpers (e.g., "Kasse", "Bar")
- **Info Blocks:** Informational markers without staffing (e.g., "Einlass", "Pause")

**Database Difference:**
- Shifts: Have slots, roles, assignments
- Info Blocks: Only have time and description

## Testing

### Manual Testing Performed

1. Created "Test Template" with info blocks and sachleistungen
2. Applied template to performance, verified offset calculation
3. Tested negative offsets (-120 min) and positive offsets (+30 min)
4. Verified UI updates after add/remove operations
5. Confirmed seed data loads correctly

### Edge Cases Handled

- Offset validation (min: -480, max: 480)
- Empty descriptions (optional fields)
- Quantity validation for sachleistungen (must be positive)
- Template deletion with cascading references

## Database Seed Data

Created comprehensive "Abendvorstellung" template:

**10 Shifts:**
1. Einlass (19:00-20:00, -60 min, 3 slots)
2. Kasse (18:30-20:00, -90 min, 2 slots)
3. Service Runde 1 (18:00-20:00, -120 min, 4 slots)
4. Service Runde 2 (20:15-22:15, +15 min, 4 slots)
5. Bar (18:30-22:30, -90 min, 2 slots)
6. Garderobe (18:30-22:30, -90 min, 2 slots)
7. Technik Auf-/Abbau (15:00-23:00, -240 min, 2 slots)
8. Technik Show (18:30-21:30, -90 min, 1 slot)
9. Inspizienz (18:30-21:30, -90 min, 1 slot)
10. Requisite (18:00-21:30, -120 min, 1 slot)

**2 Info Blocks:**
1. Einlass (-30 min)
2. Vorstellung Beginn (0 min)

## File Structure

```
C:/GIT/BackstagePass-1/
├── supabase/migrations/
│   ├── 20260205000000_auffuehrungsserien_erweitern.sql
│   ├── 20260205000001_template_info_bloecke.sql
│   └── 20260205000002_template_sachleistungen.sql
├── apps/web/
│   ├── lib/
│   │   ├── supabase/types.ts (extended)
│   │   ├── validations/modul2.ts (extended)
│   │   └── actions/templates.ts (extended)
│   └── components/templates/
│       └── TemplateDetailEditor.tsx (extended)
└── journal/decisions/
    └── ADR-001-offset-based-template-times.md (new)
```

## Impact on Existing Code

### Breaking Changes
None - purely additive changes.

### Extended Features
- `getTemplate()` now includes info_bloecke and sachleistungen
- `applyTemplate()` now transfers info blocks with offset calculation
- `TemplateMitDetails` type extended with new nested arrays

### Migration Path
No migration needed for existing data. New columns have sensible defaults or are nullable.

## Performance Considerations

### Database Queries
- Info blocks and sachleistungen use indexed foreign keys
- Template fetching includes nested data via JOINs
- Offset calculation happens in application layer (acceptable for current scale)

### Future Optimizations
- Consider database function for offset calculation if needed at scale
- Potential caching layer for frequently used templates

## Next Steps (M2)

Based on this foundation, M2 will implement:

1. **Auffuehrungen Generation** - Create performances from series with date patterns
2. **Ressourcen Management** - Non-personal resources (rooms, equipment)
3. **Template Application Workflow** - Bulk apply templates to multiple performances
4. **Schedule Visualization** - Gantt/timeline view of shifts and info blocks

## References

- **Issue:** #171 M1: Datenmodell & Templates
- **Milestone:** Modul 2 - Produktion & Logistik
- **ADR:** ADR-001 Offset-Based Time System
- **Database Schema:** See migrations directory
- **Type Definitions:** `apps/web/lib/supabase/types.ts`
- **UI Components:** `apps/web/components/templates/TemplateDetailEditor.tsx`

## Lessons Learned

1. **Offset System Clarity**: The offset-based approach proved intuitive once explained
2. **Seed Data Value**: Having a complete example template aids development and testing
3. **Type Safety**: TypeScript caught several potential bugs during development
4. **UI Consistency**: Following existing patterns made integration seamless
5. **Documentation First**: ADR-001 helped solidify the design before implementation

## Acknowledgments

- **Martin (Bühnenmeister)**: Database design and migration scripts
- **Peter (Kulissenbauer)**: Server actions and UI implementation
- **Ioannis (Kritiker)**: Type safety and validation patterns
- **Silke (Chronist)**: This documentation and ADR-001
