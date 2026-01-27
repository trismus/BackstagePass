-- Migration: Fix RLS policies for auffuehrung_zuweisungen and add atomic reorder function
-- Created: 2026-01-27
-- Description: Security fix for K-2 and K-3 from code review
-- Note: This migration is idempotent (can be run multiple times safely)
-- DEFENSIVE: All operations wrapped in conditionals to handle missing tables

-- =============================================================================
-- Helper functions (created regardless of table existence)
-- =============================================================================

-- Helper function to check if user owns the person record
-- Note: is_management() is defined in 20260210000000_extended_roles.sql
CREATE OR REPLACE FUNCTION is_own_person(p_person_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM personen
    WHERE id = p_person_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FIX K-2: Restrictive RLS Policies for auffuehrung_zuweisungen
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auffuehrung_zuweisungen') THEN
    -- Drop existing permissive policies
    DROP POLICY IF EXISTS "auffuehrung_zuweisungen_insert" ON auffuehrung_zuweisungen;
    DROP POLICY IF EXISTS "auffuehrung_zuweisungen_update" ON auffuehrung_zuweisungen;
    DROP POLICY IF EXISTS "auffuehrung_zuweisungen_delete" ON auffuehrung_zuweisungen;

    -- Policy: Users can only assign themselves OR management can assign anyone
    CREATE POLICY "auffuehrung_zuweisungen_insert"
      ON auffuehrung_zuweisungen FOR INSERT
      TO authenticated
      WITH CHECK (
        is_own_person(person_id) OR is_management()
      );

    -- Policy: Users can update own assignments OR management can update any
    CREATE POLICY "auffuehrung_zuweisungen_update"
      ON auffuehrung_zuweisungen FOR UPDATE
      TO authenticated
      USING (
        is_own_person(person_id) OR is_management()
      );

    -- Policy: Users can delete own assignments OR management can delete any
    CREATE POLICY "auffuehrung_zuweisungen_delete"
      ON auffuehrung_zuweisungen FOR DELETE
      TO authenticated
      USING (
        is_own_person(person_id) OR is_management()
      );
  END IF;
END $$;

-- =============================================================================
-- FIX K-3: Atomic Reorder Function for Zeitblöcke
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'zeitbloecke') THEN
    -- Drop existing function if it exists
    DROP FUNCTION IF EXISTS reorder_zeitbloecke(UUID, UUID[]);

    -- Create atomic reorder function
    CREATE FUNCTION reorder_zeitbloecke(
      p_veranstaltung_id UUID,
      p_ordered_ids UUID[]
    )
    RETURNS BOOLEAN AS $func$
    DECLARE
      v_id UUID;
      v_index INTEGER := 0;
    BEGIN
      -- Check if user has permission (management role)
      IF NOT is_management() THEN
        RAISE EXCEPTION 'Insufficient permissions';
      END IF;

      -- Verify all IDs belong to the specified veranstaltung
      IF EXISTS (
        SELECT 1 FROM unnest(p_ordered_ids) AS id
        WHERE id NOT IN (
          SELECT z.id FROM zeitbloecke z
          WHERE z.veranstaltung_id = p_veranstaltung_id
        )
      ) THEN
        RAISE EXCEPTION 'Invalid zeitblock IDs for this veranstaltung';
      END IF;

      -- Update all sortierung values in a single transaction
      FOREACH v_id IN ARRAY p_ordered_ids
      LOOP
        UPDATE zeitbloecke
        SET sortierung = v_index
        WHERE id = v_id;

        v_index := v_index + 1;
      END LOOP;

      RETURN TRUE;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION reorder_zeitbloecke(UUID, UUID[]) TO authenticated;
  END IF;
END $$;
