-- Migration: Add DSGVO Retention Policies
-- Issue: #189 - [Security] HIGH: Fehlende Retention Policies - DSGVO Art. 5(1)(e)
-- Description: Implements data retention policies with cleanup functions
-- Note: pg_cron jobs must be configured separately in Supabase Dashboard

-- =============================================================================
-- Retention configuration table
-- =============================================================================

CREATE TABLE IF NOT EXISTS retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  condition_column TEXT NOT NULL,  -- Column to check for age (e.g., 'created_at', 'archiviert_am')
  additional_condition TEXT,        -- Optional SQL condition (e.g., 'aktiv = false')
  description TEXT,
  last_run TIMESTAMPTZ,
  last_deleted_count INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;

-- Only admins can manage retention policies
CREATE POLICY "retention_policies_admin_only" ON retention_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================================================
-- Insert default retention policies
-- =============================================================================

INSERT INTO retention_policies (table_name, retention_days, condition_column, additional_condition, description)
VALUES
  -- Audit logs: 1 year (DSGVO compliance period)
  ('audit_logs', 365, 'created_at', NULL,
   'Audit-Logs werden nach 1 Jahr geloescht (DSGVO Nachweispflicht)'),

  -- Archived members: 10 years after archiving (Vereinsrecht)
  ('personen', 3650, 'archiviert_am', 'aktiv = false AND archiviert_am IS NOT NULL',
   'Archivierte Mitglieder werden 10 Jahre nach Archivierung geloescht'),

  -- Old event registrations: 3 years
  ('anmeldungen', 1095, 'created_at', NULL,
   'Veranstaltungsanmeldungen werden nach 3 Jahren geloescht'),

  -- Completed helper shifts: 3 years
  ('helferschichten', 1095, 'created_at', 'status IN (''erschienen'', ''nicht_erschienen'')',
   'Abgeschlossene Helferschichten werden nach 3 Jahren geloescht'),

  -- Availability records: 1 year after end date
  ('verfuegbarkeiten', 365, 'datum_bis', NULL,
   'Verfuegbarkeiten werden 1 Jahr nach Ablauf geloescht'),

  -- Helper waitlist entries: 90 days
  ('helfer_warteliste', 90, 'erstellt_am', 'status IN (''zugewiesen'', ''abgelehnt'')',
   'Wartelisten-Eintraege werden nach 90 Tagen geloescht')
ON CONFLICT (table_name) DO NOTHING;

-- =============================================================================
-- Generic retention cleanup function
-- =============================================================================

