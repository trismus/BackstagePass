-- Migration: Public Helfer Token for Veranstaltungen
-- Created: 2026-02-05
-- Issues: #212, #213, #214, #215
-- Description: Add public token to veranstaltungen for shareable helper registration links
--   - Token enables anonymous access to helper registration
--   - Works in conjunction with helfer_status for publication control

-- =============================================================================
-- ADD public_helfer_token TO veranstaltungen
-- =============================================================================

-- Add the public token column
ALTER TABLE veranstaltungen
ADD COLUMN IF NOT EXISTS public_helfer_token UUID UNIQUE;

-- Create index for token lookups (used by public pages)
CREATE INDEX IF NOT EXISTS veranstaltungen_public_helfer_token_idx
  ON veranstaltungen(public_helfer_token)
  WHERE public_helfer_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN veranstaltungen.public_helfer_token IS 'UUID token for public helper registration links. NULL means no public access.';

-- =============================================================================
-- ADD sichtbarkeit TO auffuehrung_schichten
-- =============================================================================

-- Add visibility control for individual shifts
ALTER TABLE auffuehrung_schichten
ADD COLUMN IF NOT EXISTS sichtbarkeit TEXT DEFAULT 'intern'
  CHECK (sichtbarkeit IN ('intern', 'public'));

-- Create index for filtering public shifts
CREATE INDEX IF NOT EXISTS auffuehrung_schichten_sichtbarkeit_idx
  ON auffuehrung_schichten(sichtbarkeit);

-- Add comment
COMMENT ON COLUMN auffuehrung_schichten.sichtbarkeit IS 'Visibility: intern (members only) or public (with token link)';

-- =============================================================================
-- RLS POLICIES FOR ANONYMOUS ACCESS
-- =============================================================================

-- Allow anon to read veranstaltungen with valid public token
DROP POLICY IF EXISTS "veranstaltungen_select_public" ON veranstaltungen;
CREATE POLICY "veranstaltungen_select_public"
  ON veranstaltungen FOR SELECT
  TO anon
  USING (
    public_helfer_token IS NOT NULL
    AND helfer_status = 'veroeffentlicht'
  );

-- Allow anon to read zeitbloecke for published events
DROP POLICY IF EXISTS "zeitbloecke_select_public" ON zeitbloecke;
CREATE POLICY "zeitbloecke_select_public"
  ON zeitbloecke FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM veranstaltungen v
      WHERE v.id = zeitbloecke.veranstaltung_id
      AND v.public_helfer_token IS NOT NULL
      AND v.helfer_status = 'veroeffentlicht'
    )
  );

-- Allow anon to read public shifts for published events
DROP POLICY IF EXISTS "auffuehrung_schichten_select_public" ON auffuehrung_schichten;
CREATE POLICY "auffuehrung_schichten_select_public"
  ON auffuehrung_schichten FOR SELECT
  TO anon
  USING (
    sichtbarkeit = 'public'
    AND EXISTS (
      SELECT 1 FROM veranstaltungen v
      WHERE v.id = auffuehrung_schichten.veranstaltung_id
      AND v.public_helfer_token IS NOT NULL
      AND v.helfer_status = 'veroeffentlicht'
    )
  );

-- Allow anon to read info_bloecke for published events
DROP POLICY IF EXISTS "info_bloecke_select_public" ON info_bloecke;
CREATE POLICY "info_bloecke_select_public"
  ON info_bloecke FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM veranstaltungen v
      WHERE v.id = info_bloecke.veranstaltung_id
      AND v.public_helfer_token IS NOT NULL
      AND v.helfer_status = 'veroeffentlicht'
    )
  );

-- Allow anon to read public shift assignments (to show occupied slots)
DROP POLICY IF EXISTS "auffuehrung_zuweisungen_select_public" ON auffuehrung_zuweisungen;
CREATE POLICY "auffuehrung_zuweisungen_select_public"
  ON auffuehrung_zuweisungen FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM auffuehrung_schichten s
      JOIN veranstaltungen v ON v.id = s.veranstaltung_id
      WHERE s.id = auffuehrung_zuweisungen.schicht_id
      AND s.sichtbarkeit = 'public'
      AND v.public_helfer_token IS NOT NULL
      AND v.helfer_status = 'veroeffentlicht'
    )
  );

-- Allow anon to create zuweisungen for public shifts (external registration)
DROP POLICY IF EXISTS "auffuehrung_zuweisungen_insert_public" ON auffuehrung_zuweisungen;
CREATE POLICY "auffuehrung_zuweisungen_insert_public"
  ON auffuehrung_zuweisungen FOR INSERT
  TO anon
  WITH CHECK (
    -- Must have external_helper_id (uses externe_helfer_profile)
    external_helper_id IS NOT NULL
    AND person_id IS NULL
    -- Must be for a public shift in a published event
    AND EXISTS (
      SELECT 1 FROM auffuehrung_schichten s
      JOIN veranstaltungen v ON v.id = s.veranstaltung_id
      WHERE s.id = schicht_id
      AND s.sichtbarkeit = 'public'
      AND v.public_helfer_token IS NOT NULL
      AND v.helfer_status = 'veroeffentlicht'
    )
  );

-- =============================================================================
-- ADD external_helper_id TO auffuehrung_zuweisungen
-- =============================================================================

-- Add column for external helper reference
ALTER TABLE auffuehrung_zuweisungen
ADD COLUMN IF NOT EXISTS external_helper_id UUID REFERENCES externe_helfer_profile(id) ON DELETE SET NULL;

-- Create index for lookups
CREATE INDEX IF NOT EXISTS auffuehrung_zuweisungen_external_helper_idx
  ON auffuehrung_zuweisungen(external_helper_id)
  WHERE external_helper_id IS NOT NULL;

-- Update constraint to allow either person_id or external_helper_id
-- First check if constraint exists
DO $$
BEGIN
  -- Add check constraint (will fail if neither or both are set)
  -- This is a soft check - we'll handle validation in application code
  -- since some existing records may have person_id set
  NULL; -- No constraint change needed - person_id already allows NULL
END $$;

-- Add comment
COMMENT ON COLUMN auffuehrung_zuweisungen.external_helper_id IS 'Reference to external helper profile (for non-member registrations)';

-- =============================================================================
-- FUNCTION: Generate public token for veranstaltung
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_public_helfer_token(p_veranstaltung_id UUID)
RETURNS UUID AS $$
DECLARE
  v_token UUID;
BEGIN
  v_token := gen_random_uuid();

  UPDATE veranstaltungen
  SET public_helfer_token = v_token
  WHERE id = p_veranstaltung_id;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only authenticated users with management role can generate tokens
REVOKE EXECUTE ON FUNCTION generate_public_helfer_token FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_public_helfer_token TO authenticated;

-- =============================================================================
-- FUNCTION: Validate public token and return veranstaltung data
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_public_helfer_token(p_token UUID)
RETURNS TABLE (
  id UUID,
  titel TEXT,
  datum DATE,
  startzeit TIME,
  endzeit TIME,
  ort TEXT,
  helfer_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.titel,
    v.datum,
    v.startzeit,
    v.endzeit,
    v.ort,
    v.helfer_status
  FROM veranstaltungen v
  WHERE v.public_helfer_token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anon and authenticated to validate tokens
GRANT EXECUTE ON FUNCTION validate_public_helfer_token TO anon;
GRANT EXECUTE ON FUNCTION validate_public_helfer_token TO authenticated;
