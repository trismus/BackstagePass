-- Migration: Proben-Protokoll (Issue #168)
-- Rehearsal protocol/minutes system with templates, scene notes, and tasks

-- =============================================================================
-- Protocol Templates
-- =============================================================================

CREATE TABLE IF NOT EXISTS protokoll_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  beschreibung TEXT,
  -- Template structure as JSON array of items
  -- [{"typ": "abschnitt", "titel": "Anwesenheit"}, {"typ": "text", "label": "Notizen"}]
  struktur JSONB NOT NULL DEFAULT '[]',
  ist_standard BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Probe Protocols
-- =============================================================================

CREATE TABLE IF NOT EXISTS proben_protokolle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_id UUID NOT NULL REFERENCES proben(id) ON DELETE CASCADE,
  template_id UUID REFERENCES protokoll_templates(id) ON DELETE SET NULL,

  -- Protocol metadata
  erstellt_von UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'entwurf' CHECK (status IN ('entwurf', 'abgeschlossen', 'geteilt')),

  -- General notes
  allgemeine_notizen TEXT,

  -- Attendance notes (who was present/absent beyond what's in proben_teilnehmer)
  anwesenheits_notizen TEXT,

  -- Structured content (follows template struktur)
  inhalt JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one protocol per probe
  CONSTRAINT unique_probe_protokoll UNIQUE (probe_id)
);

-- =============================================================================
-- Scene Notes (tied to probe protocol)
-- =============================================================================

CREATE TABLE IF NOT EXISTS protokoll_szenen_notizen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protokoll_id UUID NOT NULL REFERENCES proben_protokolle(id) ON DELETE CASCADE,
  szene_id UUID NOT NULL REFERENCES szenen(id) ON DELETE CASCADE,

  -- Scene-specific feedback
  notizen TEXT,
  status TEXT CHECK (status IN ('geprobt', 'teilweise', 'nicht_geprobt', 'probleme')),
  dauer_minuten INTEGER,

  -- Rating/progress
  fortschritt INTEGER CHECK (fortschritt BETWEEN 1 AND 5), -- 1-5 scale

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_protokoll_szene UNIQUE (protokoll_id, szene_id)
);

-- =============================================================================
-- Tasks from Protocol
-- =============================================================================

