-- Migration: Proben (Issue #103)
-- Probenplanung mit Szenenbezug und Teilnehmerverwaltung

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE probe_status AS ENUM (
  'geplant',
  'bestaetigt',
  'abgesagt',
  'verschoben',
  'abgeschlossen'
);

CREATE TYPE teilnehmer_status AS ENUM (
  'eingeladen',
  'zugesagt',
  'abgesagt',
  'erschienen',
  'nicht_erschienen'
);

-- =============================================================================
-- Tables
-- =============================================================================

-- Proben (Probentermine für ein Stück)
CREATE TABLE proben (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stueck_id UUID NOT NULL REFERENCES stuecke(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  datum DATE NOT NULL,
  startzeit TIME,
  endzeit TIME,
  ort TEXT,
  status probe_status NOT NULL DEFAULT 'geplant',
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proben-Szenen Verknüpfung (welche Szenen werden geprobt)
CREATE TABLE proben_szenen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_id UUID NOT NULL REFERENCES proben(id) ON DELETE CASCADE,
  szene_id UUID NOT NULL REFERENCES szenen(id) ON DELETE CASCADE,
  reihenfolge INTEGER,
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(probe_id, szene_id)
);

-- Proben-Teilnehmer (wer ist eingeladen/nimmt teil)
CREATE TABLE proben_teilnehmer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_id UUID NOT NULL REFERENCES proben(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  status teilnehmer_status NOT NULL DEFAULT 'eingeladen',
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(probe_id, person_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_proben_stueck ON proben(stueck_id);
CREATE INDEX idx_proben_datum ON proben(datum);
CREATE INDEX idx_proben_status ON proben(status);
CREATE INDEX idx_proben_szenen_probe ON proben_szenen(probe_id);
CREATE INDEX idx_proben_szenen_szene ON proben_szenen(szene_id);
CREATE INDEX idx_proben_teilnehmer_probe ON proben_teilnehmer(probe_id);
CREATE INDEX idx_proben_teilnehmer_person ON proben_teilnehmer(person_id);

-- =============================================================================
-- Updated_at Triggers
-- =============================================================================

CREATE TRIGGER set_proben_updated_at
  BEFORE UPDATE ON proben
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_proben_teilnehmer_updated_at
  BEFORE UPDATE ON proben_teilnehmer
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE proben ENABLE ROW LEVEL SECURITY;
ALTER TABLE proben_szenen ENABLE ROW LEVEL SECURITY;
ALTER TABLE proben_teilnehmer ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Benutzer können lesen
CREATE POLICY "Authenticated users can view proben"
  ON proben FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view proben_szenen"
  ON proben_szenen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view proben_teilnehmer"
  ON proben_teilnehmer FOR SELECT
  TO authenticated
  USING (true);

-- ADMIN und EDITOR können Proben verwalten
CREATE POLICY "Editors can insert proben"
  ON proben FOR INSERT
  TO authenticated
  WITH CHECK (is_editor_or_admin());

CREATE POLICY "Editors can update proben"
  ON proben FOR UPDATE
  TO authenticated
  USING (is_editor_or_admin())
  WITH CHECK (is_editor_or_admin());

CREATE POLICY "Editors can delete proben"
  ON proben FOR DELETE
  TO authenticated
  USING (is_editor_or_admin());

-- Proben-Szenen Policies
CREATE POLICY "Editors can insert proben_szenen"
  ON proben_szenen FOR INSERT
  TO authenticated
  WITH CHECK (is_editor_or_admin());

CREATE POLICY "Editors can update proben_szenen"
  ON proben_szenen FOR UPDATE
  TO authenticated
  USING (is_editor_or_admin())
  WITH CHECK (is_editor_or_admin());

CREATE POLICY "Editors can delete proben_szenen"
  ON proben_szenen FOR DELETE
  TO authenticated
  USING (is_editor_or_admin());

-- Proben-Teilnehmer Policies (Editoren können verwalten, User können eigenen Status ändern)
CREATE POLICY "Editors can insert proben_teilnehmer"
  ON proben_teilnehmer FOR INSERT
  TO authenticated
  WITH CHECK (is_editor_or_admin());

CREATE POLICY "Editors can update proben_teilnehmer"
  ON proben_teilnehmer FOR UPDATE
  TO authenticated
  USING (is_editor_or_admin())
  WITH CHECK (is_editor_or_admin());

CREATE POLICY "Users can update own teilnehmer status"
  ON proben_teilnehmer FOR UPDATE
  TO authenticated
  USING (
    person_id IN (
      SELECT pe.id FROM personen pe
      JOIN profiles pr ON pr.email = pe.email
      WHERE pr.id = auth.uid()
    )
  )
  WITH CHECK (
    person_id IN (
      SELECT pe.id FROM personen pe
      JOIN profiles pr ON pr.email = pe.email
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Editors can delete proben_teilnehmer"
  ON proben_teilnehmer FOR DELETE
  TO authenticated
  USING (is_editor_or_admin());

-- =============================================================================
-- Helper Function: Teilnehmer aus Besetzungen generieren
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_probe_teilnehmer(probe_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Füge alle Personen hinzu, die in den zu probenden Szenen besetzt sind
  INSERT INTO proben_teilnehmer (probe_id, person_id, status)
  SELECT DISTINCT
    probe_uuid,
    b.person_id,
    'eingeladen'
  FROM proben_szenen ps
  JOIN szenen_rollen sr ON sr.szene_id = ps.szene_id
  JOIN besetzungen b ON b.rolle_id = sr.rolle_id
  WHERE ps.probe_id = probe_uuid
  AND (b.gueltig_bis IS NULL OR b.gueltig_bis >= CURRENT_DATE)
  ON CONFLICT (probe_id, person_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Views
-- =============================================================================

-- Kommende Proben
CREATE OR REPLACE VIEW kommende_proben AS
SELECT
  p.*,
  s.titel as stueck_titel,
  (SELECT COUNT(*) FROM proben_szenen ps WHERE ps.probe_id = p.id) as szenen_count,
  (SELECT COUNT(*) FROM proben_teilnehmer pt WHERE pt.probe_id = p.id) as teilnehmer_count,
  (SELECT COUNT(*) FROM proben_teilnehmer pt WHERE pt.probe_id = p.id AND pt.status = 'zugesagt') as zusagen_count
FROM proben p
JOIN stuecke s ON p.stueck_id = s.id
WHERE p.datum >= CURRENT_DATE
AND p.status NOT IN ('abgesagt', 'abgeschlossen')
ORDER BY p.datum, p.startzeit;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE proben IS 'Probentermine für Theaterstücke';
COMMENT ON TABLE proben_szenen IS 'Welche Szenen bei einer Probe geprobt werden';
COMMENT ON TABLE proben_teilnehmer IS 'Teilnehmer einer Probe mit Status';
COMMENT ON FUNCTION generate_probe_teilnehmer IS 'Generiert Teilnehmerliste aus Besetzungen der zu probenden Szenen';
