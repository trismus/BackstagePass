-- Migration: Transfer auffuehrung_schichten data to helferliste system
-- Created: 2026-03-07
-- Description: Creates helfer_events + helfer_rollen_instanzen from
--   veranstaltungen + auffuehrung_schichten for all future events.
--   This enables the /mitmachen page to display available shifts.
--   Existing helfer_anmeldungen are NOT migrated (old system uses auffuehrung_zuweisungen).

-- =============================================================================
-- Step 1: Create helfer_events for veranstaltungen that don't have one yet
-- =============================================================================

INSERT INTO helfer_events (typ, veranstaltung_id, name, datum_start, datum_end, ort)
SELECT
  'auffuehrung',
  v.id,
  v.titel,
  (v.datum || ' ' || COALESCE(v.startzeit, '18:00:00'))::timestamptz,
  (v.datum || ' ' || '23:00:00')::timestamptz,
  v.ort
FROM veranstaltungen v
WHERE v.typ = 'auffuehrung'
  AND v.datum >= CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM helfer_events he WHERE he.veranstaltung_id = v.id
  );

-- =============================================================================
-- Step 2: Create helfer_rollen_templates for unique role names that don't exist
-- =============================================================================

INSERT INTO helfer_rollen_templates (name, default_anzahl)
SELECT DISTINCT
  s.rolle,
  s.anzahl_benoetigt
FROM auffuehrung_schichten s
JOIN veranstaltungen v ON v.id = s.veranstaltung_id
WHERE v.typ = 'auffuehrung'
  AND v.datum >= CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM helfer_rollen_templates t WHERE t.name = s.rolle
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Step 3: Create helfer_rollen_instanzen from auffuehrung_schichten
-- =============================================================================

INSERT INTO helfer_rollen_instanzen (
  helfer_event_id,
  template_id,
  zeitblock_start,
  zeitblock_end,
  anzahl_benoetigt,
  sichtbarkeit
)
SELECT
  he.id,
  t.id,
  (v.datum || ' ' || COALESCE(zb.startzeit, v.startzeit, '18:00:00'))::timestamptz,
  (v.datum || ' ' || COALESCE(zb.endzeit, '23:00:00'))::timestamptz,
  s.anzahl_benoetigt,
  'public'
FROM auffuehrung_schichten s
JOIN veranstaltungen v ON v.id = s.veranstaltung_id
JOIN helfer_events he ON he.veranstaltung_id = v.id
JOIN helfer_rollen_templates t ON t.name = s.rolle
LEFT JOIN zeitbloecke zb ON zb.id = s.zeitblock_id
WHERE v.typ = 'auffuehrung'
  AND v.datum >= CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM helfer_rollen_instanzen ri
    WHERE ri.helfer_event_id = he.id
      AND ri.template_id = t.id
      AND ri.zeitblock_start = (v.datum || ' ' || COALESCE(zb.startzeit, v.startzeit, '18:00:00'))::timestamptz
  );
