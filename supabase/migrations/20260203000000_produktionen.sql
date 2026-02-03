-- Migration: Produktionen (Issue #156)
-- Produktions-Entität als übergeordnetes Objekt für Theaterprojekte

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE produktion_status AS ENUM (
  'draft',
  'planung',
  'casting',
  'proben',
  'premiere',
  'laufend',
  'abgeschlossen',
  'abgesagt'
);

CREATE TYPE serie_status AS ENUM (
  'draft',
  'planung',
  'publiziert',
  'abgeschlossen'
);

-- =============================================================================
-- Tables
-- =============================================================================

-- Produktionen (Haupttabelle)
CREATE TABLE produktionen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titel TEXT NOT NULL,
  beschreibung TEXT,
  stueck_id UUID REFERENCES stuecke(id) ON DELETE SET NULL,
  status produktion_status NOT NULL DEFAULT 'draft',
  saison TEXT NOT NULL,
  proben_start DATE,
  premiere DATE,
  derniere DATE,
  produktionsleitung_id UUID REFERENCES personen(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aufführungsserien (gruppiert Einzelaufführungen)
CREATE TABLE auffuehrungsserien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produktion_id UUID NOT NULL REFERENCES produktionen(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  beschreibung TEXT,
  status serie_status NOT NULL DEFAULT 'draft',
  standard_ort TEXT,
  standard_startzeit TIME,
  standard_einlass_minuten INTEGER DEFAULT 30,
  template_id UUID REFERENCES auffuehrung_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Serienaufführungen (Einzeltermine einer Serie)
CREATE TABLE serienauffuehrungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serie_id UUID NOT NULL REFERENCES auffuehrungsserien(id) ON DELETE CASCADE,
  veranstaltung_id UUID REFERENCES veranstaltungen(id) ON DELETE SET NULL,
  datum DATE NOT NULL,
  startzeit TIME,
  ort TEXT,
  typ TEXT NOT NULL DEFAULT 'regulaer',
  ist_ausnahme BOOLEAN NOT NULL DEFAULT false,
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(serie_id, datum, startzeit)
);

-- Produktions-Stab (Team-Zuweisung)
CREATE TABLE produktions_stab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produktion_id UUID NOT NULL REFERENCES produktionen(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  funktion TEXT NOT NULL,
  ist_leitung BOOLEAN NOT NULL DEFAULT false,
  von DATE,
  bis DATE,
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(produktion_id, person_id, funktion)
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_produktionen_status ON produktionen(status);
CREATE INDEX idx_produktionen_saison ON produktionen(saison);
CREATE INDEX idx_produktionen_stueck ON produktionen(stueck_id);
CREATE INDEX idx_produktionen_leitung ON produktionen(produktionsleitung_id);

CREATE INDEX idx_serien_produktion ON auffuehrungsserien(produktion_id);
CREATE INDEX idx_serien_status ON auffuehrungsserien(status);

CREATE INDEX idx_serienauffuehrungen_serie ON serienauffuehrungen(serie_id);
CREATE INDEX idx_serienauffuehrungen_datum ON serienauffuehrungen(datum);
CREATE INDEX idx_serienauffuehrungen_veranstaltung ON serienauffuehrungen(veranstaltung_id);

CREATE INDEX idx_produktions_stab_produktion ON produktions_stab(produktion_id);
CREATE INDEX idx_produktions_stab_person ON produktions_stab(person_id);

-- =============================================================================
-- Updated_at Triggers
-- =============================================================================

CREATE TRIGGER set_produktionen_updated_at
  BEFORE UPDATE ON produktionen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_auffuehrungsserien_updated_at
  BEFORE UPDATE ON auffuehrungsserien
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_serienauffuehrungen_updated_at
  BEFORE UPDATE ON serienauffuehrungen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Audit Logging (Status-Änderungen)
-- =============================================================================

CREATE OR REPLACE FUNCTION log_produktion_status_change()
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
      'produktionen',
      NEW.id,
      'status_change',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_produktion_status
  AFTER UPDATE ON produktionen
  FOR EACH ROW
  EXECUTE FUNCTION log_produktion_status_change();

CREATE OR REPLACE FUNCTION log_serie_status_change()
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
      'auffuehrungsserien',
      NEW.id,
      'status_change',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_serie_status
  AFTER UPDATE ON auffuehrungsserien
  FOR EACH ROW
  EXECUTE FUNCTION log_serie_status_change();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE produktionen ENABLE ROW LEVEL SECURITY;
ALTER TABLE auffuehrungsserien ENABLE ROW LEVEL SECURITY;
ALTER TABLE serienauffuehrungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE produktions_stab ENABLE ROW LEVEL SECURITY;

-- Produktionen
CREATE POLICY "Authenticated users can view produktionen"
  ON produktionen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert produktionen"
  ON produktionen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update produktionen"
  ON produktionen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Admins can delete produktionen"
  ON produktionen FOR DELETE
  TO authenticated
  USING (is_admin());

-- Aufführungsserien
CREATE POLICY "Authenticated users can view serien"
  ON auffuehrungsserien FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert serien"
  ON auffuehrungsserien FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update serien"
  ON auffuehrungsserien FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Admins can delete serien"
  ON auffuehrungsserien FOR DELETE
  TO authenticated
  USING (is_admin());

-- Serienaufführungen
CREATE POLICY "Authenticated users can view serienauffuehrungen"
  ON serienauffuehrungen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert serienauffuehrungen"
  ON serienauffuehrungen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update serienauffuehrungen"
  ON serienauffuehrungen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete serienauffuehrungen"
  ON serienauffuehrungen FOR DELETE
  TO authenticated
  USING (is_management());

-- Produktions-Stab
CREATE POLICY "Authenticated users can view produktions_stab"
  ON produktions_stab FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert produktions_stab"
  ON produktions_stab FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update produktions_stab"
  ON produktions_stab FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete produktions_stab"
  ON produktions_stab FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE produktionen IS 'Theaterprojekte/Produktionen mit Status-Workflow';
COMMENT ON TABLE auffuehrungsserien IS 'Aufführungsserien als Master-Planungsebene';
COMMENT ON TABLE serienauffuehrungen IS 'Einzeltermine einer Aufführungsserie';
COMMENT ON TABLE produktions_stab IS 'Team-Zuweisungen für Produktionen (Regie, Technik, etc.)';
