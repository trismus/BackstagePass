-- Migration: Helfer Warteliste (Waitlist System)
-- Created: 2026-02-05
-- Issue: #211
-- Description: Waitlist system for overbooked shifts
--   - Track waitlist position
--   - Auto-assign when slot becomes free
--   - Notification tracking

-- =============================================================================
-- TABLE: helfer_warteliste
-- =============================================================================

CREATE TABLE IF NOT EXISTS helfer_warteliste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schicht_id UUID NOT NULL REFERENCES auffuehrung_schichten(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- NULL for external helpers
  external_helper_id UUID REFERENCES externe_helfer_profile(id) ON DELETE SET NULL,  -- NULL for internal helpers
  position INTEGER NOT NULL,  -- auto-assigned based on registration order
  erstellt_am TIMESTAMPTZ DEFAULT NOW(),
  benachrichtigt_am TIMESTAMPTZ,  -- when helper was notified about free slot
  status TEXT DEFAULT 'wartend' CHECK (status IN ('wartend', 'benachrichtigt', 'zugewiesen', 'abgelehnt')),

  -- Constraint: must be either internal (profile_id) or external (external_helper_id)
  CONSTRAINT internal_or_external CHECK (
    (profile_id IS NOT NULL AND external_helper_id IS NULL) OR
    (profile_id IS NULL AND external_helper_id IS NOT NULL)
  ),

  -- Unique constraint: one person can only be on waitlist once per schicht
  CONSTRAINT unique_waitlist_entry UNIQUE (schicht_id, profile_id),
  CONSTRAINT unique_waitlist_entry_external UNIQUE (schicht_id, external_helper_id)
);

-- Enable Row Level Security
ALTER TABLE helfer_warteliste ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "warteliste_select_management" ON helfer_warteliste;
DROP POLICY IF EXISTS "warteliste_select_own" ON helfer_warteliste;
DROP POLICY IF EXISTS "warteliste_insert" ON helfer_warteliste;
DROP POLICY IF EXISTS "warteliste_update" ON helfer_warteliste;
DROP POLICY IF EXISTS "warteliste_delete" ON helfer_warteliste;
DROP POLICY IF EXISTS "warteliste_delete_own" ON helfer_warteliste;

-- Policy: Management can see all waitlist entries
CREATE POLICY "warteliste_select_management"
  ON helfer_warteliste FOR SELECT
  TO authenticated
  USING (is_management());

-- Policy: Users can see their own waitlist entries
CREATE POLICY "warteliste_select_own"
  ON helfer_warteliste FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Policy: Authenticated users can add themselves to waitlist
CREATE POLICY "warteliste_insert"
  ON helfer_warteliste FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid() OR
    is_management()
  );

-- Policy: Management can update any waitlist entry
CREATE POLICY "warteliste_update"
  ON helfer_warteliste FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- Policy: Management can delete any waitlist entry
CREATE POLICY "warteliste_delete"
  ON helfer_warteliste FOR DELETE
  TO authenticated
  USING (is_management());

-- Policy: Users can remove themselves from waitlist
CREATE POLICY "warteliste_delete_own"
  ON helfer_warteliste FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS helfer_warteliste_schicht_idx ON helfer_warteliste(schicht_id);
CREATE INDEX IF NOT EXISTS helfer_warteliste_profile_idx ON helfer_warteliste(profile_id);
CREATE INDEX IF NOT EXISTS helfer_warteliste_external_idx ON helfer_warteliste(external_helper_id);
CREATE INDEX IF NOT EXISTS helfer_warteliste_position_idx ON helfer_warteliste(schicht_id, position);
CREATE INDEX IF NOT EXISTS helfer_warteliste_status_idx ON helfer_warteliste(status);

-- =============================================================================
-- Function to get next waitlist position
-- =============================================================================

CREATE OR REPLACE FUNCTION get_next_waitlist_position(p_schicht_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_max_position INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0) INTO v_max_position
  FROM helfer_warteliste
  WHERE schicht_id = p_schicht_id;

  RETURN v_max_position + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_waitlist_position TO authenticated;

-- =============================================================================
-- Function to process waitlist when a slot becomes free
-- This function should be called when someone unregisters from a shift
-- =============================================================================

CREATE OR REPLACE FUNCTION process_waitlist_on_unregister()
RETURNS TRIGGER AS $$
DECLARE
  v_schicht_id UUID;
  v_anzahl_benoetigt INTEGER;
  v_current_count INTEGER;
  v_next_waiter RECORD;
  v_person_id UUID;
BEGIN
  -- Only process on DELETE (unregistration)
  IF TG_OP = 'DELETE' THEN
    v_schicht_id := OLD.schicht_id;

    -- Get schicht info
    SELECT anzahl_benoetigt INTO v_anzahl_benoetigt
    FROM auffuehrung_schichten
    WHERE id = v_schicht_id;

    -- Count current active zuweisungen
    SELECT COUNT(*) INTO v_current_count
    FROM auffuehrung_zuweisungen
    WHERE schicht_id = v_schicht_id
    AND status != 'abgesagt';

    -- If there's space now, process waitlist
    IF v_current_count < v_anzahl_benoetigt THEN
      -- Get next person on waitlist
      SELECT * INTO v_next_waiter
      FROM helfer_warteliste
      WHERE schicht_id = v_schicht_id
      AND status = 'wartend'
      ORDER BY position ASC
      LIMIT 1;

      IF v_next_waiter IS NOT NULL THEN
        -- Get person_id from profile
        IF v_next_waiter.profile_id IS NOT NULL THEN
          SELECT p.id INTO v_person_id
          FROM personen p
          JOIN profiles pr ON pr.email = p.email
          WHERE pr.id = v_next_waiter.profile_id;
        END IF;

        -- If we have a person_id, create the zuweisung
        IF v_person_id IS NOT NULL THEN
          INSERT INTO auffuehrung_zuweisungen (schicht_id, person_id, status)
          VALUES (v_schicht_id, v_person_id, 'zugesagt');

          -- Update waitlist entry
          UPDATE helfer_warteliste
          SET status = 'zugewiesen',
              benachrichtigt_am = NOW()
          WHERE id = v_next_waiter.id;
        ELSE
          -- Just mark as benachrichtigt if we can't auto-assign
          UPDATE helfer_warteliste
          SET status = 'benachrichtigt',
              benachrichtigt_am = NOW()
          WHERE id = v_next_waiter.id;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic waitlist processing
DROP TRIGGER IF EXISTS process_waitlist_trigger ON auffuehrung_zuweisungen;
CREATE TRIGGER process_waitlist_trigger
  AFTER DELETE ON auffuehrung_zuweisungen
  FOR EACH ROW
  EXECUTE FUNCTION process_waitlist_on_unregister();

-- =============================================================================
-- Helpful view for waitlist statistics
-- =============================================================================

CREATE OR REPLACE VIEW waitlist_statistics AS
SELECT
  s.id AS schicht_id,
  s.rolle,
  s.anzahl_benoetigt,
  (SELECT COUNT(*) FROM auffuehrung_zuweisungen z
   WHERE z.schicht_id = s.id AND z.status != 'abgesagt') AS besetzt,
  (SELECT COUNT(*) FROM helfer_warteliste w
   WHERE w.schicht_id = s.id AND w.status = 'wartend') AS auf_warteliste
FROM auffuehrung_schichten s;
