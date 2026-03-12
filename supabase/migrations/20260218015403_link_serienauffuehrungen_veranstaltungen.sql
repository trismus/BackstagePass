-- Migration: Link Serienauffuehrungen with Veranstaltungen (Issue #396)
-- Created: 2026-02-18
-- Description: RPC functions to atomically create/delete serienauffuehrungen
--              together with their linked veranstaltungen entries.

-- =============================================================================
-- 1. generate_serienauffuehrungen_with_veranstaltungen
--    Creates veranstaltungen + serienauffuehrungen atomically per termin.
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_serienauffuehrungen_with_veranstaltungen(
  p_serie_id UUID,
  p_produktion_titel TEXT,
  p_termine JSONB
)
RETURNS SETOF serienauffuehrungen
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_termin JSONB;
  v_veranstaltung_id UUID;
  v_typ TEXT;
  v_typ_label TEXT;
  v_datum DATE;
  v_startzeit TIME;
  v_ort TEXT;
  v_serie RECORD;
  v_row serienauffuehrungen%ROWTYPE;
BEGIN
  -- Permission check
  IF NOT is_management() THEN
    RAISE EXCEPTION 'Keine Berechtigung. Nur Vorstand/Admin.';
  END IF;

  -- Fetch serie defaults
  SELECT standard_ort, standard_startzeit
    INTO v_serie
    FROM auffuehrungsserien
   WHERE id = p_serie_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serie nicht gefunden: %', p_serie_id;
  END IF;

  FOR v_termin IN SELECT * FROM jsonb_array_elements(p_termine)
  LOOP
    v_datum     := (v_termin->>'datum')::DATE;
    v_startzeit := COALESCE((v_termin->>'startzeit')::TIME, v_serie.standard_startzeit);
    v_ort       := COALESCE(v_termin->>'ort', v_serie.standard_ort);
    v_typ       := COALESCE(v_termin->>'typ', 'regulaer');

    -- Map typ to display label
    v_typ_label := CASE v_typ
      WHEN 'premiere'          THEN 'Premiere'
      WHEN 'derniere'          THEN 'Dernière'
      WHEN 'schulvorstellung'  THEN 'Schulvorstellung'
      WHEN 'sondervorstellung' THEN 'Sondervorstellung'
      ELSE 'Regulär'
    END;

    -- Create veranstaltung
    INSERT INTO veranstaltungen (titel, datum, startzeit, ort, typ, status)
    VALUES (
      p_produktion_titel || ' – ' || v_typ_label,
      v_datum,
      v_startzeit,
      v_ort,
      'auffuehrung',
      'geplant'
    )
    RETURNING id INTO v_veranstaltung_id;

    -- Create serienauffuehrung linked to veranstaltung
    INSERT INTO serienauffuehrungen (serie_id, veranstaltung_id, datum, startzeit, ort, typ, ist_ausnahme)
    VALUES (
      p_serie_id,
      v_veranstaltung_id,
      v_datum,
      v_startzeit,
      v_ort,
      v_typ,
      false
    )
    RETURNING * INTO v_row;

    RETURN NEXT v_row;
  END LOOP;
END;
$$;

-- =============================================================================
-- 2. delete_serienauffuehrung_with_veranstaltung
--    Deletes a single serienauffuehrung and its linked veranstaltung.
-- =============================================================================

CREATE OR REPLACE FUNCTION delete_serienauffuehrung_with_veranstaltung(
  p_serienauffuehrung_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_veranstaltung_id UUID;
BEGIN
  -- Permission check
  IF NOT is_management() THEN
    RAISE EXCEPTION 'Keine Berechtigung. Nur Vorstand/Admin.';
  END IF;

  -- Get linked veranstaltung_id before deleting
  SELECT veranstaltung_id
    INTO v_veranstaltung_id
    FROM serienauffuehrungen
   WHERE id = p_serienauffuehrung_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serienauffuehrung nicht gefunden: %', p_serienauffuehrung_id;
  END IF;

  -- Delete serienauffuehrung first (references veranstaltung via FK)
  DELETE FROM serienauffuehrungen WHERE id = p_serienauffuehrung_id;

  -- Delete linked veranstaltung if it exists
  IF v_veranstaltung_id IS NOT NULL THEN
    DELETE FROM veranstaltungen WHERE id = v_veranstaltung_id;
  END IF;
END;
$$;

-- =============================================================================
-- 3. delete_serie_with_veranstaltungen
--    Deletes a serie (CASCADE removes serienauffuehrungen) and all linked
--    veranstaltungen.
-- =============================================================================

CREATE OR REPLACE FUNCTION delete_serie_with_veranstaltungen(
  p_serie_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_veranstaltung_ids UUID[];
BEGIN
  -- Permission check
  IF NOT is_management() THEN
    RAISE EXCEPTION 'Keine Berechtigung. Nur Vorstand/Admin.';
  END IF;

  -- Collect all linked veranstaltung_ids before cascade delete
  SELECT ARRAY_AGG(veranstaltung_id)
    INTO v_veranstaltung_ids
    FROM serienauffuehrungen
   WHERE serie_id = p_serie_id
     AND veranstaltung_id IS NOT NULL;

  -- Delete serie (CASCADE removes serienauffuehrungen)
  DELETE FROM auffuehrungsserien WHERE id = p_serie_id;

  -- Delete linked veranstaltungen
  IF v_veranstaltung_ids IS NOT NULL AND array_length(v_veranstaltung_ids, 1) > 0 THEN
    DELETE FROM veranstaltungen WHERE id = ANY(v_veranstaltung_ids);
  END IF;
END;
$$;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON FUNCTION generate_serienauffuehrungen_with_veranstaltungen IS
  'Atomically creates veranstaltungen (typ=auffuehrung) and linked serienauffuehrungen for a serie.';

COMMENT ON FUNCTION delete_serienauffuehrung_with_veranstaltung IS
  'Deletes a serienauffuehrung and its linked veranstaltung atomically.';

COMMENT ON FUNCTION delete_serie_with_veranstaltungen IS
  'Deletes a serie (CASCADE on serienauffuehrungen) and all linked veranstaltungen.';
