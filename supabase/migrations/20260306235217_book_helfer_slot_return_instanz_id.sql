-- =============================================================================
-- Migration: Return rollen_instanz_id from book_helfer_slot()
-- Created: 2026-03-06
-- Issue: #416
-- Description: Add rollen_instanz_id to book_helfer_slot() JSONB result
--   so callers can reliably map results to roles (independent of array order).
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
      'rollen_instanz_id', p_rollen_instanz_id,
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
      'rollen_instanz_id', p_rollen_instanz_id,
      'error', 'Rolleninstanz nicht gefunden'
    );
  END IF;

  -- For external registrations, verify the role is public
  IF p_profile_id IS NULL AND v_instanz.sichtbarkeit != 'public' THEN
    RETURN jsonb_build_object(
      'success', false,
      'rollen_instanz_id', p_rollen_instanz_id,
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
  RETURNING id, abmeldung_token INTO v_anmeldung_id, v_abmeldung_token;

  RETURN jsonb_build_object(
    'success', true,
    'rollen_instanz_id', p_rollen_instanz_id,
    'anmeldung_id', v_anmeldung_id,
    'status', v_status,
    'is_waitlist', v_is_waitlist,
    'abmeldung_token', v_abmeldung_token
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'rollen_instanz_id', p_rollen_instanz_id,
      'error', 'Bereits für diese Rolle angemeldet'
    );
  WHEN check_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'rollen_instanz_id', p_rollen_instanz_id,
      'error', 'Ungültige Anmeldedaten'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION book_helfer_slot TO anon;
GRANT EXECUTE ON FUNCTION book_helfer_slot TO authenticated;
