-- Migration: Email Logs and Cancellation Token
-- Created: 2026-02-05
-- Issue: #221
-- Description: Add email logging, cancellation tokens, and veranstaltung public token

-- =============================================================================
-- TABLE: email_logs
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anmeldung_id UUID REFERENCES auffuehrung_zuweisungen(id) ON DELETE SET NULL,
  helfer_anmeldung_id UUID REFERENCES helfer_anmeldungen(id) ON DELETE SET NULL,
  template_typ TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see all email logs
CREATE POLICY "email_logs_admin_select"
  ON email_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy: Management can see email logs
CREATE POLICY "email_logs_management_select"
  ON email_logs FOR SELECT
  TO authenticated
  USING (is_management());

-- Create indexes
CREATE INDEX IF NOT EXISTS email_logs_status_idx ON email_logs(status);
CREATE INDEX IF NOT EXISTS email_logs_sent_at_idx ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS email_logs_anmeldung_idx ON email_logs(anmeldung_id);
CREATE INDEX IF NOT EXISTS email_logs_helfer_anmeldung_idx ON email_logs(helfer_anmeldung_id);
CREATE INDEX IF NOT EXISTS email_logs_template_typ_idx ON email_logs(template_typ);

-- =============================================================================
-- ADD: abmeldung_token to auffuehrung_zuweisungen
-- =============================================================================

ALTER TABLE auffuehrung_zuweisungen
ADD COLUMN IF NOT EXISTS abmeldung_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS auffuehrung_zuweisungen_token_idx
  ON auffuehrung_zuweisungen(abmeldung_token);

-- =============================================================================
-- ADD: public_helfer_token to veranstaltungen (for public registration links)
-- =============================================================================

ALTER TABLE veranstaltungen
ADD COLUMN IF NOT EXISTS public_helfer_token UUID UNIQUE;

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS veranstaltungen_helfer_token_idx
  ON veranstaltungen(public_helfer_token);

-- =============================================================================
-- Function: Generate token when creating a published helferliste
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_helfer_token_on_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate token when helfer_status changes to 'veroeffentlicht' and token is null
  IF NEW.helfer_status = 'veroeffentlicht' AND NEW.public_helfer_token IS NULL THEN
    NEW.public_helfer_token := gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS veranstaltungen_generate_helfer_token ON veranstaltungen;
CREATE TRIGGER veranstaltungen_generate_helfer_token
  BEFORE UPDATE ON veranstaltungen
  FOR EACH ROW
  WHEN (NEW.helfer_status IS DISTINCT FROM OLD.helfer_status)
  EXECUTE FUNCTION generate_helfer_token_on_publish();

-- =============================================================================
-- ADD: koordinator_id to veranstaltungen (for contact info in emails)
-- =============================================================================

ALTER TABLE veranstaltungen
ADD COLUMN IF NOT EXISTS koordinator_id UUID REFERENCES personen(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS veranstaltungen_koordinator_idx
  ON veranstaltungen(koordinator_id);

-- =============================================================================
-- POLICY: Allow anonymous access to veranstaltungen by public token
-- =============================================================================

-- Policy for anonymous read access to published veranstaltungen
CREATE POLICY "veranstaltungen_public_helfer_select"
  ON veranstaltungen FOR SELECT
  TO anon
  USING (
    helfer_status = 'veroeffentlicht'
    AND public_helfer_token IS NOT NULL
  );

-- =============================================================================
-- VIEW: Email statistics for admin dashboard
-- =============================================================================

CREATE OR REPLACE VIEW email_statistics AS
SELECT
  template_typ,
  status,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as date
FROM email_logs
GROUP BY template_typ, status, DATE_TRUNC('day', created_at)
ORDER BY date DESC, template_typ;
