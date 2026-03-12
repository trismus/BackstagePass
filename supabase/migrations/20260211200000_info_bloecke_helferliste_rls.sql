-- =============================================================================
-- Migration: RLS Policy for info_bloecke via helfer_events
-- Created: 2026-02-11
-- Issue: US-1 (#243)
-- Description: Allow anon users to read info_bloecke when the linked
--   veranstaltung has an active helfer_event with a public_token.
--   The existing info_bloecke_select_public policy only covers the legacy
--   system (checks veranstaltungen.public_helfer_token). This adds coverage
--   for the new helferliste system.
-- =============================================================================

DROP POLICY IF EXISTS "info_bloecke_select_via_helfer_events" ON info_bloecke;
CREATE POLICY "info_bloecke_select_via_helfer_events"
  ON info_bloecke FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM helfer_events he
      WHERE he.veranstaltung_id = info_bloecke.veranstaltung_id
      AND he.public_token IS NOT NULL
      AND he.status = 'aktiv'
    )
  );
