-- Migration: Add onboarding_completed flag to profiles
-- Created: 2026-03-03
-- Description: Track whether a user has completed the onboarding wizard
-- after their first login (Issue #328)

-- 1. Add onboarding_completed column (defaults to false for new users)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- 2. Backfill all existing profiles to true (they don't need onboarding)
UPDATE profiles SET onboarding_completed = true WHERE onboarding_completed = false;

-- 3. Update handle_new_user() to explicitly set onboarding_completed = false
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
