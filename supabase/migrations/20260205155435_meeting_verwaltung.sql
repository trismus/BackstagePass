-- Migration: Meeting-Verwaltung (Issue #169)
-- Extends the event system with specific meeting functions

-- =============================================================================
-- Add 'meeting' to veranstaltungen.typ
-- =============================================================================

-- Drop and recreate the check constraint to add 'meeting' type
ALTER TABLE veranstaltungen
  DROP CONSTRAINT IF EXISTS veranstaltungen_typ_check;

ALTER TABLE veranstaltungen
  ADD CONSTRAINT veranstaltungen_typ_check
  CHECK (typ IN ('vereinsevent', 'probe', 'auffuehrung', 'sonstiges', 'meeting'));

-- =============================================================================
-- Meeting Details Table (extends veranstaltungen for meeting-specific data)
-- =============================================================================

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veranstaltung_id UUID NOT NULL REFERENCES veranstaltungen(id) ON DELETE CASCADE,

  -- Meeting type
  meeting_typ TEXT NOT NULL DEFAULT 'team' CHECK (meeting_typ IN ('vorstand', 'regie', 'team', 'sonstiges')),

  -- Leiter/Chair
  leiter_id UUID REFERENCES personen(id) ON DELETE SET NULL,

  -- Protocol
  protokoll TEXT,
  protokoll_status TEXT DEFAULT 'entwurf' CHECK (protokoll_status IN ('entwurf', 'genehmigt', 'verteilt')),
  protokollant_id UUID REFERENCES personen(id) ON DELETE SET NULL,

  -- Recurring meeting reference
  wiederkehrend_template_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one meeting record per veranstaltung
  CONSTRAINT unique_meeting_veranstaltung UNIQUE (veranstaltung_id)
);

-- =============================================================================
-- Meeting Agenda Items
-- =============================================================================

CREATE TABLE IF NOT EXISTS meeting_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

  -- Agenda item details
  nummer INTEGER NOT NULL,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  dauer_minuten INTEGER,

  -- Who presents/is responsible
  verantwortlich_id UUID REFERENCES personen(id) ON DELETE SET NULL,

  -- Status tracking
  status TEXT DEFAULT 'offen' CHECK (status IN ('offen', 'besprochen', 'vertagt', 'abgeschlossen')),
  notizen TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Meeting Decisions/Resolutions (Beschluesse)
-- =============================================================================

CREATE TABLE IF NOT EXISTS meeting_beschluesse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

  -- Optionally linked to agenda item
  agenda_item_id UUID REFERENCES meeting_agenda(id) ON DELETE SET NULL,

  -- Decision details
  nummer INTEGER NOT NULL, -- Sequential number for this meeting
  titel TEXT NOT NULL,
  beschreibung TEXT,

  -- Voting results (optional)
  abstimmung_ja INTEGER,
  abstimmung_nein INTEGER,
  abstimmung_enthaltung INTEGER,

  -- Status and follow-up
  status TEXT DEFAULT 'beschlossen' CHECK (status IN ('beschlossen', 'abgelehnt', 'vertagt', 'umgesetzt')),

  -- Responsible person for implementation
  zustaendig_id UUID REFERENCES personen(id) ON DELETE SET NULL,
  faellig_bis DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Meeting Templates (for recurring meetings)
-- =============================================================================

CREATE TABLE IF NOT EXISTS meeting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  beschreibung TEXT,
  meeting_typ TEXT NOT NULL DEFAULT 'team' CHECK (meeting_typ IN ('vorstand', 'regie', 'team', 'sonstiges')),

  -- Default settings
  default_ort TEXT,
  default_startzeit TIME,
  default_dauer_minuten INTEGER DEFAULT 60,
  default_leiter_id UUID REFERENCES personen(id) ON DELETE SET NULL,

  -- Recurrence pattern
  wiederholung_typ TEXT CHECK (wiederholung_typ IN ('woechentlich', 'zweiwoechentlich', 'monatlich')),
  wiederholung_tag INTEGER, -- 0=Sunday, 1=Monday, etc. for weekly; 1-31 for monthly

  -- Standard agenda items (JSON array)
  standard_agenda JSONB DEFAULT '[]',

  aktiv BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_meetings_veranstaltung ON meetings(veranstaltung_id);
CREATE INDEX IF NOT EXISTS idx_meetings_typ ON meetings(meeting_typ);
CREATE INDEX IF NOT EXISTS idx_meetings_template ON meetings(wiederkehrend_template_id);

CREATE INDEX IF NOT EXISTS idx_meeting_agenda_meeting ON meeting_agenda(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_agenda_nummer ON meeting_agenda(meeting_id, nummer);

CREATE INDEX IF NOT EXISTS idx_meeting_beschluesse_meeting ON meeting_beschluesse(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_beschluesse_status ON meeting_beschluesse(status) WHERE status != 'umgesetzt';
CREATE INDEX IF NOT EXISTS idx_meeting_beschluesse_zustaendig ON meeting_beschluesse(zustaendig_id);

CREATE INDEX IF NOT EXISTS idx_meeting_templates_typ ON meeting_templates(meeting_typ);
CREATE INDEX IF NOT EXISTS idx_meeting_templates_aktiv ON meeting_templates(aktiv) WHERE aktiv = true;

-- =============================================================================
-- Updated_at Triggers
-- =============================================================================

CREATE TRIGGER set_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_meeting_agenda_updated_at
  BEFORE UPDATE ON meeting_agenda
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_meeting_beschluesse_updated_at
  BEFORE UPDATE ON meeting_beschluesse
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_meeting_templates_updated_at
  BEFORE UPDATE ON meeting_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_beschluesse ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_templates ENABLE ROW LEVEL SECURITY;

-- Meetings: Follow veranstaltungen access (authenticated can read, management can write)
CREATE POLICY "Authenticated can view meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (is_management());

-- Agenda: Follow meeting access
CREATE POLICY "Authenticated can view meeting_agenda"
  ON meeting_agenda FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can manage meeting_agenda"
  ON meeting_agenda FOR ALL
  TO authenticated
  USING (is_management());

-- Beschluesse: All can view, management can manage
CREATE POLICY "Authenticated can view meeting_beschluesse"
  ON meeting_beschluesse FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can manage meeting_beschluesse"
  ON meeting_beschluesse FOR ALL
  TO authenticated
  USING (is_management());

-- Templates: All can view, management can manage
CREATE POLICY "Authenticated can view meeting_templates"
  ON meeting_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert meeting_templates"
  ON meeting_templates FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update meeting_templates"
  ON meeting_templates FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete meeting_templates"
  ON meeting_templates FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE meetings IS 'Extended meeting data for veranstaltungen with typ=meeting';
COMMENT ON TABLE meeting_agenda IS 'Agenda items for meetings';
COMMENT ON TABLE meeting_beschluesse IS 'Decisions/resolutions from meetings';
COMMENT ON TABLE meeting_templates IS 'Templates for recurring meetings';
