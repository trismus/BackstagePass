-- Migration: Add is_active column to profiles for user enable/disable
-- Created: 2026-01-27
-- Description: Allows admins to deactivate users (Issue #89)

-- Add is_active column with default true
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON profiles(is_active);

-- Update RLS policy to prevent inactive users from logging in
-- Note: This is enforced at application level, not RLS level
-- (Supabase Auth doesn't support RLS-based login prevention)
