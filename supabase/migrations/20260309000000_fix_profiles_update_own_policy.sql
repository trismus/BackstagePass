-- Fix profiles_update_own RLS policy to prevent self-role-escalation
-- Issue #369: Users could change their own role (incl. to ADMIN) via direct Supabase client

-- Drop the existing policy
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Recreate with role-change prevention:
-- Users can update their own profile, but the role must stay unchanged
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
  );
