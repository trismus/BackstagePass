-- Migration: Fix undefined is_editor_or_admin() references in proben & besetzungen RLS
-- Issue: #109
-- Description: Replace is_editor_or_admin() with is_management() in all RLS policies
--              for proben, proben_szenen, proben_teilnehmer, besetzungen, and besetzungen_historie.
--              The is_editor_or_admin() function was never defined - it should have been
--              replaced when the extended role system was introduced (migration 20260210000000).

-- =============================================================================
-- 1. Create is_editor_or_admin() as alias for is_management() for backwards compat
-- =============================================================================

-- This ensures any existing policies still work while we update them
CREATE OR REPLACE FUNCTION is_editor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_management();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_editor_or_admin IS 'Legacy alias for is_management(). Used by older migrations.';

-- =============================================================================
-- 2. Replace proben table RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Editors can insert proben" ON proben;
DROP POLICY IF EXISTS "Editors can update proben" ON proben;
DROP POLICY IF EXISTS "Editors can delete proben" ON proben;

CREATE POLICY "Management can insert proben"
  ON proben FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update proben"
  ON proben FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete proben"
  ON proben FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- 3. Replace proben_szenen table RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Editors can insert proben_szenen" ON proben_szenen;
DROP POLICY IF EXISTS "Editors can update proben_szenen" ON proben_szenen;
DROP POLICY IF EXISTS "Editors can delete proben_szenen" ON proben_szenen;

CREATE POLICY "Management can insert proben_szenen"
  ON proben_szenen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update proben_szenen"
  ON proben_szenen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete proben_szenen"
  ON proben_szenen FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- 4. Replace proben_teilnehmer table RLS policies (except self-update)
-- =============================================================================

DROP POLICY IF EXISTS "Editors can insert proben_teilnehmer" ON proben_teilnehmer;
DROP POLICY IF EXISTS "Editors can update proben_teilnehmer" ON proben_teilnehmer;
DROP POLICY IF EXISTS "Editors can delete proben_teilnehmer" ON proben_teilnehmer;

CREATE POLICY "Management can insert proben_teilnehmer"
  ON proben_teilnehmer FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update proben_teilnehmer"
  ON proben_teilnehmer FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete proben_teilnehmer"
  ON proben_teilnehmer FOR DELETE
  TO authenticated
  USING (is_management());

-- Note: "Users can update own teilnehmer status" policy remains unchanged
-- (already fixed in migration 20260227200000_fix_rls_email_match.sql)

-- =============================================================================
-- 5. Replace besetzungen table RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Editors can insert besetzungen" ON besetzungen;
DROP POLICY IF EXISTS "Editors can update besetzungen" ON besetzungen;
DROP POLICY IF EXISTS "Editors can delete besetzungen" ON besetzungen;

CREATE POLICY "Management can insert besetzungen"
  ON besetzungen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update besetzungen"
  ON besetzungen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete besetzungen"
  ON besetzungen FOR DELETE
  TO authenticated
  USING (is_management());
