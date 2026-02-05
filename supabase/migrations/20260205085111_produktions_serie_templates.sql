-- Migration: Produktions-Serie Template-Zuweisung (Issue #207)
-- Created: 2026-02-05
-- Description: Weekday-based template mapping for series bulk generation

-- =============================================================================
-- TABLE: produktions_serie_templates (Weekday-based template mapping)
-- =============================================================================

CREATE TABLE IF NOT EXISTS produktions_serie_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serie_id UUID NOT NULL REFERENCES auffuehrungsserien(id) ON DELETE CASCADE,
  wochentag INTEGER NOT NULL CHECK (wochentag BETWEEN 0 AND 6),
  template_id UUID NOT NULL REFERENCES auffuehrung_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(serie_id, wochentag)
);

-- Enable Row Level Security
ALTER TABLE produktions_serie_templates ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read
CREATE POLICY "produktions_serie_templates_select"
  ON produktions_serie_templates FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Management can insert
CREATE POLICY "produktions_serie_templates_insert"
  ON produktions_serie_templates FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

-- Policy: Management can update
CREATE POLICY "produktions_serie_templates_update"
  ON produktions_serie_templates FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- Policy: Management can delete
CREATE POLICY "produktions_serie_templates_delete"
  ON produktions_serie_templates FOR DELETE
  TO authenticated
  USING (is_management());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_produktions_serie_templates_serie
  ON produktions_serie_templates(serie_id);

CREATE INDEX IF NOT EXISTS idx_produktions_serie_templates_template
  ON produktions_serie_templates(template_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE produktions_serie_templates IS 'Maps weekdays to templates for bulk shift generation in series';
COMMENT ON COLUMN produktions_serie_templates.wochentag IS 'Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday';
