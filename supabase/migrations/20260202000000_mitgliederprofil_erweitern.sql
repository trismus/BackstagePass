-- Migration: Mitgliederprofil erweitern (Issue #1)
-- Adds emergency contact, profile picture, biography, membership dates, and skills

-- ============================================================================
-- Add new columns to personen table
-- ============================================================================

-- Emergency contact (Notfallkontakt)
ALTER TABLE personen ADD COLUMN IF NOT EXISTS notfallkontakt_name TEXT;
ALTER TABLE personen ADD COLUMN IF NOT EXISTS notfallkontakt_telefon TEXT;
ALTER TABLE personen ADD COLUMN IF NOT EXISTS notfallkontakt_beziehung TEXT;

-- Profile picture URL (stored in Supabase Storage)
ALTER TABLE personen ADD COLUMN IF NOT EXISTS profilbild_url TEXT;

-- Biography
ALTER TABLE personen ADD COLUMN IF NOT EXISTS biografie TEXT;

-- Membership dates
ALTER TABLE personen ADD COLUMN IF NOT EXISTS mitglied_seit DATE;
ALTER TABLE personen ADD COLUMN IF NOT EXISTS austrittsdatum DATE;
ALTER TABLE personen ADD COLUMN IF NOT EXISTS austrittsgrund TEXT;

-- Skills as JSONB array (e.g., ["Licht", "Ton", "Bühnenbau"])
ALTER TABLE personen ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- Create storage bucket for profile pictures
-- ============================================================================

-- Note: Supabase Storage bucket creation is done via Supabase Dashboard or API
-- This comment documents the required bucket configuration:
-- Bucket name: profilbilder
-- Public: false (private bucket)
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- Max file size: 5MB

-- ============================================================================
-- RLS policies for new fields
-- ============================================================================

-- Emergency contact is only visible to management (ADMIN, VORSTAND)
-- This is enforced at the application level since column-level RLS isn't available
-- The existing RLS policies on personen table apply

-- ============================================================================
-- Create index for skills search (GIN index for JSONB)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_personen_skills ON personen USING GIN (skills);

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN personen.notfallkontakt_name IS 'Name of emergency contact person';
COMMENT ON COLUMN personen.notfallkontakt_telefon IS 'Phone number of emergency contact';
COMMENT ON COLUMN personen.notfallkontakt_beziehung IS 'Relationship to emergency contact (e.g., Ehepartner, Eltern)';
COMMENT ON COLUMN personen.profilbild_url IS 'URL to profile picture in Supabase Storage';
COMMENT ON COLUMN personen.biografie IS 'Short biography or introduction text';
COMMENT ON COLUMN personen.mitglied_seit IS 'Date when person became a member';
COMMENT ON COLUMN personen.austrittsdatum IS 'Date of membership termination (null if still active)';
COMMENT ON COLUMN personen.austrittsgrund IS 'Reason for leaving the organization';
COMMENT ON COLUMN personen.skills IS 'JSON array of skills/abilities (e.g., ["Licht", "Ton"])';