CREATE OR REPLACE FUNCTION execute_retention_policy(p_table_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_policy RECORD;
  v_sql TEXT;
  v_deleted_count INTEGER;
BEGIN
  -- Get the policy configuration
  SELECT * INTO v_policy
  FROM retention_policies
  WHERE table_name = p_table_name AND enabled = true;

  IF NOT FOUND THEN
    RAISE NOTICE 'No enabled retention policy found for table %', p_table_name;
    RETURN 0;
  END IF;

  -- Build the DELETE statement
  v_sql := format(
    'DELETE FROM %I WHERE %I < NOW() - INTERVAL ''%s days''',
    v_policy.table_name,
    v_policy.condition_column,
    v_policy.retention_days
  );

  -- Add additional condition if specified
  IF v_policy.additional_condition IS NOT NULL THEN
    v_sql := v_sql || ' AND ' || v_policy.additional_condition;
  END IF;

  -- Execute the delete
  EXECUTE v_sql;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Update the policy record with last run info
  UPDATE retention_policies
  SET last_run = NOW(),
      last_deleted_count = v_deleted_count
  WHERE table_name = p_table_name;

  -- Log the cleanup action
  PERFORM log_audit_event(
    'retention.cleanup',
    p_table_name,
    NULL,
    jsonb_build_object(
      'deleted_count', v_deleted_count,
      'retention_days', v_policy.retention_days,
      'condition', v_policy.additional_condition
    )
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Run all retention policies
-- =============================================================================

CREATE OR REPLACE FUNCTION run_all_retention_policies()
RETURNS TABLE(table_name TEXT, deleted_count INTEGER) AS $$
DECLARE
  v_policy RECORD;
  v_count INTEGER;
BEGIN
  FOR v_policy IN
    SELECT rp.table_name FROM retention_policies rp WHERE rp.enabled = true
  LOOP
    v_count := execute_retention_policy(v_policy.table_name);
    table_name := v_policy.table_name;
    deleted_count := v_count;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Anonymization function for DSGVO Art. 17 (Right to Erasure)
-- =============================================================================

CREATE OR REPLACE FUNCTION anonymize_person(p_person_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_hash TEXT;
BEGIN
  -- Generate anonymous identifier
  v_hash := substring(md5(p_person_id::TEXT || NOW()::TEXT) FROM 1 FOR 8);

  -- Anonymize the person record
  UPDATE personen
  SET
    vorname = 'Geloescht',
    nachname = v_hash,
    email = NULL,
    telefon = NULL,
    telefon_nummern = '[]'::JSONB,
    strasse = NULL,
    plz = NULL,
    ort = NULL,
    geburtstag = NULL,
    notizen = NULL,
    notfallkontakt_name = NULL,
    notfallkontakt_telefon = NULL,
    notfallkontakt_beziehung = NULL,
    profilbild_url = NULL,
    biografie = NULL,
    social_media = NULL,
    kontakt_notizen = NULL,
    aktiv = false,
    archiviert_am = NOW(),
    austrittsgrund = 'Datenschutz-Loeschung'
  WHERE id = p_person_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Log the anonymization
  PERFORM log_audit_event(
    'person.anonymized',
    'personen',
    p_person_id,
    jsonb_build_object('reason', 'DSGVO Art. 17 Loeschantrag')
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Soft-delete with scheduled hard-delete for profiles
-- =============================================================================

-- Add soft-delete columns to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
    ALTER TABLE profiles ADD COLUMN delete_scheduled_for TIMESTAMPTZ;
  END IF;
END $$;

-- Function to schedule profile deletion (30-day grace period)
CREATE OR REPLACE FUNCTION schedule_profile_deletion(p_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET deleted_at = NOW(),
      delete_scheduled_for = NOW() + INTERVAL '30 days'
  WHERE id = p_profile_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM log_audit_event(
    'profile.deletion_scheduled',
    'profiles',
    p_profile_id,
    jsonb_build_object('scheduled_for', NOW() + INTERVAL '30 days')
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel scheduled deletion
CREATE OR REPLACE FUNCTION cancel_profile_deletion(p_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET deleted_at = NULL,
      delete_scheduled_for = NULL
  WHERE id = p_profile_id
    AND deleted_at IS NOT NULL
    AND delete_scheduled_for > NOW();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM log_audit_event(
    'profile.deletion_cancelled',
    'profiles',
    p_profile_id,
    NULL
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute scheduled deletions
CREATE OR REPLACE FUNCTION execute_scheduled_profile_deletions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Delete profiles where grace period has passed
  WITH deleted AS (
    DELETE FROM profiles
    WHERE delete_scheduled_for IS NOT NULL
      AND delete_scheduled_for <= NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM deleted;

  IF v_count > 0 THEN
    PERFORM log_audit_event(
      'profile.deletions_executed',
      'profiles',
      NULL,
      jsonb_build_object('count', v_count)
    );
  END IF;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Grant permissions
-- =============================================================================

GRANT EXECUTE ON FUNCTION execute_retention_policy TO service_role;
GRANT EXECUTE ON FUNCTION run_all_retention_policies TO service_role;
GRANT EXECUTE ON FUNCTION anonymize_person TO service_role;
GRANT EXECUTE ON FUNCTION schedule_profile_deletion TO service_role;
GRANT EXECUTE ON FUNCTION cancel_profile_deletion TO service_role;
GRANT EXECUTE ON FUNCTION execute_scheduled_profile_deletions TO service_role;

-- =============================================================================
-- Documentation comments
-- =============================================================================

COMMENT ON TABLE retention_policies IS
  'DSGVO Art. 5(1)(e): Configuration for automatic data retention and cleanup';

COMMENT ON FUNCTION execute_retention_policy IS
  'Executes a single retention policy and deletes expired data';

COMMENT ON FUNCTION run_all_retention_policies IS
  'Runs all enabled retention policies (call via pg_cron)';

COMMENT ON FUNCTION anonymize_person IS
  'DSGVO Art. 17: Anonymizes personal data while preserving referential integrity';

COMMENT ON FUNCTION schedule_profile_deletion IS
  'Schedules profile deletion with 30-day grace period';

COMMENT ON FUNCTION execute_scheduled_profile_deletions IS
  'Executes scheduled profile deletions after grace period';

-- =============================================================================
-- pg_cron setup instructions (run in Supabase SQL Editor with service role)
-- =============================================================================

/*
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily retention cleanup at 3:00 AM UTC
SELECT cron.schedule(
  'retention-cleanup',
  '0 3 * * *',  -- Every day at 03:00 UTC
  $$SELECT run_all_retention_policies()$$
);

-- Schedule profile deletions check every hour
SELECT cron.schedule(
  'profile-deletions',
  '0 * * * *',  -- Every hour
  $$SELECT execute_scheduled_profile_deletions()$$
);
*/
