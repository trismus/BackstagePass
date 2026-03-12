-- =============================================================================
-- Migration: datenschutz_akzeptiert for helfer_anmeldungen
-- Created: 2026-02-12
-- Issue: US-3
-- Description: Track GDPR consent timestamp on helper registrations.
--   - Add datenschutz_akzeptiert column
--   - Update book_helfer_slot() to accept and store it
--   - Update book_helfer_slots() to pass it through
-- =============================================================================

-- =============================================================================
-- ADD COLUMN
-- =============================================================================

ALTER TABLE helfer_anmeldungen
  ADD COLUMN IF NOT EXISTS datenschutz_akzeptiert TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN helfer_anmeldungen.datenschutz_akzeptiert IS
  'Timestamp when the volunteer accepted the privacy policy. NULL for legacy/internal registrations.';

-- =============================================================================
-- UPDATE FUNCTION: book_helfer_slot() - accept datenschutz_akzeptiert
-- =============================================================================

CREATE OR REPLACE FUNCTION book_helfer_slot(
  p_rollen_instanz_id UUID,
  p_profile_id UUID DEFAULT NULL,
  p_external_helper_id UUID DEFAULT NULL,
  p_external_name TEXT DEFAULT NULL,
  p_external_email TEXT DEFAULT NULL,
  p_external_telefon TEXT DEFAULT NULL,
  p_datenschutz_akzeptiert TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_instanz RECORD;
  v_active_count INTEGER;
  v_status TEXT;
  v_anmeldung_id UUID;
  v_abmeldung_token UUID;
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
    status,
    datenschutz_akzeptiert
  ) VALUES (
    p_rollen_instanz_id,
    p_profile_id,
    p_external_helper_id,
    p_external_name,
    p_external_email,
    p_external_telefon,
    v_status,
    p_datenschutz_akzeptiert
  )
  RETURNING id, abmeldung_token INTO v_anmeldung_id, v_abmeldung_token;

  RETURN jsonb_build_object(
    'success', true,
    'anmeldung_id', v_anmeldung_id,
    'status', v_status,
    'is_waitlist', v_is_waitlist,
    'abmeldung_token', v_abmeldung_token
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
-- UPDATE FUNCTION: book_helfer_slots() - pass datenschutz_akzeptiert through
-- =============================================================================

CREATE OR REPLACE FUNCTION book_helfer_slots(
  p_rollen_instanz_ids UUID[],
  p_profile_id UUID DEFAULT NULL,
  p_external_helper_id UUID DEFAULT NULL,
  p_external_name TEXT DEFAULT NULL,
  p_external_email TEXT DEFAULT NULL,
  p_external_telefon TEXT DEFAULT NULL,
  p_datenschutz_akzeptiert TIMESTAMPTZ DEFAULT NULL
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
      p_external_telefon := p_external_telefon,
      p_datenschutz_akzeptiert := p_datenschutz_akzeptiert
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
