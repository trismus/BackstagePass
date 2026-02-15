-- Migration: Make person_id nullable on auffuehrung_zuweisungen
-- Created: 2026-02-15
-- Description: External helpers register with external_helper_id, not person_id.
--   The NOT NULL constraint on person_id prevented external registrations.

ALTER TABLE auffuehrung_zuweisungen ALTER COLUMN person_id DROP NOT NULL;
