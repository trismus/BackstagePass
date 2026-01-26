-- Migration: Create audit_logs table
-- Created: 2026-01-27
-- Description: Audit logging for all critical actions (Issue #91)
-- Note: This migration is idempotent

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON audit_logs;

-- Policy: Only admins can read audit logs
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Policy: Authenticated users can insert audit logs
CREATE POLICY "audit_logs_insert_authenticated"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Insert audit log
  INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details)
  VALUES (v_user_id, v_user_email, p_action, p_entity_type, p_entity_id, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for profile changes
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      'profile.updated',
      'profile',
      NEW.id,
      jsonb_build_object(
        'changes', jsonb_build_object(
          'display_name', CASE WHEN OLD.display_name IS DISTINCT FROM NEW.display_name
            THEN jsonb_build_object('old', OLD.display_name, 'new', NEW.display_name) END,
          'role', CASE WHEN OLD.role IS DISTINCT FROM NEW.role
            THEN jsonb_build_object('old', OLD.role, 'new', NEW.role) END
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile changes
DROP TRIGGER IF EXISTS audit_profile_changes ON profiles;
CREATE TRIGGER audit_profile_changes
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_changes();
