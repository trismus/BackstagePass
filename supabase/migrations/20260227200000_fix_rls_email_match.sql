-- Migration: Fix RLS Policy Email Match
-- Issue: #109
-- Description: Replace fragile email-based joins with stable profile_id FK

-- =============================================================================
-- 1. Add profile_id column to personen table
-- =============================================================================

ALTER TABLE personen ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_personen_profile_id ON personen(profile_id);

-- =============================================================================
-- 2. Migrate existing data: link personen to profiles via email match
-- =============================================================================

UPDATE personen p
SET profile_id = pr.id
FROM profiles pr
WHERE p.email = pr.email
  AND p.profile_id IS NULL
  AND p.email IS NOT NULL;

-- =============================================================================
-- 3. Create helper function to get current user's person_id
-- =============================================================================

CREATE OR REPLACE FUNCTION get_current_person_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM personen
    WHERE profile_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- 4. Update RLS Policy for proben_teilnehmer
-- =============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can update own teilnehmer status" ON proben_teilnehmer;

-- Create new policy using profile_id
CREATE POLICY "Users can update own teilnehmer status"
  ON proben_teilnehmer FOR UPDATE
  TO authenticated
  USING (
    person_id IN (
      SELECT id FROM personen WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    person_id IN (
      SELECT id FROM personen WHERE profile_id = auth.uid()
    )
  );

-- =============================================================================
-- 5. Update RLS Policies for stundenkonto (if exists)
-- =============================================================================

DO $$
BEGIN
  -- Drop old policy if exists
  DROP POLICY IF EXISTS "Users can view own stundenkonto" ON stundenkonto;

  -- Create new policy using profile_id
  CREATE POLICY "Users can view own stundenkonto"
    ON stundenkonto FOR SELECT
    TO authenticated
    USING (
      is_management()
      OR person_id IN (SELECT id FROM personen WHERE profile_id = auth.uid())
    );
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- stundenkonto table doesn't exist, skip
END $$;

-- =============================================================================
-- 6. Update personen RLS to allow users to see/edit their own record
-- =============================================================================

-- Drop old policy if exists
DROP POLICY IF EXISTS "Users can view own person" ON personen;
DROP POLICY IF EXISTS "Users can update own person" ON personen;

-- Users can view their own person record
CREATE POLICY "Users can view own person"
  ON personen FOR SELECT
  TO authenticated
  USING (
    is_management()
    OR profile_id = auth.uid()
  );

-- Users can update their own person record (limited fields via app logic)
CREATE POLICY "Users can update own person"
  ON personen FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- =============================================================================
-- 7. Create trigger to auto-link new profiles to existing personen
-- =============================================================================

CREATE OR REPLACE FUNCTION link_profile_to_person()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new profile is created, try to link it to existing person with same email
  UPDATE personen
  SET profile_id = NEW.id
  WHERE email = NEW.email
    AND profile_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_profile_created_link_person ON profiles;
CREATE TRIGGER on_profile_created_link_person
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_profile_to_person();

-- Also trigger on email update
DROP TRIGGER IF EXISTS on_profile_email_updated_link_person ON profiles;
CREATE TRIGGER on_profile_email_updated_link_person
  AFTER UPDATE OF email ON profiles
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION link_profile_to_person();
