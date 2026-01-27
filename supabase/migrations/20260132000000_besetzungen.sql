-- Migration: Besetzungen (Issue #102)
-- Rollen mit Mitgliedern besetzen, Mehrfachbesetzung, Historie

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE besetzung_typ AS ENUM (
  'hauptbesetzung',
  'zweitbesetzung',
  'ersatz'
);

-- =============================================================================
-- Tables
-- =============================================================================

-- Besetzungen (welche Person spielt welche Rolle)
CREATE TABLE besetzungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rolle_id UUID NOT NULL REFERENCES rollen(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  typ besetzung_typ NOT NULL DEFAULT 'hauptbesetzung',
  gueltig_von DATE,
  gueltig_bis DATE,
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Besetzungs-Historie (Änderungen loggen)
CREATE TABLE besetzungen_historie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  besetzung_id UUID REFERENCES besetzungen(id) ON DELETE SET NULL,
  rolle_id UUID NOT NULL REFERENCES rollen(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  typ besetzung_typ NOT NULL,
  aktion TEXT NOT NULL CHECK (aktion IN ('erstellt', 'geaendert', 'entfernt')),
  geaendert_von UUID REFERENCES profiles(id),
  geaendert_am TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_besetzungen_rolle ON besetzungen(rolle_id);
CREATE INDEX idx_besetzungen_person ON besetzungen(person_id);
CREATE INDEX idx_besetzungen_typ ON besetzungen(typ);
CREATE INDEX idx_besetzungen_historie_rolle ON besetzungen_historie(rolle_id);
CREATE INDEX idx_besetzungen_historie_person ON besetzungen_historie(person_id);
CREATE INDEX idx_besetzungen_historie_zeit ON besetzungen_historie(geaendert_am);

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE TRIGGER set_besetzungen_updated_at
  BEFORE UPDATE ON besetzungen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Historie Trigger (automatisches Logging)
-- =============================================================================

CREATE OR REPLACE FUNCTION log_besetzung_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO besetzungen_historie (besetzung_id, rolle_id, person_id, typ, aktion, geaendert_von, details)
    VALUES (NEW.id, NEW.rolle_id, NEW.person_id, NEW.typ, 'erstellt', auth.uid(),
            jsonb_build_object('notizen', NEW.notizen, 'gueltig_von', NEW.gueltig_von, 'gueltig_bis', NEW.gueltig_bis));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO besetzungen_historie (besetzung_id, rolle_id, person_id, typ, aktion, geaendert_von, details)
    VALUES (NEW.id, NEW.rolle_id, NEW.person_id, NEW.typ, 'geaendert', auth.uid(),
            jsonb_build_object(
              'vorher', jsonb_build_object('typ', OLD.typ, 'notizen', OLD.notizen),
              'nachher', jsonb_build_object('typ', NEW.typ, 'notizen', NEW.notizen)
            ));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO besetzungen_historie (besetzung_id, rolle_id, person_id, typ, aktion, geaendert_von, details)
    VALUES (NULL, OLD.rolle_id, OLD.person_id, OLD.typ, 'entfernt', auth.uid(),
            jsonb_build_object('notizen', OLD.notizen));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER besetzung_historie_trigger
  AFTER INSERT OR UPDATE OR DELETE ON besetzungen
  FOR EACH ROW
  EXECUTE FUNCTION log_besetzung_change();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE besetzungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE besetzungen_historie ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Benutzer können lesen
CREATE POLICY "Authenticated users can view besetzungen"
  ON besetzungen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view besetzungen_historie"
  ON besetzungen_historie FOR SELECT
  TO authenticated
  USING (true);

-- ADMIN und EDITOR können schreiben
CREATE POLICY "Editors can insert besetzungen"
  ON besetzungen FOR INSERT
  TO authenticated
  WITH CHECK (is_editor_or_admin());

CREATE POLICY "Editors can update besetzungen"
  ON besetzungen FOR UPDATE
  TO authenticated
  USING (is_editor_or_admin())
  WITH CHECK (is_editor_or_admin());

CREATE POLICY "Editors can delete besetzungen"
  ON besetzungen FOR DELETE
  TO authenticated
  USING (is_editor_or_admin());

-- Historie ist nur lesbar (wird automatisch befüllt)

-- =============================================================================
-- Views für einfache Abfragen
-- =============================================================================

-- View: Unbesetzte Rollen
CREATE OR REPLACE VIEW unbesetzte_rollen AS
SELECT r.*, s.titel as stueck_titel
FROM rollen r
JOIN stuecke s ON r.stueck_id = s.id
WHERE NOT EXISTS (
  SELECT 1 FROM besetzungen b
  WHERE b.rolle_id = r.id
  AND b.typ = 'hauptbesetzung'
  AND (b.gueltig_bis IS NULL OR b.gueltig_bis >= CURRENT_DATE)
)
AND s.status NOT IN ('abgeschlossen', 'archiviert');

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE besetzungen IS 'Zuordnung von Personen zu Theaterrollen';
COMMENT ON TABLE besetzungen_historie IS 'Änderungshistorie der Besetzungen';
COMMENT ON VIEW unbesetzte_rollen IS 'Rollen ohne aktive Hauptbesetzung';