CREATE TABLE IF NOT EXISTS protokoll_aufgaben (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protokoll_id UUID NOT NULL REFERENCES proben_protokolle(id) ON DELETE CASCADE,

  titel TEXT NOT NULL,
  beschreibung TEXT,
  zustaendig_id UUID REFERENCES personen(id) ON DELETE SET NULL,
  faellig_bis DATE,
  prioritaet TEXT DEFAULT 'normal' CHECK (prioritaet IN ('niedrig', 'normal', 'hoch', 'dringend')),
  status TEXT DEFAULT 'offen' CHECK (status IN ('offen', 'in_arbeit', 'erledigt', 'abgebrochen')),

  -- Optional reference to scene
  szene_id UUID REFERENCES szenen(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_protokoll_templates_standard ON protokoll_templates(ist_standard) WHERE ist_standard = true;
CREATE INDEX IF NOT EXISTS idx_proben_protokolle_probe ON proben_protokolle(probe_id);
CREATE INDEX IF NOT EXISTS idx_proben_protokolle_status ON proben_protokolle(status);
CREATE INDEX IF NOT EXISTS idx_protokoll_szenen_notizen_protokoll ON protokoll_szenen_notizen(protokoll_id);
CREATE INDEX IF NOT EXISTS idx_protokoll_aufgaben_protokoll ON protokoll_aufgaben(protokoll_id);
CREATE INDEX IF NOT EXISTS idx_protokoll_aufgaben_zustaendig ON protokoll_aufgaben(zustaendig_id);
CREATE INDEX IF NOT EXISTS idx_protokoll_aufgaben_status ON protokoll_aufgaben(status) WHERE status != 'erledigt';

-- =============================================================================
-- Updated_at Triggers
-- =============================================================================

CREATE TRIGGER set_protokoll_templates_updated_at
  BEFORE UPDATE ON protokoll_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_proben_protokolle_updated_at
  BEFORE UPDATE ON proben_protokolle
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_protokoll_szenen_notizen_updated_at
  BEFORE UPDATE ON protokoll_szenen_notizen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_protokoll_aufgaben_updated_at
  BEFORE UPDATE ON protokoll_aufgaben
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE protokoll_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proben_protokolle ENABLE ROW LEVEL SECURITY;
ALTER TABLE protokoll_szenen_notizen ENABLE ROW LEVEL SECURITY;
ALTER TABLE protokoll_aufgaben ENABLE ROW LEVEL SECURITY;

-- Templates: All authenticated can view, management can edit
CREATE POLICY "Authenticated can view protokoll_templates"
  ON protokoll_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert protokoll_templates"
  ON protokoll_templates FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update protokoll_templates"
  ON protokoll_templates FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete protokoll_templates"
  ON protokoll_templates FOR DELETE
  TO authenticated
  USING (is_management());

-- Protocols: All authenticated can view, management can edit
CREATE POLICY "Authenticated can view proben_protokolle"
  ON proben_protokolle FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert proben_protokolle"
  ON proben_protokolle FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update proben_protokolle"
  ON proben_protokolle FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete proben_protokolle"
  ON proben_protokolle FOR DELETE
  TO authenticated
  USING (is_management());

-- Scene notes follow protocol access
CREATE POLICY "Authenticated can view protokoll_szenen_notizen"
  ON protokoll_szenen_notizen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can manage protokoll_szenen_notizen"
  ON protokoll_szenen_notizen FOR ALL
  TO authenticated
  USING (is_management());

-- Tasks: All can view, management can manage
CREATE POLICY "Authenticated can view protokoll_aufgaben"
  ON protokoll_aufgaben FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can manage protokoll_aufgaben"
  ON protokoll_aufgaben FOR ALL
  TO authenticated
  USING (is_management());

-- Users can update their own task status
CREATE POLICY "Users can update own task status"
  ON protokoll_aufgaben FOR UPDATE
  TO authenticated
  USING (
    zustaendig_id IN (
      SELECT pe.id FROM personen pe
      JOIN profiles pr ON pr.email = pe.email
      WHERE pr.id = auth.uid()
    )
  )
  WITH CHECK (
    zustaendig_id IN (
      SELECT pe.id FROM personen pe
      JOIN profiles pr ON pr.email = pe.email
      WHERE pr.id = auth.uid()
    )
  );

-- =============================================================================
-- Insert Default Template
-- =============================================================================

INSERT INTO protokoll_templates (name, beschreibung, struktur, ist_standard)
VALUES (
  'Standard Probenprotokoll',
  'Allgemeine Vorlage für Probenprotokolle',
  '[
    {"typ": "abschnitt", "titel": "Anwesenheit", "id": "anwesenheit"},
    {"typ": "abschnitt", "titel": "Warm-up / Einstimmung", "id": "warmup"},
    {"typ": "abschnitt", "titel": "Probeninhalt", "id": "inhalt"},
    {"typ": "abschnitt", "titel": "Technische Hinweise", "id": "technik"},
    {"typ": "abschnitt", "titel": "Nächste Schritte", "id": "naechste_schritte"},
    {"typ": "abschnitt", "titel": "Allgemeine Notizen", "id": "notizen"}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE protokoll_templates IS 'Templates for rehearsal protocol structure';
COMMENT ON TABLE proben_protokolle IS 'Rehearsal protocols/minutes for each probe';
COMMENT ON TABLE protokoll_szenen_notizen IS 'Scene-specific notes within a protocol';
COMMENT ON TABLE protokoll_aufgaben IS 'Tasks created from protocols';
