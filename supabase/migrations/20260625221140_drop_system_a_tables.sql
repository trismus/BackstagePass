-- =============================================================================
-- Migration: Drop System A (Helferliste) database objects
-- Created: 2026-06-25
-- Issue: #475 (Milestone "System A Abschaffung", Sprint 4 / Phase 4)
-- =============================================================================
-- Sanity-checked before authoring this migration (Phase 0 recount on 2026-06-25):
--   helfer_anmeldungen        : 0 rows
--   helfer_events             : 7 rows (historical structure only)
--   helfer_rollen_instanzen   : 45 rows (historical structure only)
--   helfer_rollen_templates   : 18 rows (historical structure only)
--
-- The application code stopped using System A in PR #526 (Issue #474, Sprint 3
-- Phase 3, merged 2026-06-25). Lesende Restbenutzer wurden in dieser Migration
-- ebenfalls aufgeräumt (siehe Code-Changes parallel zu dieser Migration).
--
-- IMPORTANT — DSGVO note:
--   The dropped tables historically contained PII for external helpers
--   (`external_name`, `external_email`, `external_telefon` on
--   `helfer_anmeldungen`). At the time of this migration `helfer_anmeldungen`
--   is empty, so no live PII is destroyed by this script. Historical structural
--   rows (events, role templates, role instances) contain no personal data.
--   The user explicitly decided in Sprint 1 not to archive System A data.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Drop RLS policies on OTHER tables that reference System A
--    DROP TABLE does not automatically drop policies on foreign tables that
--    USING-clauses reference the table being dropped — we must remove them.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "info_bloecke_select_via_helfer_events" ON info_bloecke;

-- -----------------------------------------------------------------------------
-- 2. Drop the System-A management view
--    (Referenced helfer_events + helfer_rollen_instanzen + helfer_anmeldungen)
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS v_helfer_event_belegung;

