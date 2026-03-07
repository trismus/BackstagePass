-- Migration: Add koordinator_id to helfer_events
-- Allows standalone helfer_events (without veranstaltung_id) to have a coordinator contact.
-- Previously, coordinator info was only available via veranstaltungen.koordinator_id.

ALTER TABLE helfer_events
  ADD COLUMN IF NOT EXISTS koordinator_id UUID REFERENCES personen(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS helfer_events_koordinator_idx
  ON helfer_events(koordinator_id);

COMMENT ON COLUMN helfer_events.koordinator_id IS
  'Optional coordinator for this event. Used in confirmation emails for contact info. Falls back to veranstaltungen.koordinator_id if NULL.';
