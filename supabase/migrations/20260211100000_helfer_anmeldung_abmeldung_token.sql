-- =============================================================================
-- Migration: Abmeldung Token for helfer_anmeldungen
-- Created: 2026-02-11
-- Issue: US-7
-- Description: Add abmeldung_token for public cancellation links
--   - Add UUID column with unique constraint
--   - Backfill existing rows
--   - RLS policy for anon SELECT by token
--   - Update book_helfer_slot() to return abmeldung_token
-- =============================================================================

-- =============================================================================
-- ADD COLUMN: abmeldung_token
-- =============================================================================

ALTER TABLE helfer_anmeldungen
  ADD COLUMN IF NOT EXISTS abmeldung_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Backfill existing rows that might have NULL
UPDATE helfer_anmeldungen
SET abmeldung_token = gen_random_uuid()
WHERE abmeldung_token IS NULL;

-- =============================================================================
-- RLS POLICY: Allow anonymous SELECT by abmeldung_token
-- =============================================================================

DROP POLICY IF EXISTS "helfer_anmeldungen_select_by_abmeldung_token" ON helfer_anmeldungen;
CREATE POLICY "helfer_anmeldungen_select_by_abmeldung_token"
  ON helfer_anmeldungen FOR SELECT
  TO anon
  USING (
    abmeldung_token IS NOT NULL
    AND abmeldung_token = current_setting('request.headers', true)::json->>'x-abmeldung-token'
  );

-- =============================================================================
-- RLS POLICY: Allow anonymous DELETE by abmeldung_token (for cancellation)
-- =============================================================================

DROP POLICY IF EXISTS "helfer_anmeldungen_delete_by_abmeldung_token" ON helfer_anmeldungen;
CREATE POLICY "helfer_anmeldungen_delete_by_abmeldung_token"
  ON helfer_anmeldungen FOR DELETE
  TO anon
  USING (
    abmeldung_token IS NOT NULL
    AND abmeldung_token = current_setting('request.headers', true)::json->>'x-abmeldung-token'
  );

-- =============================================================================
-- UPDATE FUNCTION: book_helfer_slot() - include abmeldung_token in result
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
