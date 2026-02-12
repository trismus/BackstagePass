-- =============================================================================
-- Migration: max_anmeldungen_pro_helfer for helfer_events
-- Created: 2026-02-12
-- Description: Optional limit on how many roles a single helper can register
--   for per event. NULL = unlimited.
-- =============================================================================

ALTER TABLE helfer_events
  ADD COLUMN IF NOT EXISTS max_anmeldungen_pro_helfer INTEGER DEFAULT NULL;

COMMENT ON COLUMN helfer_events.max_anmeldungen_pro_helfer IS
  'Optional limit on registrations per helper per event. NULL = unlimited.';
