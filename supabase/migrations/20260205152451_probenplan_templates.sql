-- Migration: Probenplan Templates (Issue #163)
-- Templates for recurring rehearsal schedules

-- =============================================================================
-- Tables
-- =============================================================================

-- Probenplan-Vorlagen (reusable rehearsal plan templates)
CREATE TABLE IF NOT EXISTS probenplan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stueck_id UUID NOT NULL REFERENCES stuecke(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  beschreibung TEXT,
  -- Recurring pattern
  wiederholung_typ TEXT NOT NULL CHECK (wiederholung_typ IN ('woechentlich', 'zweiwoechentlich', 'monatlich')),
  wochentag INTEGER CHECK (wochentag BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  startzeit TIME,
  endzeit TIME,
  dauer_wochen INTEGER DEFAULT 1, -- How many weeks/occurrences to generate
  ort TEXT,
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Probenplan-Template Szenen (which scenes are in this template)
CREATE TABLE IF NOT EXISTS probenplan_template_szenen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES probenplan_templates(id) ON DELETE CASCADE,
  szene_id UUID NOT NULL REFERENCES szenen(id) ON DELETE CASCADE,
  reihenfolge INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, szene_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_probenplan_templates_stueck ON probenplan_templates(stueck_id);
CREATE INDEX IF NOT EXISTS idx_probenplan_template_szenen_template ON probenplan_template_szenen(template_id);

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE TRIGGER set_probenplan_templates_updated_at
  BEFORE UPDATE ON probenplan_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE probenplan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE probenplan_template_szenen ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view templates
CREATE POLICY "Authenticated users can view probenplan_templates"
  ON probenplan_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view probenplan_template_szenen"
  ON probenplan_template_szenen FOR SELECT
  TO authenticated
  USING (true);

-- Management can manage templates
CREATE POLICY "Management can insert probenplan_templates"
  ON probenplan_templates FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update probenplan_templates"
  ON probenplan_templates FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete probenplan_templates"
  ON probenplan_templates FOR DELETE
  TO authenticated
  USING (is_management());

CREATE POLICY "Management can insert probenplan_template_szenen"
  ON probenplan_template_szenen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update probenplan_template_szenen"
  ON probenplan_template_szenen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete probenplan_template_szenen"
  ON probenplan_template_szenen FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- Helper Function: Check conflicts for a rehearsal date
-- Returns list of persons with availability conflicts
-- =============================================================================

CREATE OR REPLACE FUNCTION check_probe_konflikte(
  p_stueck_id UUID,
  p_datum DATE,
  p_startzeit TIME,
  p_endzeit TIME,
  p_szenen_ids UUID[] DEFAULT NULL
) RETURNS TABLE (
  person_id UUID,
  person_name TEXT,
  konflikt_typ TEXT,
  konflikt_grund TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Get all people who would be invited to this rehearsal
  WITH affected_persons AS (
    SELECT DISTINCT b.person_id, p.vorname || ' ' || p.nachname as full_name
    FROM besetzungen b
    JOIN rollen r ON r.id = b.rolle_id
    JOIN personen p ON p.id = b.person_id
    LEFT JOIN szenen_rollen sr ON sr.rolle_id = r.id
    WHERE r.stueck_id = p_stueck_id
      AND (b.gueltig_bis IS NULL OR b.gueltig_bis >= CURRENT_DATE)
      AND (
        p_szenen_ids IS NULL
        OR sr.szene_id = ANY(p_szenen_ids)
      )
  )
  -- Check for availability conflicts
  SELECT
    ap.person_id,
    ap.full_name,
    'verfuegbarkeit'::TEXT as konflikt_typ,
    COALESCE(v.grund, 'Nicht verfügbar')
  FROM affected_persons ap
  JOIN verfuegbarkeiten v ON v.mitglied_id = ap.person_id
  WHERE p_datum BETWEEN v.datum_von AND v.datum_bis
    AND v.status = 'nicht_verfuegbar'
    AND (
      v.zeitfenster_von IS NULL
      OR v.zeitfenster_bis IS NULL
      OR (p_startzeit IS NULL AND p_endzeit IS NULL)
      OR (
        (p_startzeit IS NULL OR p_startzeit < v.zeitfenster_bis) AND
        (p_endzeit IS NULL OR p_endzeit > v.zeitfenster_von)
      )
    )
  UNION ALL
  -- Check for other rehearsal conflicts on the same date
  SELECT
    ap.person_id,
    ap.full_name,
    'andere_probe'::TEXT as konflikt_typ,
    'Bereits für andere Probe eingeladen: ' || pr.titel
  FROM affected_persons ap
  JOIN proben_teilnehmer pt ON pt.person_id = ap.person_id
  JOIN proben pr ON pr.id = pt.probe_id
  WHERE pr.datum = p_datum
    AND pr.status NOT IN ('abgesagt', 'abgeschlossen')
    AND (
      pr.startzeit IS NULL
      OR pr.endzeit IS NULL
      OR p_startzeit IS NULL
      OR p_endzeit IS NULL
      OR (
        (p_startzeit < pr.endzeit) AND
        (p_endzeit > pr.startzeit)
      )
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE probenplan_templates IS 'Reusable templates for recurring rehearsal schedules';
COMMENT ON TABLE probenplan_template_szenen IS 'Scenes included in a rehearsal plan template';
COMMENT ON FUNCTION check_probe_konflikte IS 'Check for availability and scheduling conflicts for a potential rehearsal date';
