-- =============================================================================
-- Migration: Atomic Helfer Booking (Race-Condition Safe)
-- Created: 2026-02-11
-- Issue: #248
-- Description: Atomic slot booking for helfer registration system
--   - Partial unique indexes for duplicate prevention
--   - book_helfer_slot(): Single slot booking with FOR UPDATE lock
--   - book_helfer_slots(): Multi-slot transactional booking
--   - check_helfer_time_conflicts(): Overlap detection for helpers
-- =============================================================================

-- =============================================================================
-- PARTIAL UNIQUE INDEXES: Prevent duplicate registrations
-- Only active registrations count (status != 'abgelehnt')
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS helfer_anmeldungen_unique_external_helper
  ON helfer_anmeldungen(rollen_instanz_id, external_helper_id)
  WHERE external_helper_id IS NOT NULL AND status != 'abgelehnt';

CREATE UNIQUE INDEX IF NOT EXISTS helfer_anmeldungen_unique_profile
  ON helfer_anmeldungen(rollen_instanz_id, profile_id)
  WHERE profile_id IS NOT NULL AND status != 'abgelehnt';

-- =============================================================================
-- FUNCTION: book_helfer_slot()
-- Atomic single-slot booking with row-level lock
-- Returns JSONB: {success, anmeldung_id, status, is_waitlist, error}
-- =============================================================================

CREATE OR REPLACE FUNCTION book_helfer_slot(
  p_rollen_instanz_id UUID,
  p_profile_id UUID DEFAULT NULL,
  p_external_helper_id UUID DEFAULT NULL,
  p_external_name TEXT DEFAULT NULL,
  p_external_email TEXT DEFAULT NULL,
  p_external_telefon TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_instanz RECORD;
  v_active_count INTEGER;
  v_status TEXT;
  v_anmeldung_id UUID;
  v_is_waitlist BOOLEAN;
BEGIN
  -- Validate: exactly one identity must be provided
  IF (
    (p_profile_id IS NOT NULL)::INTEGER +
    (p_external_helper_id IS NOT NULL)::INTEGER +
    (p_external_name IS NOT NULL)::INTEGER
  ) != 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Genau eine Identität muss angegeben werden'
    );
  END IF;

  -- Lock the rollen_instanz row to prevent concurrent capacity changes
  SELECT id, anzahl_benoetigt, sichtbarkeit
  INTO v_instanz
  FROM helfer_rollen_instanzen
  WHERE id = p_rollen_instanz_id
  FOR UPDATE;

  IF v_instanz IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rolleninstanz nicht gefunden'
    );
  END IF;

  -- For external registrations, verify the role is public
  IF p_profile_id IS NULL AND v_instanz.sichtbarkeit != 'public' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rolle nicht öffentlich zugänglich'
    );
  END IF;

  -- Count active registrations atomically (while row is locked)
  SELECT COUNT(*) INTO v_active_count
  FROM helfer_anmeldungen
  WHERE rollen_instanz_id = p_rollen_instanz_id
  AND status != 'abgelehnt';

  -- Determine status based on capacity
  IF v_active_count >= v_instanz.anzahl_benoetigt THEN
    v_status := 'warteliste';
    v_is_waitlist := true;
  ELSE
    v_status := 'angemeldet';
    v_is_waitlist := false;
  END IF;

  -- Insert the registration
  INSERT INTO helfer_anmeldungen (
    rollen_instanz_id,
    profile_id,
    external_helper_id,
    external_name,
    external_email,
    external_telefon,
    status
  ) VALUES (
    p_rollen_instanz_id,
    p_profile_id,
    p_external_helper_id,
    p_external_name,
    p_external_email,
    p_external_telefon,
    v_status
  )
  RETURNING id INTO v_anmeldung_id;

  RETURN jsonb_build_object(
    'success', true,
    'anmeldung_id', v_anmeldung_id,
    'status', v_status,
    'is_waitlist', v_is_waitlist
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bereits für diese Rolle angemeldet'
    );
  WHEN check_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ungültige Anmeldedaten'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION book_helfer_slot TO anon;
GRANT EXECUTE ON FUNCTION book_helfer_slot TO authenticated;

-- =============================================================================
-- FUNCTION: book_helfer_slots()
-- Atomic multi-slot booking (all-or-nothing transaction)
-- Sorts IDs before locking to prevent deadlocks
-- Returns JSONB: {success, results[], error}
-- =============================================================================

