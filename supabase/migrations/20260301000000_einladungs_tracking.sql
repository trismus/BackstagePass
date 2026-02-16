-- Migration: Einladungs-Tracking (Issue #325)
-- Adds invitation tracking columns to personen table

-- 1. New columns
ALTER TABLE personen ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE personen ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_personen_invited_at ON personen(invited_at);

-- 2. Trigger: set invitation_accepted_at when profile_id changes from NULL to a value
CREATE OR REPLACE FUNCTION set_invitation_accepted_at() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.profile_id IS NULL AND NEW.profile_id IS NOT NULL
     AND NEW.invited_at IS NOT NULL AND NEW.invitation_accepted_at IS NULL THEN
    NEW.invitation_accepted_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_linked_set_accepted
  BEFORE UPDATE OF profile_id ON personen
  FOR EACH ROW EXECUTE FUNCTION set_invitation_accepted_at();

-- 3. Backfill: existing members with profile_id get timestamps from profiles.created_at
UPDATE personen p SET
  invited_at = COALESCE(p.invited_at, pr.created_at),
  invitation_accepted_at = COALESCE(p.invitation_accepted_at, pr.created_at)
FROM profiles pr
WHERE p.profile_id = pr.id AND p.profile_id IS NOT NULL AND p.invitation_accepted_at IS NULL;
