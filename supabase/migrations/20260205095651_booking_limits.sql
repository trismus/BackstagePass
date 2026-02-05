-- Migration: Booking Limits for Helper Registration
-- Created: 2026-02-05
-- Issue: #210
-- Description: Add booking limits and deadline configuration to veranstaltungen

-- =============================================================================
-- ALTER: Add booking limit columns to veranstaltungen
-- =============================================================================

-- Add max_schichten_pro_helfer column (default 3)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'veranstaltungen'
    AND column_name = 'max_schichten_pro_helfer'
  ) THEN
    ALTER TABLE veranstaltungen
    ADD COLUMN max_schichten_pro_helfer INTEGER DEFAULT 3;

    COMMENT ON COLUMN veranstaltungen.max_schichten_pro_helfer IS
      'Maximum number of shifts a helper can book for this event. NULL = unlimited.';
  END IF;
END $$;

-- Add helfer_buchung_deadline column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'veranstaltungen'
    AND column_name = 'helfer_buchung_deadline'
  ) THEN
    ALTER TABLE veranstaltungen
    ADD COLUMN helfer_buchung_deadline TIMESTAMPTZ;

    COMMENT ON COLUMN veranstaltungen.helfer_buchung_deadline IS
      'Deadline for helper registrations. After this time, no new registrations are allowed.';
  END IF;
END $$;

-- Add helfer_buchung_limit_aktiv column (to enable/disable the limit)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'veranstaltungen'
    AND column_name = 'helfer_buchung_limit_aktiv'
  ) THEN
    ALTER TABLE veranstaltungen
    ADD COLUMN helfer_buchung_limit_aktiv BOOLEAN DEFAULT false;

    COMMENT ON COLUMN veranstaltungen.helfer_buchung_limit_aktiv IS
      'Whether the booking limit is enforced for this event.';
  END IF;
END $$;

-- =============================================================================
-- Create indexes for common queries
-- =============================================================================

CREATE INDEX IF NOT EXISTS veranstaltungen_helfer_deadline_idx
  ON veranstaltungen(helfer_buchung_deadline)
  WHERE helfer_buchung_deadline IS NOT NULL;
