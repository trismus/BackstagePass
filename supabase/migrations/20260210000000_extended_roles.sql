-- Migration: Extended User Roles System
-- Created: 2026-02-10
-- Issue: #108
-- Description: Extend role system from 3 generic roles to 7 theater-specific roles
--
-- New roles:
--   ADMIN          - System administrator (full access)
--   VORSTAND       - Board/Committee (all operational modules)
--   MITGLIED_AKTIV - Active member (own data, registrations, hours)
--   MITGLIED_PASSIV- Passive member (own profile, public info)
--   HELFER         - Helper (assigned shifts only)
--   PARTNER        - Partner organization (own partner data)
--   FREUNDE        - Friends (public info only)
--
-- Migration mapping:
--   ADMIN  -> ADMIN
--   EDITOR -> VORSTAND
--   VIEWER -> MITGLIED_AKTIV

-- =============================================================================
-- 1. Helper Functions for RLS (SECURITY DEFINER to avoid recursion)
-- =============================================================================

-- Get current user's role (bypasses RLS)
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

-- Check if user has one of the required roles
CREATE OR REPLACE FUNCTION has_role_permission(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin (keep for backward compatibility)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin or vorstand (management level)
CREATE OR REPLACE FUNCTION is_management()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('ADMIN', 'VORSTAND');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- 2. Alter profiles table constraint
-- =============================================================================

-- Drop existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with extended roles
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

-- =============================================================================
-- 3. Migrate existing users
-- =============================================================================

-- EDITOR -> VORSTAND (board members / operational staff)
UPDATE profiles
SET role = 'VORSTAND'
WHERE role = 'EDITOR';

-- VIEWER -> MITGLIED_AKTIV (active members)
UPDATE profiles
SET role = 'MITGLIED_AKTIV'
WHERE role = 'VIEWER';

-- ADMIN stays ADMIN (no change needed)

-- =============================================================================
-- 4. Update handle_new_user function (default to MITGLIED_PASSIV)
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'MITGLIED_PASSIV'  -- New default: passive member until activated
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- =============================================================================
-- 5. Update profiles RLS policies for new roles
-- =============================================================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (is_admin());

-- Admins can update any profile (for role changes)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Vorstand can read all profiles (for member management)
CREATE POLICY "profiles_select_vorstand"
  ON profiles FOR SELECT
  USING (get_user_role() = 'VORSTAND');

-- =============================================================================
-- 6. Add index for role queries
-- =============================================================================

-- Index already exists from original migration, just ensure it's there
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
