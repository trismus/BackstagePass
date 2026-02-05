-- Migration: Waitlist Notifications
-- Created: 2026-02-05
-- Issue: #223
-- Description: Extend waitlist system with confirmation tokens and deadlines

-- =============================================================================
-- ADD: confirmation columns to helfer_warteliste
-- =============================================================================

ALTER TABLE helfer_warteliste
ADD COLUMN IF NOT EXISTS confirmation_token UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS antwort_deadline TIMESTAMPTZ;

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS helfer_warteliste_confirmation_token_idx
  ON helfer_warteliste(confirmation_token);

-- Create index for deadline checking
CREATE INDEX IF NOT EXISTS helfer_warteliste_deadline_idx
  ON helfer_warteliste(antwort_deadline)
  WHERE status = 'benachrichtigt' AND antwort_deadline IS NOT NULL;

-- =============================================================================
-- VIEW: Expired waitlist notifications (timed out)
-- =============================================================================

CREATE OR REPLACE VIEW expired_waitlist_notifications AS
SELECT
  w.id,
  w.schicht_id,
  w.profile_id,
  w.external_helper_id,
  w.confirmation_token,
  w.antwort_deadline,
  w.benachrichtigt_am,
  s.rolle,
  s.veranstaltung_id,
  v.titel AS veranstaltung_titel,
  COALESCE(p.email, e.email) AS email,
  COALESCE(p.display_name, e.vorname || ' ' || e.nachname) AS name
FROM helfer_warteliste w
JOIN auffuehrung_schichten s ON s.id = w.schicht_id
JOIN veranstaltungen v ON v.id = s.veranstaltung_id
LEFT JOIN profiles p ON p.id = w.profile_id
LEFT JOIN externe_helfer_profile e ON e.id = w.external_helper_id
WHERE
  w.status = 'benachrichtigt'
  AND w.antwort_deadline IS NOT NULL
  AND w.antwort_deadline < NOW();

GRANT SELECT ON expired_waitlist_notifications TO authenticated;

-- =============================================================================
-- Policy: Allow anonymous confirmation/rejection via token
-- =============================================================================

-- Policy for anonymous to read their waitlist entry by token
CREATE POLICY "warteliste_anon_select_by_token"
  ON helfer_warteliste FOR SELECT
  TO anon
  USING (confirmation_token IS NOT NULL);

-- Policy for anonymous to update status via token (confirm/reject)
CREATE POLICY "warteliste_anon_update_by_token"
  ON helfer_warteliste FOR UPDATE
  TO anon
  USING (confirmation_token IS NOT NULL)
  WITH CHECK (confirmation_token IS NOT NULL);
