-- Migration: Requisiten für Stücke (Issue #192)
-- Künstlerische Produktion - Requisiten-Management

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE requisiten_status AS ENUM (
  'gesucht',
  'gefunden',
  'beschafft',
  'vorhanden'
);

-- =============================================================================
-- Tables
-- =============================================================================

-- Requisiten (gehören zu einem Stück)
CREATE TABLE requisiten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stueck_id UUID NOT NULL REFERENCES stuecke(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  beschreibung TEXT,
  szene_id UUID REFERENCES szenen(id) ON DELETE SET NULL,
  verantwortlich_id UUID REFERENCES personen(id) ON DELETE SET NULL,
  status requisiten_status NOT NULL DEFAULT 'gesucht',
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_requisiten_stueck ON requisiten(stueck_id);
CREATE INDEX idx_requisiten_szene ON requisiten(szene_id);
CREATE INDEX idx_requisiten_verantwortlich ON requisiten(verantwortlich_id);
CREATE INDEX idx_requisiten_status ON requisiten(status);

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE TRIGGER set_requisiten_updated_at
  BEFORE UPDATE ON requisiten
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE requisiten ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Benutzer können lesen
CREATE POLICY "Authenticated users can view requisiten"
  ON requisiten FOR SELECT
  TO authenticated
  USING (true);

-- Management (ADMIN, VORSTAND) können schreiben
CREATE POLICY "Management can insert requisiten"
  ON requisiten FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update requisiten"
  ON requisiten FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete requisiten"
  ON requisiten FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE requisiten IS 'Requisiten/Props für Theaterstücke';
COMMENT ON COLUMN requisiten.verantwortlich_id IS 'Person die für die Beschaffung verantwortlich ist';
COMMENT ON COLUMN requisiten.szene_id IS 'Optionale Verknüpfung zu einer bestimmten Szene';
