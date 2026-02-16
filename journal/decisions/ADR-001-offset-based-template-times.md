# ADR-001: Offset-Based Time System for Performance Templates

**Status:** Superseded (2026-02-16 - Umgestellt auf feste startzeit/endzeit, da Offset-Modell zu unverstaendlich fuer Benutzer)
**Date:** 2026-02-05
**Author:** Silke (Documentation Specialist) based on Martin's implementation
**Issue:** #171

## Context

Performance templates (Aufführungsvorlagen) define reusable shift patterns and information blocks that can be applied to multiple performances. When a template is applied to a specific performance, the shifts and info blocks need to be instantiated with concrete times.

The challenge: How should we represent times in templates that can be applied to performances starting at different times?

### Options Considered

1. **Absolute Times**: Store fixed times like "19:00" in templates
2. **Offset-Based Times**: Store relative times like "+60 minutes from performance start"
3. **Time Ranges**: Store flexible ranges like "1-2 hours before"

## Decision

We decided to use **offset-based times** with minutes as the unit.

### Template Level (Offset-Based)

Templates store shifts and info blocks with relative times:

```sql
-- template_zeitbloecke (shift templates)
- start_offset_minuten: INTEGER  -- e.g., -120 (2 hours before)
- dauer_minuten: INTEGER         -- e.g., 180 (3 hours duration)

-- template_info_bloecke (info block templates)
- offset_minuten: INTEGER        -- e.g., -60 (1 hour before)
```

### Instance Level (Absolute Times)

When applied to a performance, offsets are converted to concrete times:

```sql
-- auffuehrung_schichten (shift instances)
- start_zeit: TIMESTAMPTZ        -- e.g., '2026-06-15 17:00:00'
- end_zeit: TIMESTAMPTZ          -- e.g., '2026-06-15 20:00:00'

-- info_bloecke (info block instances)
- start_zeit: TIMESTAMPTZ        -- e.g., '2026-06-15 18:00:00'
```

### Calculation Example

```
Performance Start: 2026-06-15 19:00:00
Template Shift: start_offset_minuten = -120, dauer_minuten = 180

Calculated Times:
- start_zeit = 19:00:00 + (-120 minutes) = 17:00:00
- end_zeit = 17:00:00 + 180 minutes = 20:00:00
```

## Rationale

### Advantages

1. **Template Reusability**: Same template works for matinee (14:00) and evening (19:00) performances
2. **Consistency**: All shifts maintain their relative timing to the performance
3. **Simplicity**: Single integer value is easy to store, calculate, and understand
4. **Flexibility**: Supports negative offsets (before performance) and positive offsets (after)
5. **Precision**: Minute-level precision is sufficient for theater logistics

### Why Minutes?

- **Standard Unit**: Minutes are the standard unit for shift planning
- **No Ambiguity**: Unlike hours (fractional) or seconds (too granular)
- **Database Efficiency**: Single INTEGER column vs. INTERVAL type
- **Easy Calculation**: PostgreSQL handles `timestamp + (minutes * interval '1 minute')` efficiently

### Implementation Pattern

```typescript
// Server action to apply template
export async function applyTemplate(
  performanceId: string,
  templateId: string
) {
  // 1. Get performance start time
  const performance = await getPerformance(performanceId)
  const startTime = performance.start_zeit

  // 2. Get template shifts with offsets
  const templateShifts = await getTemplateShifts(templateId)

  // 3. Calculate absolute times
  for (const shift of templateShifts) {
    const shiftStart = addMinutes(startTime, shift.start_offset_minuten)
    const shiftEnd = addMinutes(shiftStart, shift.dauer_minuten)

    await createShift({
      auffuehrung_id: performanceId,
      start_zeit: shiftStart,
      end_zeit: shiftEnd,
      // ... other fields
    })
  }
}
```

## Consequences

### Positive

- Templates are truly reusable across different performance times
- Clear separation between template definition and instance
- Straightforward calculation logic
- Easy to validate (offsets should be reasonable, e.g., -360 to +360 minutes)
- Supports all common use cases (pre-show, during show, post-show)

### Negative

- Requires conversion step when applying template
- Need to handle edge cases (performance start time changes)
- Two different time representations in the system

### Neutral

- Manual time adjustments still possible at instance level
- If performance time changes, shifts need to be recalculated

## Related Decisions

- Template system architecture (PLAN-156)
- Performance scheduling (Issue #171)
- Shift management system (Modul 2)

## Database Migration

Implemented in:
- `20260205000001_template_info_bloecke.sql` - Info blocks with offsets
- Template shifts already had offset-based system

## Validation Rules

```typescript
// Reasonable offset ranges for theater context
const OFFSET_CONSTRAINTS = {
  minOffset: -480,  // 8 hours before (load-in)
  maxOffset: 480,   // 8 hours after (tear-down)
  minDuration: 15,  // 15 minutes minimum shift
  maxDuration: 480  // 8 hours maximum shift
}
```

## References

- Issue #171: M1 Datenmodell & Templates
- `apps/web/lib/actions/templates.ts` - Implementation
- `supabase/migrations/20260205000001_template_info_bloecke.sql` - Schema