CREATE OR REPLACE FUNCTION book_helfer_slots(
  p_rollen_instanz_ids UUID[],
  p_profile_id UUID DEFAULT NULL,
  p_external_helper_id UUID DEFAULT NULL,
  p_external_name TEXT DEFAULT NULL,
  p_external_email TEXT DEFAULT NULL,
  p_external_telefon TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_instanz_id UUID;
  v_result JSONB;
  v_results JSONB := '[]'::JSONB;
  v_has_failure BOOLEAN := false;
  v_sorted_ids UUID[];
BEGIN
  -- Validate input
  IF array_length(p_rollen_instanz_ids, 1) IS NULL OR
     array_length(p_rollen_instanz_ids, 1) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Keine Rolleninstanzen angegeben'
    );
  END IF;

  -- Sort IDs to prevent deadlocks (consistent lock ordering)
  SELECT array_agg(id ORDER BY id) INTO v_sorted_ids
  FROM unnest(p_rollen_instanz_ids) AS id;

  -- Book each slot sequentially (within the same transaction)
  FOREACH v_instanz_id IN ARRAY v_sorted_ids
  LOOP
    v_result := book_helfer_slot(
      p_rollen_instanz_id := v_instanz_id,
      p_profile_id := p_profile_id,
      p_external_helper_id := p_external_helper_id,
      p_external_name := p_external_name,
      p_external_email := p_external_email,
      p_external_telefon := p_external_telefon
    );

    v_results := v_results || jsonb_build_array(v_result);

    -- If a booking fails (not waitlist, but actual error), mark failure
    IF NOT (v_result->>'success')::BOOLEAN THEN
      v_has_failure := true;
    END IF;
  END LOOP;

  -- If any booking failed, rollback the entire transaction
  IF v_has_failure THEN
    RAISE EXCEPTION 'multi_slot_booking_failed';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'results', v_results
  );

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM = 'multi_slot_booking_failed' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Einige Anmeldungen sind fehlgeschlagen',
        'results', v_results
      );
    END IF;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION book_helfer_slots TO anon;
GRANT EXECUTE ON FUNCTION book_helfer_slots TO authenticated;

-- =============================================================================
-- FUNCTION: check_helfer_time_conflicts()
-- Detect overlapping zeitblocks for selected shifts and existing registrations
-- Returns JSONB: {has_conflicts, conflicts[]}
-- =============================================================================

