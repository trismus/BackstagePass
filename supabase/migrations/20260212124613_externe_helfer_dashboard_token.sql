-- =============================================================================
-- Migration: dashboard_token for externe_helfer_profile
-- Created: 2026-02-12
-- Issue: US-8
-- Description: Add dashboard_token to externe_helfer_profile for public
--   dashboard access links in confirmation emails.
--   - Add dashboard_token column with auto-generation
--   - Backfill existing profiles
--   - Add SECURITY DEFINER function for anon-safe lookup
-- =============================================================================

-- =============================================================================
-- ADD COLUMN
-- =============================================================================

ALTER TABLE externe_helfer_profile
  ADD COLUMN IF NOT EXISTS dashboard_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Backfill existing profiles
UPDATE externe_helfer_profile
SET dashboard_token = gen_random_uuid()
WHERE dashboard_token IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE externe_helfer_profile
  ALTER COLUMN dashboard_token SET NOT NULL;

COMMENT ON COLUMN externe_helfer_profile.dashboard_token IS
  'Token for public dashboard access. Used in /helfer/meine-einsaetze/[token] URL.';

-- =============================================================================
-- SECURITY DEFINER FUNCTION: get_externe_helfer_dashboard_token
-- =============================================================================

CREATE OR REPLACE FUNCTION get_externe_helfer_dashboard_token(p_helper_id UUID)
RETURNS UUID AS $$
  SELECT dashboard_token FROM externe_helfer_profile WHERE id = p_helper_id;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_externe_helfer_dashboard_token TO anon;
GRANT EXECUTE ON FUNCTION get_externe_helfer_dashboard_token TO authenticated;
