-- Migration: Fix link_profile_to_person trigger (Issue #325)
-- The original trigger caused nested trigger chain failures during
-- inviteUserByEmail(): auth.users INSERT → handle_new_user() → profiles INSERT
-- → link_profile_to_person() → personen UPDATE → audit_trigger → fail
-- Profile linking is now handled in application code (getUserProfile auto-link).

-- 1. Make link_profile_to_person() a permanent no-op
CREATE OR REPLACE FUNCTION link_profile_to_person()
RETURNS TRIGGER AS $$
BEGIN
  -- No-op: profile linking handled in app code (getUserProfile auto-link)
  -- to avoid nested trigger chain issues with audit system
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply invitation acceptance trigger (from einladungs_tracking migration)
-- Sets invitation_accepted_at when profile_id changes from NULL to a value
CREATE OR REPLACE FUNCTION set_invitation_accepted_at() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.profile_id IS NULL AND NEW.profile_id IS NOT NULL
     AND NEW.invited_at IS NOT NULL AND NEW.invitation_accepted_at IS NULL THEN
    NEW.invitation_accepted_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_linked_set_accepted ON personen;
CREATE TRIGGER on_profile_linked_set_accepted
  BEFORE UPDATE OF profile_id ON personen
  FOR EACH ROW EXECUTE FUNCTION set_invitation_accepted_at();

-- 3. Backfill: existing members with profile_id get timestamps from profiles.created_at
UPDATE personen p SET
  invited_at = COALESCE(p.invited_at, pr.created_at),
  invitation_accepted_at = COALESCE(p.invitation_accepted_at, pr.created_at)
FROM profiles pr
WHERE p.profile_id = pr.id AND p.profile_id IS NOT NULL AND p.invitation_accepted_at IS NULL;
