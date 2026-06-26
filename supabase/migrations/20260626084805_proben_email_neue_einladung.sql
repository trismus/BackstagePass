-- Migration: Add opt-out flag for "Sofort-Einladungs-Mail" on probe invitation (Issue #489)
-- Sprint 5 - Künstlerische Produktion - A4.2

ALTER TABLE benachrichtigungs_einstellungen
  ADD COLUMN IF NOT EXISTS email_neue_einladung BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN benachrichtigungs_einstellungen.email_neue_einladung IS
  'Opt-out für Sofort-Mail beim Hinzufügen zu einer Probe (Issue #489).';