CREATE OR REPLACE FUNCTION check_helfer_time_conflicts(
  p_rollen_instanz_ids UUID[],
  p_external_helper_id UUID DEFAULT NULL,
  p_profile_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_conflicts JSONB := '[]'::JSONB;
  v_selected RECORD;
  v_other RECORD;
BEGIN
  -- Check conflicts among the selected slots themselves
  FOR v_selected IN
    SELECT ri.id AS instanz_id,
           COALESCE(ri.zeitblock_start, he.datum_start) AS start_time,
           COALESCE(ri.zeitblock_end, he.datum_end) AS end_time,
           COALESCE(t.name, ri.custom_name, 'Unbekannt') AS rolle_name,
           he.name AS event_name
    FROM unnest(p_rollen_instanz_ids) AS sel_id
    JOIN helfer_rollen_instanzen ri ON ri.id = sel_id
    JOIN helfer_events he ON he.id = ri.helfer_event_id
    LEFT JOIN helfer_rollen_templates t ON t.id = ri.template_id
    WHERE COALESCE(ri.zeitblock_start, he.datum_start) IS NOT NULL
      AND COALESCE(ri.zeitblock_end, he.datum_end) IS NOT NULL
  LOOP
    -- Check against OTHER selected slots (one direction only to avoid duplicates)
    FOR v_other IN
      SELECT ri2.id AS instanz_id,
             COALESCE(ri2.zeitblock_start, he2.datum_start) AS start_time,
             COALESCE(ri2.zeitblock_end, he2.datum_end) AS end_time,
             COALESCE(t2.name, ri2.custom_name, 'Unbekannt') AS rolle_name,
             he2.name AS event_name
      FROM unnest(p_rollen_instanz_ids) AS sel_id2
      JOIN helfer_rollen_instanzen ri2 ON ri2.id = sel_id2
      JOIN helfer_events he2 ON he2.id = ri2.helfer_event_id
      LEFT JOIN helfer_rollen_templates t2 ON t2.id = ri2.template_id
      WHERE ri2.id > v_selected.instanz_id
        AND COALESCE(ri2.zeitblock_start, he2.datum_start) IS NOT NULL
        AND COALESCE(ri2.zeitblock_end, he2.datum_end) IS NOT NULL
    LOOP
      IF v_selected.start_time < v_other.end_time AND
         v_selected.end_time > v_other.start_time THEN
        v_conflicts := v_conflicts || jsonb_build_array(jsonb_build_object(
          'instanz_a', v_selected.instanz_id,
          'rolle_a', v_selected.rolle_name,
          'event_a', v_selected.event_name,
          'instanz_b', v_other.instanz_id,
          'rolle_b', v_other.rolle_name,
          'event_b', v_other.event_name
        ));
      END IF;
    END LOOP;

    -- Check against EXISTING registrations for external helper
    IF p_external_helper_id IS NOT NULL THEN
      FOR v_other IN
        SELECT ri2.id AS instanz_id,
               COALESCE(ri2.zeitblock_start, he2.datum_start) AS start_time,
               COALESCE(ri2.zeitblock_end, he2.datum_end) AS end_time,
               COALESCE(t2.name, ri2.custom_name, 'Unbekannt') AS rolle_name,
               he2.name AS event_name
        FROM helfer_anmeldungen ha
        JOIN helfer_rollen_instanzen ri2 ON ri2.id = ha.rollen_instanz_id
        JOIN helfer_events he2 ON he2.id = ri2.helfer_event_id
        LEFT JOIN helfer_rollen_templates t2 ON t2.id = ri2.template_id
        WHERE ha.external_helper_id = p_external_helper_id
          AND ha.status != 'abgelehnt'
          AND ri2.id != ALL(p_rollen_instanz_ids)
          AND COALESCE(ri2.zeitblock_start, he2.datum_start) IS NOT NULL
          AND COALESCE(ri2.zeitblock_end, he2.datum_end) IS NOT NULL
      LOOP
        IF v_selected.start_time < v_other.end_time AND
           v_selected.end_time > v_other.start_time THEN
          v_conflicts := v_conflicts || jsonb_build_array(jsonb_build_object(
            'instanz_a', v_selected.instanz_id,
            'rolle_a', v_selected.rolle_name,
            'event_a', v_selected.event_name,
            'instanz_b', v_other.instanz_id,
            'rolle_b', v_other.rolle_name,
            'event_b', v_other.event_name
          ));
        END IF;
      END LOOP;
    END IF;

    -- Check against EXISTING registrations for internal profile
    IF p_profile_id IS NOT NULL THEN
      FOR v_other IN
        SELECT ri2.id AS instanz_id,
               COALESCE(ri2.zeitblock_start, he2.datum_start) AS start_time,
               COALESCE(ri2.zeitblock_end, he2.datum_end) AS end_time,
               COALESCE(t2.name, ri2.custom_name, 'Unbekannt') AS rolle_name,
               he2.name AS event_name
        FROM helfer_anmeldungen ha
        JOIN helfer_rollen_instanzen ri2 ON ri2.id = ha.rollen_instanz_id
        JOIN helfer_events he2 ON he2.id = ri2.helfer_event_id
        LEFT JOIN helfer_rollen_templates t2 ON t2.id = ri2.template_id
        WHERE ha.profile_id = p_profile_id
          AND ha.status != 'abgelehnt'
          AND ri2.id != ALL(p_rollen_instanz_ids)
          AND COALESCE(ri2.zeitblock_start, he2.datum_start) IS NOT NULL
          AND COALESCE(ri2.zeitblock_end, he2.datum_end) IS NOT NULL
      LOOP
        IF v_selected.start_time < v_other.end_time AND
           v_selected.end_time > v_other.start_time THEN
          v_conflicts := v_conflicts || jsonb_build_array(jsonb_build_object(
            'instanz_a', v_selected.instanz_id,
            'rolle_a', v_selected.rolle_name,
            'event_a', v_selected.event_name,
            'instanz_b', v_other.instanz_id,
            'rolle_b', v_other.rolle_name,
            'event_b', v_other.event_name
          ));
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'has_conflicts', jsonb_array_length(v_conflicts) > 0,
    'conflicts', v_conflicts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_helfer_time_conflicts TO anon;
GRANT EXECUTE ON FUNCTION check_helfer_time_conflicts TO authenticated;
