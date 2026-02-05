-- Migration: Check-in System for Live Operations (M7)
-- Adds check-in tracking fields to auffuehrung_zuweisungen

-- =============================================================================
-- Add check-in fields to auffuehrung_zuweisungen
-- =============================================================================

ALTER TABLE auffuehrung_zuweisungen
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS no_show BOOLEAN DEFAULT false;

-- Add index for efficient querying of check-in status
CREATE INDEX IF NOT EXISTS idx_zuweisungen_checked_in
ON auffuehrung_zuweisungen(checked_in_at)
WHERE checked_in_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_zuweisungen_no_show
ON auffuehrung_zuweisungen(no_show)
WHERE no_show = true;

-- =============================================================================
-- RLS Policies for check-in operations
-- =============================================================================

-- Management can update check-in status
CREATE POLICY "Management can update check-in status"
ON auffuehrung_zuweisungen
FOR UPDATE
TO authenticated
USING (is_management())
WITH CHECK (is_management());

-- =============================================================================
-- Audit log trigger for check-in operations
-- =============================================================================

CREATE OR REPLACE FUNCTION log_checkin_operation()
RETURNS TRIGGER AS $$
BEGIN
  -- Log check-in
  IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      auth.uid(),
      'checkin',
      'auffuehrung_zuweisungen',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object(
        'status', NEW.status,
        'checked_in_at', NEW.checked_in_at,
        'checked_in_by', NEW.checked_in_by
      )
    );
  END IF;

  -- Log no-show marking
  IF NEW.no_show = true AND OLD.no_show = false THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      auth.uid(),
      'mark_no_show',
      'auffuehrung_zuweisungen',
      NEW.id,
      jsonb_build_object('no_show', OLD.no_show),
      jsonb_build_object('no_show', NEW.no_show)
    );
  END IF;

  -- Log check-in undo
  IF NEW.checked_in_at IS NULL AND OLD.checked_in_at IS NOT NULL THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      auth.uid(),
      'undo_checkin',
      'auffuehrung_zuweisungen',
      NEW.id,
      jsonb_build_object(
        'checked_in_at', OLD.checked_in_at,
        'checked_in_by', OLD.checked_in_by
      ),
      jsonb_build_object('checked_in_at', null)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for check-in audit logging
DROP TRIGGER IF EXISTS checkin_audit_trigger ON auffuehrung_zuweisungen;
CREATE TRIGGER checkin_audit_trigger
AFTER UPDATE ON auffuehrung_zuweisungen
FOR EACH ROW
WHEN (
  OLD.checked_in_at IS DISTINCT FROM NEW.checked_in_at OR
  OLD.no_show IS DISTINCT FROM NEW.no_show
)
EXECUTE FUNCTION log_checkin_operation();

-- =============================================================================
-- Ersatz-Zuweisung (Replacement Assignment) tracking
-- =============================================================================

-- Add replacement reference to track who was replaced
ALTER TABLE auffuehrung_zuweisungen
ADD COLUMN IF NOT EXISTS ersetzt_zuweisung_id UUID REFERENCES auffuehrung_zuweisungen(id),
ADD COLUMN IF NOT EXISTS ersatz_grund TEXT;

-- Index for finding replacements
CREATE INDEX IF NOT EXISTS idx_zuweisungen_ersetzt
ON auffuehrung_zuweisungen(ersetzt_zuweisung_id)
WHERE ersetzt_zuweisung_id IS NOT NULL;

COMMENT ON COLUMN auffuehrung_zuweisungen.checked_in_at IS 'Timestamp when helper checked in';
COMMENT ON COLUMN auffuehrung_zuweisungen.checked_in_by IS 'Profile ID of coordinator who performed check-in';
COMMENT ON COLUMN auffuehrung_zuweisungen.no_show IS 'True if helper did not show up';
COMMENT ON COLUMN auffuehrung_zuweisungen.ersetzt_zuweisung_id IS 'Reference to original assignment this is replacing';
COMMENT ON COLUMN auffuehrung_zuweisungen.ersatz_grund IS 'Reason for replacement (e.g., no_show, illness)';
