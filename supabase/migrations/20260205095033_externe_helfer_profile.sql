-- Migration: Externe Helfer Profile
-- Created: 2026-02-05
-- Issue: #208
-- Description: Profile system for external helpers (without login accounts)
--   - Track external helpers across multiple events via email
--   - Store contact information for recurring helpers
--   - Extend helfer_anmeldungen with external_helper_id FK

-- =============================================================================
-- TABLE: externe_helfer_profile
-- =============================================================================

CREATE TABLE IF NOT EXISTS externe_helfer_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  telefon TEXT,
  notizen TEXT,  -- internal notes for management
  erstellt_am TIMESTAMPTZ DEFAULT NOW(),
  letzter_einsatz TIMESTAMPTZ  -- updated on each registration
);

-- Create unique index on lowercase email for case-insensitive matching
CREATE UNIQUE INDEX IF NOT EXISTS externe_helfer_profile_email_lower_idx
  ON externe_helfer_profile(LOWER(email));

-- Create index for sorting by last activity
CREATE INDEX IF NOT EXISTS externe_helfer_profile_letzter_einsatz_idx
  ON externe_helfer_profile(letzter_einsatz DESC NULLS LAST);

-- Enable Row Level Security
ALTER TABLE externe_helfer_profile ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "externe_helfer_select_management" ON externe_helfer_profile;
DROP POLICY IF EXISTS "externe_helfer_insert_management" ON externe_helfer_profile;
DROP POLICY IF EXISTS "externe_helfer_insert_anon" ON externe_helfer_profile;
DROP POLICY IF EXISTS "externe_helfer_update_management" ON externe_helfer_profile;
DROP POLICY IF EXISTS "externe_helfer_delete_admin" ON externe_helfer_profile;

-- Policy: Management can view all external helper profiles
CREATE POLICY "externe_helfer_select_management"
  ON externe_helfer_profile FOR SELECT
  TO authenticated
  USING (is_management());

-- Policy: Management can create external helper profiles
CREATE POLICY "externe_helfer_insert_management"
  ON externe_helfer_profile FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

-- Policy: Anonymous users can create profiles (for public registration)
CREATE POLICY "externe_helfer_insert_anon"
  ON externe_helfer_profile FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Management can update external helper profiles
CREATE POLICY "externe_helfer_update_management"
  ON externe_helfer_profile FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- Policy: Only admin can delete external helper profiles
CREATE POLICY "externe_helfer_delete_admin"
  ON externe_helfer_profile FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- ALTER: Add external_helper_id to helfer_anmeldungen
-- =============================================================================

-- Add column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'helfer_anmeldungen'
    AND column_name = 'external_helper_id'
  ) THEN
    ALTER TABLE helfer_anmeldungen
    ADD COLUMN external_helper_id UUID REFERENCES externe_helfer_profile(id) ON DELETE SET NULL;

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS helfer_anmeldungen_external_helper_idx
      ON helfer_anmeldungen(external_helper_id);
  END IF;
END $$;

-- Update constraint to allow either profile_id, external_helper_id, or external_name
-- First drop the old constraint
ALTER TABLE helfer_anmeldungen
DROP CONSTRAINT IF EXISTS internal_or_external;

-- Add new constraint that supports external_helper_id
ALTER TABLE helfer_anmeldungen
ADD CONSTRAINT internal_or_external_or_profile CHECK (
  -- Internal user with profile_id
  (profile_id IS NOT NULL AND external_name IS NULL AND external_helper_id IS NULL) OR
  -- External with inline name (legacy)
  (profile_id IS NULL AND external_name IS NOT NULL AND external_helper_id IS NULL) OR
  -- External with profile reference
  (profile_id IS NULL AND external_name IS NULL AND external_helper_id IS NOT NULL)
);

-- =============================================================================
-- Function to find or create external helper profile
-- =============================================================================

CREATE OR REPLACE FUNCTION find_or_create_external_helper(
  p_email TEXT,
  p_vorname TEXT,
  p_nachname TEXT,
  p_telefon TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_helper_id UUID;
  v_email_lower TEXT;
BEGIN
  -- Normalize email to lowercase
  v_email_lower := LOWER(TRIM(p_email));

  -- Try to find existing profile
  SELECT id INTO v_helper_id
  FROM externe_helfer_profile
  WHERE LOWER(email) = v_email_lower;

  IF v_helper_id IS NOT NULL THEN
    -- Update existing profile if data has changed
    UPDATE externe_helfer_profile
    SET
      vorname = COALESCE(NULLIF(p_vorname, ''), vorname),
      nachname = COALESCE(NULLIF(p_nachname, ''), nachname),
      telefon = COALESCE(p_telefon, telefon),
      letzter_einsatz = NOW()
    WHERE id = v_helper_id
    AND (
      vorname IS DISTINCT FROM COALESCE(NULLIF(p_vorname, ''), vorname) OR
      nachname IS DISTINCT FROM COALESCE(NULLIF(p_nachname, ''), nachname) OR
      telefon IS DISTINCT FROM COALESCE(p_telefon, telefon)
    );

    RETURN v_helper_id;
  END IF;

  -- Create new profile
  INSERT INTO externe_helfer_profile (email, vorname, nachname, telefon, letzter_einsatz)
  VALUES (p_email, p_vorname, p_nachname, p_telefon, NOW())
  RETURNING id INTO v_helper_id;

  RETURN v_helper_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon for public registration
GRANT EXECUTE ON FUNCTION find_or_create_external_helper TO anon;
GRANT EXECUTE ON FUNCTION find_or_create_external_helper TO authenticated;
