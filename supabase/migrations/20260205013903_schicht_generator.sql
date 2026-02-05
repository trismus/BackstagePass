-- Migration: Schicht Generator Support (Issue #205)
-- Created: 2026-02-05
-- Description: Add columns to track template usage and helper status on veranstaltungen

-- =============================================================================
-- ADD COLUMNS TO veranstaltungen
-- =============================================================================

-- Add helfer_template_id to track which template was used
ALTER TABLE veranstaltungen
ADD COLUMN IF NOT EXISTS helfer_template_id UUID REFERENCES auffuehrung_templates(id) ON DELETE SET NULL;

-- Add helfer_status to track the status of helper coordination
-- Possible values: null (not started), 'entwurf' (draft), 'veroeffentlicht' (published), 'abgeschlossen' (completed)
ALTER TABLE veranstaltungen
ADD COLUMN IF NOT EXISTS helfer_status TEXT CHECK (helfer_status IS NULL OR helfer_status IN ('entwurf', 'veroeffentlicht', 'abgeschlossen'));

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS veranstaltungen_helfer_template_idx ON veranstaltungen(helfer_template_id);
CREATE INDEX IF NOT EXISTS veranstaltungen_helfer_status_idx ON veranstaltungen(helfer_status);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN veranstaltungen.helfer_template_id IS 'Reference to the template used to generate shifts. NULL if no template was used.';
COMMENT ON COLUMN veranstaltungen.helfer_status IS 'Status of helper coordination: NULL (not started), entwurf (draft), veroeffentlicht (published), abgeschlossen (completed)';
