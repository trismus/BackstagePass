-- Migration: Rollen- und Zuständigkeitssystem (Issue #2)
-- Creates vereinsrollen and mitglied_rollen tables for flexible organization roles

-- ============================================================================
-- Vereinsrollen (Organization Roles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vereinsrollen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  beschreibung TEXT,
  farbe TEXT DEFAULT '#6B7280', -- neutral gray as default
  sortierung INTEGER DEFAULT 0,
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default roles
INSERT INTO vereinsrollen (name, beschreibung, farbe, sortierung) VALUES
  ('Ensemble', 'Schauspieler und Darsteller', '#8B5CF6', 1),
  ('Technik', 'Licht, Ton, Bühnentechnik', '#F59E0B', 2),
  ('Regie', 'Regisseure und Regieassistenz', '#EF4444', 3),
  ('Organisation', 'Vereinsorganisation und Verwaltung', '#3B82F6', 4),
  ('Vorstand', 'Vorstandsmitglieder', '#10B981', 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Mitglied-Rollen Zuordnung (Member Role Assignments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mitglied_rollen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitglied_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  rolle_id UUID NOT NULL REFERENCES vereinsrollen(id) ON DELETE CASCADE,
  ist_primaer BOOLEAN DEFAULT false,
  gueltig_von DATE DEFAULT CURRENT_DATE,
  gueltig_bis DATE, -- NULL means currently active
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique active assignment per member per role
  CONSTRAINT unique_active_role UNIQUE (mitglied_id, rolle_id, gueltig_bis)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_mitglied_rollen_mitglied ON mitglied_rollen(mitglied_id);
CREATE INDEX IF NOT EXISTS idx_mitglied_rollen_rolle ON mitglied_rollen(rolle_id);
CREATE INDEX IF NOT EXISTS idx_mitglied_rollen_aktiv ON mitglied_rollen(mitglied_id) WHERE gueltig_bis IS NULL;

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vereinsrollen_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vereinsrollen_updated_at
  BEFORE UPDATE ON vereinsrollen
  FOR EACH ROW
  EXECUTE FUNCTION update_vereinsrollen_updated_at();

CREATE OR REPLACE FUNCTION update_mitglied_rollen_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mitglied_rollen_updated_at
  BEFORE UPDATE ON mitglied_rollen
  FOR EACH ROW
  EXECUTE FUNCTION update_mitglied_rollen_updated_at();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE vereinsrollen ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitglied_rollen ENABLE ROW LEVEL SECURITY;

-- Vereinsrollen: All authenticated users can read
CREATE POLICY vereinsrollen_select ON vereinsrollen
  FOR SELECT TO authenticated USING (true);

-- Vereinsrollen: Management can modify
CREATE POLICY vereinsrollen_management ON vereinsrollen
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'VORSTAND')
    )
  );

-- Mitglied-Rollen: All authenticated users can read
CREATE POLICY mitglied_rollen_select ON mitglied_rollen
  FOR SELECT TO authenticated USING (true);

-- Mitglied-Rollen: Management can modify
CREATE POLICY mitglied_rollen_management ON mitglied_rollen
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'VORSTAND')
    )
  );

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE vereinsrollen IS 'Organization roles (Ensemble, Technik, Regie, etc.)';
COMMENT ON TABLE mitglied_rollen IS 'Assignment of organization roles to members with temporal validity';
COMMENT ON COLUMN mitglied_rollen.ist_primaer IS 'Primary role flag - each member should have at most one primary role';
COMMENT ON COLUMN mitglied_rollen.gueltig_bis IS 'NULL means the role is currently active';
