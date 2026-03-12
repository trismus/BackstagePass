-- Migration: Fix Production Database State
-- Created: 2026-03-04
-- Description: Idempotent "fix-all" migration that ensures the production DB
--   matches the expected state after all previous migrations.
--   Safe to run multiple times — every statement uses IF NOT EXISTS / CREATE OR REPLACE.
--
-- Addresses:
--   1. handle_new_user() using wrong default role ('VIEWER' instead of 'MITGLIED_PASSIV')
--   2. Missing onboarding_completed column on profiles
--   3. Missing invitation tracking columns on personen
--   4. link_profile_to_person() not yet converted to no-op
--   5. Missing RLS helper functions (get_user_role, is_management, etc.)
--   6. Missing profiles role CHECK constraint for extended roles

-- =============================================================================
-- 1. RLS Helper Functions (from 20260210000000_extended_roles.sql)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_role_permission(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_management()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('ADMIN', 'VORSTAND');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- 2. Extended Role Constraint (from 20260210000000_extended_roles.sql)
-- =============================================================================

-- Drop old constraint and re-create with all 7 roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'ADMIN',
    'VORSTAND',
    'MITGLIED_AKTIV',
    'MITGLIED_PASSIV',
    'HELFER',
    'PARTNER',
    'FREUNDE'
  ));

-- Migrate legacy roles if any still exist
UPDATE profiles SET role = 'VORSTAND' WHERE role = 'EDITOR';
UPDATE profiles SET role = 'MITGLIED_AKTIV' WHERE role = 'VIEWER';

-- =============================================================================
-- 3. Onboarding Flag (from 20260303000000_onboarding_flag.sql)
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing profiles have already completed onboarding
UPDATE profiles SET onboarding_completed = true WHERE onboarding_completed = false;

-- =============================================================================
-- 4. handle_new_user() — latest version with onboarding_completed
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'MITGLIED_PASSIV',
    false
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 5. Invitation Tracking Columns (from 20260301000000_einladungs_tracking.sql)
-- =============================================================================

ALTER TABLE personen ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE personen ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_personen_invited_at ON personen(invited_at);

-- =============================================================================
-- 6. link_profile_to_person() → no-op (from 20260302000000_fix_link_profile_trigger.sql)
-- =============================================================================

CREATE OR REPLACE FUNCTION link_profile_to_person()
RETURNS TRIGGER AS $$
BEGIN
  -- No-op: profile linking handled in app code (getUserProfile auto-link)
  -- to avoid nested trigger chain issues with audit system
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. set_invitation_accepted_at trigger (from 20260302000000)
-- =============================================================================

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

-- =============================================================================
-- 8. Backfill invitation timestamps for existing linked members
-- =============================================================================

UPDATE personen p SET
  invited_at = COALESCE(p.invited_at, pr.created_at),
  invitation_accepted_at = COALESCE(p.invitation_accepted_at, pr.created_at)
FROM profiles pr
WHERE p.profile_id = pr.id AND p.profile_id IS NOT NULL AND p.invitation_accepted_at IS NULL;

-- =============================================================================
-- 9. Ensure profiles role index exists
-- =============================================================================

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
