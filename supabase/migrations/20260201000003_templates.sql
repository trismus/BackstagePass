-- Migration: Create auffuehrung_templates and related tables
-- Created: 2026-02-01
-- Description: Reusable templates for performances (Issue #99)
-- Note: This migration is idempotent (can be run multiple times safely)

-- =============================================================================
-- TABLE: auffuehrung_templates (Performance Templates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS auffuehrung_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  beschreibung TEXT,
  archiviert BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE auffuehrung_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "auffuehrung_templates_select" ON auffuehrung_templates;
DROP POLICY IF EXISTS "auffuehrung_templates_insert" ON auffuehrung_templates;
DROP POLICY IF EXISTS "auffuehrung_templates_update" ON auffuehrung_templates;
DROP POLICY IF EXISTS "auffuehrung_templates_delete" ON auffuehrung_templates;

-- Policy: All authenticated users can read templates
CREATE POLICY "auffuehrung_templates_select"
  ON auffuehrung_templates FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can manage templates
CREATE POLICY "auffuehrung_templates_insert"
  ON auffuehrung_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "auffuehrung_templates_update"
  ON auffuehrung_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "auffuehrung_templates_delete"
  ON auffuehrung_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS auffuehrung_templates_name_idx ON auffuehrung_templates(name);
CREATE INDEX IF NOT EXISTS auffuehrung_templates_archiviert_idx ON auffuehrung_templates(archiviert);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_auffuehrung_templates_updated_at ON auffuehrung_templates;
CREATE TRIGGER update_auffuehrung_templates_updated_at
  BEFORE UPDATE ON auffuehrung_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: template_zeitbloecke (Template Time Blocks - offset-based)
-- =============================================================================

CREATE TABLE IF NOT EXISTS template_zeitbloecke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES auffuehrung_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  offset_minuten INTEGER DEFAULT 0,
  dauer_minuten INTEGER NOT NULL,
  typ TEXT DEFAULT 'standard' CHECK (typ IN ('aufbau', 'einlass', 'vorfuehrung', 'pause', 'abbau', 'standard')),
  sortierung INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE template_zeitbloecke ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "template_zeitbloecke_select" ON template_zeitbloecke;
DROP POLICY IF EXISTS "template_zeitbloecke_insert" ON template_zeitbloecke;
DROP POLICY IF EXISTS "template_zeitbloecke_update" ON template_zeitbloecke;
DROP POLICY IF EXISTS "template_zeitbloecke_delete" ON template_zeitbloecke;

-- Policy: All authenticated users can read template time blocks
CREATE POLICY "template_zeitbloecke_select"
  ON template_zeitbloecke FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can manage template time blocks
CREATE POLICY "template_zeitbloecke_insert"
  ON template_zeitbloecke FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "template_zeitbloecke_update"
  ON template_zeitbloecke FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "template_zeitbloecke_delete"
  ON template_zeitbloecke FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS template_zeitbloecke_template_idx ON template_zeitbloecke(template_id);
CREATE INDEX IF NOT EXISTS template_zeitbloecke_sortierung_idx ON template_zeitbloecke(sortierung);

-- =============================================================================
-- TABLE: template_schichten (Template Shifts)
-- =============================================================================

CREATE TABLE IF NOT EXISTS template_schichten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES auffuehrung_templates(id) ON DELETE CASCADE,
  zeitblock_name TEXT,
  rolle TEXT NOT NULL,
  anzahl_benoetigt INTEGER DEFAULT 1
);

-- Enable Row Level Security
ALTER TABLE template_schichten ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "template_schichten_select" ON template_schichten;
DROP POLICY IF EXISTS "template_schichten_insert" ON template_schichten;
DROP POLICY IF EXISTS "template_schichten_update" ON template_schichten;
DROP POLICY IF EXISTS "template_schichten_delete" ON template_schichten;

-- Policy: All authenticated users can read template shifts
CREATE POLICY "template_schichten_select"
  ON template_schichten FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can manage template shifts
CREATE POLICY "template_schichten_insert"
  ON template_schichten FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "template_schichten_update"
  ON template_schichten FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "template_schichten_delete"
  ON template_schichten FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS template_schichten_template_idx ON template_schichten(template_id);

-- =============================================================================
-- TABLE: template_ressourcen (Template Resources)
-- =============================================================================

CREATE TABLE IF NOT EXISTS template_ressourcen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES auffuehrung_templates(id) ON DELETE CASCADE,
  ressource_id UUID REFERENCES ressourcen(id) ON DELETE SET NULL,
  menge INTEGER DEFAULT 1
);

-- Enable Row Level Security
ALTER TABLE template_ressourcen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "template_ressourcen_select" ON template_ressourcen;
DROP POLICY IF EXISTS "template_ressourcen_insert" ON template_ressourcen;
DROP POLICY IF EXISTS "template_ressourcen_update" ON template_ressourcen;
DROP POLICY IF EXISTS "template_ressourcen_delete" ON template_ressourcen;

-- Policy: All authenticated users can read template resources
CREATE POLICY "template_ressourcen_select"
  ON template_ressourcen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can manage template resources
CREATE POLICY "template_ressourcen_insert"
  ON template_ressourcen FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "template_ressourcen_update"
  ON template_ressourcen FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "template_ressourcen_delete"
  ON template_ressourcen FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS template_ressourcen_template_idx ON template_ressourcen(template_id);
CREATE INDEX IF NOT EXISTS template_ressourcen_ressource_idx ON template_ressourcen(ressource_id);
