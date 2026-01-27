-- Migration: Stücke, Szenen und Rollen (Issue #101)
-- Künstlerische Planung - Stückstruktur

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE stueck_status AS ENUM (
  'in_planung',
  'in_proben',
  'aktiv',
  'abgeschlossen',
  'archiviert'
);

CREATE TYPE rollen_typ AS ENUM (
  'hauptrolle',
  'nebenrolle',
  'ensemble',
  'statisterie'
);

-- =============================================================================
-- Tables
-- =============================================================================

-- Stücke (Theaterstücke/Produktionen)
CREATE TABLE stuecke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titel TEXT NOT NULL,
  beschreibung TEXT,
  autor TEXT,
  status stueck_status NOT NULL DEFAULT 'in_planung',
  premiere_datum DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Szenen (gehören zu einem Stück)
CREATE TABLE szenen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stueck_id UUID NOT NULL REFERENCES stuecke(id) ON DELETE CASCADE,
  nummer INTEGER NOT NULL,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  dauer_minuten INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stueck_id, nummer)
);

-- Rollen (gehören zu einem Stück)
CREATE TABLE rollen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stueck_id UUID NOT NULL REFERENCES stuecke(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  beschreibung TEXT,
  typ rollen_typ NOT NULL DEFAULT 'nebenrolle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Szenen-Rollen Verknüpfung (welche Rollen treten in welchen Szenen auf)
CREATE TABLE szenen_rollen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  szene_id UUID NOT NULL REFERENCES szenen(id) ON DELETE CASCADE,
  rolle_id UUID NOT NULL REFERENCES rollen(id) ON DELETE CASCADE,
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(szene_id, rolle_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_szenen_stueck ON szenen(stueck_id);
CREATE INDEX idx_szenen_nummer ON szenen(stueck_id, nummer);
CREATE INDEX idx_rollen_stueck ON rollen(stueck_id);
CREATE INDEX idx_szenen_rollen_szene ON szenen_rollen(szene_id);
CREATE INDEX idx_szenen_rollen_rolle ON szenen_rollen(rolle_id);

-- =============================================================================
-- Updated_at Triggers
-- =============================================================================

CREATE TRIGGER set_stuecke_updated_at
  BEFORE UPDATE ON stuecke
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_szenen_updated_at
  BEFORE UPDATE ON szenen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_rollen_updated_at
  BEFORE UPDATE ON rollen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE stuecke ENABLE ROW LEVEL SECURITY;
ALTER TABLE szenen ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollen ENABLE ROW LEVEL SECURITY;
ALTER TABLE szenen_rollen ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Benutzer können lesen
CREATE POLICY "Authenticated users can view stuecke"
  ON stuecke FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view szenen"
  ON szenen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view rollen"
  ON rollen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view szenen_rollen"
  ON szenen_rollen FOR SELECT
  TO authenticated
  USING (true);

-- ADMIN und EDITOR können schreiben (INSERT, UPDATE, DELETE)
-- Nutzt die bestehende get_user_role() Funktion

CREATE POLICY "Editors can insert stuecke"
  ON stuecke FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

CREATE POLICY "Editors can update stuecke"
  ON stuecke FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'))
  WITH CHECK (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

CREATE POLICY "Editors can delete stuecke"
  ON stuecke FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

-- Szenen Policies
CREATE POLICY "Editors can insert szenen"
  ON szenen FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

CREATE POLICY "Editors can update szenen"
  ON szenen FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'))
  WITH CHECK (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

CREATE POLICY "Editors can delete szenen"
  ON szenen FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

-- Rollen Policies
CREATE POLICY "Editors can insert rollen"
  ON rollen FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

CREATE POLICY "Editors can update rollen"
  ON rollen FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'))
  WITH CHECK (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

CREATE POLICY "Editors can delete rollen"
  ON rollen FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

-- Szenen-Rollen Policies
CREATE POLICY "Editors can insert szenen_rollen"
  ON szenen_rollen FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

CREATE POLICY "Editors can update szenen_rollen"
  ON szenen_rollen FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'))
  WITH CHECK (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

CREATE POLICY "Editors can delete szenen_rollen"
  ON szenen_rollen FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'EDITOR'));

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE stuecke IS 'Theaterstücke/Produktionen der TGW';
COMMENT ON TABLE szenen IS 'Szenen eines Stücks mit Reihenfolge';
COMMENT ON TABLE rollen IS 'Rollen/Charaktere in einem Stück';
COMMENT ON TABLE szenen_rollen IS 'Verknüpfung: welche Rollen in welchen Szenen auftreten';
