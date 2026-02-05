-- Migration: Add DSGVO-compliant audit triggers for personal data tables
-- Issue: #187 - [Security] HIGH: Fehlende Audit-Logging für DSGVO
-- Description: Adds audit triggers for all tables containing personal data
-- DSGVO Articles: Art. 30 (Records of processing), Art. 33 (Breach notification)

-- =============================================================================
-- Generic audit trigger function for INSERT/UPDATE/DELETE
-- =============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_old_data JSONB;
  v_new_data JSONB;
  v_changes JSONB;
BEGIN
  -- Determine the action
  v_action := TG_TABLE_NAME || '.' || LOWER(TG_OP);

  -- Build the audit details based on operation
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    -- Remove sensitive fields from logging
    v_new_data := v_new_data - 'password' - 'token';

    PERFORM log_audit_event(
      v_action,
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('new', v_new_data)
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    -- Remove sensitive fields from logging
    v_old_data := v_old_data - 'password' - 'token';
    v_new_data := v_new_data - 'password' - 'token';

    -- Build changes object (only include changed fields)
    SELECT jsonb_object_agg(key, jsonb_build_object('old', v_old_data->key, 'new', v_new_data->key))
    INTO v_changes
    FROM jsonb_object_keys(v_new_data) AS key
    WHERE v_old_data->key IS DISTINCT FROM v_new_data->key
      AND key NOT IN ('updated_at', 'created_at');

    -- Only log if there are actual changes
    IF v_changes IS NOT NULL AND v_changes != '{}' THEN
      PERFORM log_audit_event(
        v_action,
        TG_TABLE_NAME,
        NEW.id,
        jsonb_build_object('changes', v_changes)
      );
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    -- Remove sensitive fields from logging
    v_old_data := v_old_data - 'password' - 'token';

    PERFORM log_audit_event(
      v_action,
      TG_TABLE_NAME,
      OLD.id,
      jsonb_build_object('deleted', v_old_data)
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Audit triggers for personal data tables
-- =============================================================================

-- 1. personen - Member data (DSGVO relevant: personal information)
DROP TRIGGER IF EXISTS audit_personen_changes ON personen;
CREATE TRIGGER audit_personen_changes
  AFTER INSERT OR UPDATE OR DELETE ON personen
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- 2. anmeldungen - Event registrations (DSGVO relevant: activity tracking)
DROP TRIGGER IF EXISTS audit_anmeldungen_changes ON anmeldungen;
CREATE TRIGGER audit_anmeldungen_changes
  AFTER INSERT OR UPDATE OR DELETE ON anmeldungen
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- 3. helferschichten - Helper shifts (DSGVO relevant: work records)
DROP TRIGGER IF EXISTS audit_helferschichten_changes ON helferschichten;
CREATE TRIGGER audit_helferschichten_changes
  AFTER INSERT OR UPDATE OR DELETE ON helferschichten
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- 4. stundenkonto - Hours account (DSGVO relevant: work records)
DROP TRIGGER IF EXISTS audit_stundenkonto_changes ON stundenkonto;
CREATE TRIGGER audit_stundenkonto_changes
  AFTER INSERT OR UPDATE OR DELETE ON stundenkonto
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- 5. verfuegbarkeiten - Availability records (DSGVO relevant: personal scheduling)
DROP TRIGGER IF EXISTS audit_verfuegbarkeiten_changes ON verfuegbarkeiten;
CREATE TRIGGER audit_verfuegbarkeiten_changes
  AFTER INSERT OR UPDATE OR DELETE ON verfuegbarkeiten
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- 6. besetzungen - Cast assignments (DSGVO relevant: role assignments)
DROP TRIGGER IF EXISTS audit_besetzungen_changes ON besetzungen;
CREATE TRIGGER audit_besetzungen_changes
  AFTER INSERT OR UPDATE OR DELETE ON besetzungen
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- 7. proben_teilnehmer - Rehearsal participants (DSGVO relevant: attendance)
DROP TRIGGER IF EXISTS audit_proben_teilnehmer_changes ON proben_teilnehmer;
CREATE TRIGGER audit_proben_teilnehmer_changes
  AFTER INSERT OR UPDATE OR DELETE ON proben_teilnehmer
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- 8. auffuehrung_zuweisungen - Performance assignments (DSGVO relevant: work records)
DROP TRIGGER IF EXISTS audit_auffuehrung_zuweisungen_changes ON auffuehrung_zuweisungen;
CREATE TRIGGER audit_auffuehrung_zuweisungen_changes
  AFTER INSERT OR UPDATE OR DELETE ON auffuehrung_zuweisungen
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- 9. helfer_anmeldungen - Helper registrations (DSGVO relevant: volunteer records)
DROP TRIGGER IF EXISTS audit_helfer_anmeldungen_changes ON helfer_anmeldungen;
CREATE TRIGGER audit_helfer_anmeldungen_changes
  AFTER INSERT OR UPDATE OR DELETE ON helfer_anmeldungen
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- 10. externe_helfer_profile - External helper profiles (DSGVO relevant: external contacts)
DROP TRIGGER IF EXISTS audit_externe_helfer_profile_changes ON externe_helfer_profile;
CREATE TRIGGER audit_externe_helfer_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON externe_helfer_profile
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- =============================================================================
-- Add index for faster audit log queries by entity
-- =============================================================================

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS audit_logs_user_action_idx
  ON audit_logs(user_id, action);

-- =============================================================================
-- Add retention policy helper function (for future cleanup jobs)
-- =============================================================================

CREATE OR REPLACE FUNCTION delete_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the cleanup itself
  PERFORM log_audit_event(
    'audit_logs.cleanup',
    'audit_logs',
    NULL,
    jsonb_build_object('deleted_count', deleted_count, 'retention_days', retention_days)
  );

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role for scheduled cleanup
GRANT EXECUTE ON FUNCTION delete_old_audit_logs TO service_role;

COMMENT ON FUNCTION delete_old_audit_logs IS
  'DSGVO Art. 5(1)(e): Deletes audit logs older than retention_days (default 365 days)';