-- -----------------------------------------------------------------------------
-- 3. Drop System-A-only functions
--    Multiple historical signatures of book_helfer_slot/_slots may co-exist
--    in the live database (6-param variant from migration 20260306235217 and
--    7-param variant from migration 20260212121834). We enumerate via pg_proc
--    and drop every overload to remain robust.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  v_func RECORD;
BEGIN
  FOR v_func IN
    SELECT n.nspname AS schema_name,
           p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'book_helfer_slot',
        'book_helfer_slots',
        'check_helfer_time_conflicts',
        'promote_helfer_waitlist',
        'get_helferliste_dashboard_data'
      )
  LOOP
    EXECUTE format(
      'DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
      v_func.schema_name,
      v_func.func_name,
      v_func.args
    );
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Re-create check_person_conflicts() without the System-A block
--    The previous definition (migration 20260306000000) joined helfer_anmeldungen
--    + helfer_rollen_instanzen + helfer_events as the 5th conflict source.
--    After this migration the helper tables no longer exist, so the function
--    must be redefined to omit that block.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_person_conflicts(
  p_person_id UUID,
  p_start_zeit TIMESTAMPTZ,
  p_end_zeit TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_conflicts JSONB := '[]'::JSONB;
  v_record RECORD;
BEGIN
  -- 1. Verfuegbarkeiten (availability blocks)
  FOR v_record IN
    SELECT
      v.id,
      v.status::TEXT AS severity,
      COALESCE(v.grund, v.status::TEXT) AS description,
      CASE
        WHEN v.zeitfenster_von IS NOT NULL THEN
          ((v.datum_von + v.zeitfenster_von) AT TIME ZONE 'Europe/Zurich')::TEXT
        ELSE
          (v.datum_von AT TIME ZONE 'Europe/Zurich')::TEXT
      END AS start_time,
      CASE
        WHEN v.zeitfenster_bis IS NOT NULL THEN
          ((v.datum_bis + v.zeitfenster_bis) AT TIME ZONE 'Europe/Zurich')::TEXT
        ELSE
          ((v.datum_bis + INTERVAL '1 day') AT TIME ZONE 'Europe/Zurich')::TEXT
      END AS end_time
    FROM verfuegbarkeiten v
    WHERE v.mitglied_id = p_person_id
      AND v.status IN ('nicht_verfuegbar', 'eingeschraenkt')
      AND v.datum_von <= (p_end_zeit AT TIME ZONE 'Europe/Zurich')::DATE
      AND v.datum_bis >= (p_start_zeit AT TIME ZONE 'Europe/Zurich')::DATE
      AND (
        v.zeitfenster_von IS NULL
        OR (
          v.zeitfenster_von < (p_end_zeit AT TIME ZONE 'Europe/Zurich')::TIME
          AND v.zeitfenster_bis > (p_start_zeit AT TIME ZONE 'Europe/Zurich')::TIME
        )
      )
  LOOP
    v_conflicts := v_conflicts || jsonb_build_object(
      'type', 'verfuegbarkeit',
      'description', v_record.description,
      'start_time', v_record.start_time,
      'end_time', v_record.end_time,
      'reference_id', v_record.id,
      'severity', v_record.severity
    );
  END LOOP;

  -- 2. Auffuehrung-Zuweisungen (existing shift assignments) — System B
  FOR v_record IN
    SELECT
      az.id,
      s.rolle AS description,
      ((ve.datum + zb.startzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS start_time,
      ((ve.datum + zb.endzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS end_time
    FROM auffuehrung_zuweisungen az
    JOIN auffuehrung_schichten s ON s.id = az.schicht_id
    JOIN zeitbloecke zb ON zb.id = s.zeitblock_id
    JOIN veranstaltungen ve ON ve.id = s.veranstaltung_id
    WHERE az.person_id = p_person_id
      AND az.status != 'abgesagt'
      AND ve.status != 'abgesagt'
      AND ((ve.datum + zb.startzeit) AT TIME ZONE 'Europe/Zurich') < p_end_zeit
      AND ((ve.datum + zb.endzeit) AT TIME ZONE 'Europe/Zurich') > p_start_zeit
  LOOP
    v_conflicts := v_conflicts || jsonb_build_object(
      'type', 'zuweisung',
      'description', v_record.description,
      'start_time', v_record.start_time,
      'end_time', v_record.end_time,
      'reference_id', v_record.id
    );
  END LOOP;

  -- 3. Anmeldungen (event registrations)
  FOR v_record IN
    SELECT
      a.id,
      ve.titel AS description,
      ((ve.datum + ve.startzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS start_time,
      ((ve.datum + ve.endzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS end_time
    FROM anmeldungen a
    JOIN veranstaltungen ve ON ve.id = a.veranstaltung_id
    WHERE a.person_id = p_person_id
      AND a.status != 'abgemeldet'
      AND ve.status != 'abgesagt'
      AND ve.startzeit IS NOT NULL
      AND ve.endzeit IS NOT NULL
      AND ((ve.datum + ve.startzeit) AT TIME ZONE 'Europe/Zurich') < p_end_zeit
      AND ((ve.datum + ve.endzeit) AT TIME ZONE 'Europe/Zurich') > p_start_zeit
  LOOP
    v_conflicts := v_conflicts || jsonb_build_object(
      'type', 'anmeldung',
      'description', v_record.description,
      'start_time', v_record.start_time,
      'end_time', v_record.end_time,
      'reference_id', v_record.id
    );
  END LOOP;

  -- 4. Proben (rehearsals)
  FOR v_record IN
    SELECT
      pt.id,
      p.titel AS description,
      ((p.datum + p.startzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS start_time,
      ((p.datum + p.endzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS end_time
    FROM proben_teilnehmer pt
    JOIN proben p ON p.id = pt.probe_id
    WHERE pt.person_id = p_person_id
      AND pt.status != 'abgesagt'
      AND p.status != 'abgesagt'
      AND p.startzeit IS NOT NULL
      AND p.endzeit IS NOT NULL
      AND ((p.datum + p.startzeit) AT TIME ZONE 'Europe/Zurich') < p_end_zeit
      AND ((p.datum + p.endzeit) AT TIME ZONE 'Europe/Zurich') > p_start_zeit
  LOOP
    v_conflicts := v_conflicts || jsonb_build_object(
      'type', 'probe',
      'description', v_record.description,
      'start_time', v_record.start_time,
      'end_time', v_record.end_time,
      'reference_id', v_record.id
    );
  END LOOP;

  -- 5. (Removed) Helfer-Anmeldungen via System A — dropped in migration
  --    20260625221140_drop_system_a_tables.sql. System B conflicts are already
  --    covered by source #2 above (auffuehrung_zuweisungen).

  RETURN jsonb_build_object(
    'has_conflicts', jsonb_array_length(v_conflicts) > 0,
    'conflicts', v_conflicts
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_person_conflicts(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Drop System-A foreign key column on email_logs
--    email_logs.helfer_anmeldung_id is FK -> helfer_anmeldungen(id). Dropping
--    the column removes the FK constraint and the dedicated index. Historical
--    rows in email_logs survive; only the (already unused) reference is lost.
-- -----------------------------------------------------------------------------

ALTER TABLE email_logs
  DROP COLUMN IF EXISTS helfer_anmeldung_id;

-- The supporting index (if it still exists outside the column) is dropped by
-- ALTER TABLE ... DROP COLUMN automatically, but we add an idempotent guard.
DROP INDEX IF EXISTS email_logs_helfer_anmeldung_idx;

-- -----------------------------------------------------------------------------
-- 6. Drop tables (child first, parent last)
--    helfer_anmeldungen → helfer_rollen_instanzen → helfer_rollen_templates
--                                                 → helfer_events
--    Triggers, indexes, RLS-policies, and partial unique indexes on these
--    tables are dropped automatically together with the tables.
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS helfer_anmeldungen;
DROP TABLE IF EXISTS helfer_rollen_instanzen;
DROP TABLE IF EXISTS helfer_rollen_templates;
DROP TABLE IF EXISTS helfer_events;

-- -----------------------------------------------------------------------------
-- 7. Drop System-A enum type
--    `helfer_event_type` was the original enum used in the (since rewritten)
--    helfer_events.type column. The remote helfer_events.typ column ended up
--    as TEXT, so the enum is no longer referenced by any column.
-- -----------------------------------------------------------------------------

DROP TYPE IF EXISTS public.helfer_event_type;

COMMIT;
