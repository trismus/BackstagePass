-- Migration: Mitglieder-Archivierung (Issue #5)
-- Adds archiving functionality for inactive members

-- ============================================================================
-- Archive Fields
-- ============================================================================

-- Add archiviert_am timestamp for soft-delete tracking
ALTER TABLE personen ADD COLUMN IF NOT EXISTS archiviert_am TIMESTAMPTZ;

-- Add archiviert_von to track who archived the member
ALTER TABLE personen ADD COLUMN IF NOT EXISTS archiviert_von UUID REFERENCES profiles(id);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Index for filtering archived/active members
CREATE INDEX IF NOT EXISTS idx_personen_archiviert ON personen(archiviert_am);

-- Partial index for active members (most common query)
CREATE INDEX IF NOT EXISTS idx_personen_aktiv ON personen(aktiv) WHERE aktiv = true;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to archive a member
CREATE OR REPLACE FUNCTION archive_mitglied(
  p_person_id UUID,
  p_austrittsgrund TEXT DEFAULT NULL,
  p_archiviert_von UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE personen
  SET
    aktiv = false,
    archiviert_am = now(),
    archiviert_von = p_archiviert_von,
    austrittsdatum = COALESCE(austrittsdatum, CURRENT_DATE::text),
    austrittsgrund = COALESCE(austrittsgrund, p_austrittsgrund)
  WHERE id = p_person_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reactivate an archived member
CREATE OR REPLACE FUNCTION reactivate_mitglied(
  p_person_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE personen
  SET
    aktiv = true,
    archiviert_am = NULL,
    archiviert_von = NULL
    -- Note: We keep austrittsdatum and grund for history
  WHERE id = p_person_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- View for Archive Statistics
-- ============================================================================

CREATE OR REPLACE VIEW mitglieder_statistik AS
SELECT
  COUNT(*) FILTER (WHERE aktiv = true) as aktive_mitglieder,
  COUNT(*) FILTER (WHERE aktiv = false AND archiviert_am IS NOT NULL) as archivierte_mitglieder,
  COUNT(*) FILTER (WHERE aktiv = false AND archiviert_am IS NULL) as inaktive_mitglieder,
  COUNT(*) as gesamt
FROM personen;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN personen.archiviert_am IS 'Timestamp when member was archived (soft-deleted)';
COMMENT ON COLUMN personen.archiviert_von IS 'User who archived this member';
COMMENT ON FUNCTION archive_mitglied IS 'Archives a member with optional reason';
COMMENT ON FUNCTION reactivate_mitglied IS 'Reactivates an archived member';
COMMENT ON VIEW mitglieder_statistik IS 'Statistics about active/archived members';
