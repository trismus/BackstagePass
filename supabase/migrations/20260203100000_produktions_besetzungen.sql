-- Migration: Produktions-Besetzungen (Issue #158)
-- Produktionsspezifische Besetzungen mit Status-Workflow

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE produktions_besetzung_status AS ENUM (
  'offen',
  'vorgemerkt',
  'besetzt',
  'abgesagt'
);

-- =============================================================================
-- Tables
-- =============================================================================

-- Produktions-Besetzungen (welche Person spielt welche Rolle in welcher Produktion)
CREATE TABLE produktions_besetzungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produktion_id UUID NOT NULL REFERENCES produktionen(id) ON DELETE CASCADE,
  rolle_id UUID NOT NULL REFERENCES rollen(id) ON DELETE CASCADE,
  person_id UUID REFERENCES personen(id) ON DELETE SET NULL,
  typ besetzung_typ NOT NULL DEFAULT 'hauptbesetzung',
  status produktions_besetzung_status NOT NULL DEFAULT 'offen',
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(produktion_id, rolle_id, person_id, typ)
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_prod_besetzungen_produktion ON produktions_besetzungen(produktion_id);
CREATE INDEX idx_prod_besetzungen_rolle ON produktions_besetzungen(rolle_id);
CREATE INDEX idx_prod_besetzungen_person ON produktions_besetzungen(person_id);
CREATE INDEX idx_prod_besetzungen_status ON produktions_besetzungen(status);

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE TRIGGER set_produktions_besetzungen_updated_at
  BEFORE UPDATE ON produktions_besetzungen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Audit Logging (Status-Änderungen)
-- =============================================================================

CREATE OR REPLACE FUNCTION log_produktions_besetzung_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      user_id
    ) VALUES (
      'produktions_besetzungen',
      NEW.id,
      'status_change',
      jsonb_build_object('status', OLD.status, 'person_id', OLD.person_id),
      jsonb_build_object('status', NEW.status, 'person_id', NEW.person_id),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_produktions_besetzung_status
  AFTER UPDATE ON produktions_besetzungen
  FOR EACH ROW
  EXECUTE FUNCTION log_produktions_besetzung_status_change();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE produktions_besetzungen ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Benutzer können lesen
CREATE POLICY "Authenticated users can view produktions_besetzungen"
  ON produktions_besetzungen FOR SELECT
  TO authenticated
  USING (true);

-- Management kann schreiben
CREATE POLICY "Management can insert produktions_besetzungen"
  ON produktions_besetzungen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update produktions_besetzungen"
  ON produktions_besetzungen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete produktions_besetzungen"
  ON produktions_besetzungen FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE produktions_besetzungen IS 'Produktionsspezifische Besetzungen mit Status-Workflow';
