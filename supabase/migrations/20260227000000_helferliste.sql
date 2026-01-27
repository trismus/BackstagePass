-- Migration: Helferliste (Helper List Feature)
-- Created: 2026-02-27
-- Issues: #115, #116, #117, #118
-- Description: Comprehensive helper management system for theater performances
--   - Internal members (authenticated)
--   - External helpers (public registration without login)
--   - Template-based role creation
--   - Public shareable links

-- =============================================================================
-- HELPER FUNCTIONS (CREATE OR REPLACE to ensure they exist)
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is management (ADMIN or VORSTAND)
CREATE OR REPLACE FUNCTION is_management()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'VORSTAND')
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TABLE: helfer_events (Wrapper for events needing helpers)
-- =============================================================================

CREATE TABLE IF NOT EXISTS helfer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  typ TEXT NOT NULL CHECK (typ IN ('auffuehrung', 'helfereinsatz')),
  veranstaltung_id UUID, -- FK to veranstaltungen added separately if table exists
  name TEXT NOT NULL,
  beschreibung TEXT,
  datum_start TIMESTAMPTZ NOT NULL,
  datum_end TIMESTAMPTZ NOT NULL,
  ort TEXT,
  public_token UUID DEFAULT gen_random_uuid(), -- for public shareable links
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE helfer_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "helfer_events_select" ON helfer_events;
DROP POLICY IF EXISTS "helfer_events_insert" ON helfer_events;
DROP POLICY IF EXISTS "helfer_events_update" ON helfer_events;
DROP POLICY IF EXISTS "helfer_events_delete" ON helfer_events;

-- Policy: All authenticated users can read events
CREATE POLICY "helfer_events_select"
  ON helfer_events FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Public access via token (for anonymous users)
CREATE POLICY "helfer_events_select_public"
  ON helfer_events FOR SELECT
  TO anon
  USING (true);

-- Policy: Management can create events
CREATE POLICY "helfer_events_insert"
  ON helfer_events FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

-- Policy: Management can update events
CREATE POLICY "helfer_events_update"
  ON helfer_events FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- Policy: Only admin can delete events
CREATE POLICY "helfer_events_delete"
  ON helfer_events FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create indexes
CREATE INDEX IF NOT EXISTS helfer_events_datum_idx ON helfer_events(datum_start DESC);
CREATE INDEX IF NOT EXISTS helfer_events_veranstaltung_idx ON helfer_events(veranstaltung_id);
CREATE INDEX IF NOT EXISTS helfer_events_public_token_idx ON helfer_events(public_token);
CREATE INDEX IF NOT EXISTS helfer_events_typ_idx ON helfer_events(typ);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_helfer_events_updated_at ON helfer_events;
CREATE TRIGGER update_helfer_events_updated_at
  BEFORE UPDATE ON helfer_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: helfer_rollen_templates (Reusable role templates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS helfer_rollen_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  beschreibung TEXT,
  default_anzahl INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE helfer_rollen_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "helfer_rollen_templates_select" ON helfer_rollen_templates;
DROP POLICY IF EXISTS "helfer_rollen_templates_insert" ON helfer_rollen_templates;
DROP POLICY IF EXISTS "helfer_rollen_templates_update" ON helfer_rollen_templates;
DROP POLICY IF EXISTS "helfer_rollen_templates_delete" ON helfer_rollen_templates;

-- Policy: All authenticated users can read templates
CREATE POLICY "helfer_rollen_templates_select"
  ON helfer_rollen_templates FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Management can create templates
CREATE POLICY "helfer_rollen_templates_insert"
  ON helfer_rollen_templates FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

-- Policy: Management can update templates
CREATE POLICY "helfer_rollen_templates_update"
  ON helfer_rollen_templates FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- Policy: Only admin can delete templates
CREATE POLICY "helfer_rollen_templates_delete"
  ON helfer_rollen_templates FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create indexes
CREATE INDEX IF NOT EXISTS helfer_rollen_templates_name_idx ON helfer_rollen_templates(name);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_helfer_rollen_templates_updated_at ON helfer_rollen_templates;
CREATE TRIGGER update_helfer_rollen_templates_updated_at
  BEFORE UPDATE ON helfer_rollen_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: helfer_rollen_instanzen (Specific roles per event)
-- =============================================================================

CREATE TABLE IF NOT EXISTS helfer_rollen_instanzen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helfer_event_id UUID NOT NULL REFERENCES helfer_events(id) ON DELETE CASCADE,
  template_id UUID REFERENCES helfer_rollen_templates(id) ON DELETE SET NULL,
  custom_name TEXT, -- if no template used
  zeitblock_start TIMESTAMPTZ,
  zeitblock_end TIMESTAMPTZ,
  anzahl_benoetigt INTEGER DEFAULT 1,
  sichtbarkeit TEXT DEFAULT 'intern' CHECK (sichtbarkeit IN ('intern', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT template_or_custom CHECK (
    template_id IS NOT NULL OR custom_name IS NOT NULL
  )
);

-- Enable Row Level Security
ALTER TABLE helfer_rollen_instanzen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "helfer_rollen_instanzen_select" ON helfer_rollen_instanzen;
DROP POLICY IF EXISTS "helfer_rollen_instanzen_select_public" ON helfer_rollen_instanzen;
DROP POLICY IF EXISTS "helfer_rollen_instanzen_insert" ON helfer_rollen_instanzen;
DROP POLICY IF EXISTS "helfer_rollen_instanzen_update" ON helfer_rollen_instanzen;
DROP POLICY IF EXISTS "helfer_rollen_instanzen_delete" ON helfer_rollen_instanzen;

-- Policy: Authenticated users can read all role instances
CREATE POLICY "helfer_rollen_instanzen_select"
  ON helfer_rollen_instanzen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Public access for roles marked as 'public'
CREATE POLICY "helfer_rollen_instanzen_select_public"
  ON helfer_rollen_instanzen FOR SELECT
  TO anon
  USING (sichtbarkeit = 'public');

-- Policy: Management can create role instances
CREATE POLICY "helfer_rollen_instanzen_insert"
  ON helfer_rollen_instanzen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

-- Policy: Management can update role instances
CREATE POLICY "helfer_rollen_instanzen_update"
  ON helfer_rollen_instanzen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- Policy: Management can delete role instances
CREATE POLICY "helfer_rollen_instanzen_delete"
  ON helfer_rollen_instanzen FOR DELETE
  TO authenticated
  USING (is_management());

-- Create indexes
CREATE INDEX IF NOT EXISTS helfer_rollen_instanzen_event_idx ON helfer_rollen_instanzen(helfer_event_id);
CREATE INDEX IF NOT EXISTS helfer_rollen_instanzen_template_idx ON helfer_rollen_instanzen(template_id);
CREATE INDEX IF NOT EXISTS helfer_rollen_instanzen_sichtbarkeit_idx ON helfer_rollen_instanzen(sichtbarkeit);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_helfer_rollen_instanzen_updated_at ON helfer_rollen_instanzen;
CREATE TRIGGER update_helfer_rollen_instanzen_updated_at
  BEFORE UPDATE ON helfer_rollen_instanzen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: helfer_anmeldungen (Registrations)
-- =============================================================================

CREATE TABLE IF NOT EXISTS helfer_anmeldungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rollen_instanz_id UUID NOT NULL REFERENCES helfer_rollen_instanzen(id) ON DELETE CASCADE,
  profile_id UUID, -- nullable for external helpers, FK to profiles added separately if table exists
  external_name TEXT,
  external_email TEXT,
  external_telefon TEXT,
  status TEXT DEFAULT 'angemeldet' CHECK (status IN ('angemeldet', 'bestaetigt', 'abgelehnt', 'warteliste')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT internal_or_external CHECK (
    (profile_id IS NOT NULL AND external_name IS NULL) OR
    (profile_id IS NULL AND external_name IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE helfer_anmeldungen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "helfer_anmeldungen_select" ON helfer_anmeldungen;
DROP POLICY IF EXISTS "helfer_anmeldungen_select_own" ON helfer_anmeldungen;
DROP POLICY IF EXISTS "helfer_anmeldungen_insert" ON helfer_anmeldungen;
DROP POLICY IF EXISTS "helfer_anmeldungen_insert_public" ON helfer_anmeldungen;
DROP POLICY IF EXISTS "helfer_anmeldungen_update" ON helfer_anmeldungen;
DROP POLICY IF EXISTS "helfer_anmeldungen_delete" ON helfer_anmeldungen;
DROP POLICY IF EXISTS "helfer_anmeldungen_delete_own" ON helfer_anmeldungen;

-- Policy: Management can see all registrations
CREATE POLICY "helfer_anmeldungen_select"
  ON helfer_anmeldungen FOR SELECT
  TO authenticated
  USING (is_management());

-- Policy: Users can see their own registrations
CREATE POLICY "helfer_anmeldungen_select_own"
  ON helfer_anmeldungen FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Policy: Authenticated users can register (for internal roles)
CREATE POLICY "helfer_anmeldungen_insert"
  ON helfer_anmeldungen FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role_permission(ARRAY['ADMIN', 'VORSTAND', 'MITGLIED_AKTIV', 'HELFER'])
  );

-- Policy: Anonymous users can register for public roles
CREATE POLICY "helfer_anmeldungen_insert_public"
  ON helfer_anmeldungen FOR INSERT
  TO anon
  WITH CHECK (
    external_name IS NOT NULL
    AND profile_id IS NULL
    AND EXISTS (
      SELECT 1 FROM helfer_rollen_instanzen
      WHERE id = rollen_instanz_id
      AND sichtbarkeit = 'public'
    )
  );

-- Policy: Management can update any registration
CREATE POLICY "helfer_anmeldungen_update"
  ON helfer_anmeldungen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- Policy: Users can update their own registration (status changes)
CREATE POLICY "helfer_anmeldungen_update_own"
  ON helfer_anmeldungen FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

-- Policy: Management can delete any registration
CREATE POLICY "helfer_anmeldungen_delete"
  ON helfer_anmeldungen FOR DELETE
  TO authenticated
  USING (is_management());

-- Policy: Users can delete their own registration
CREATE POLICY "helfer_anmeldungen_delete_own"
  ON helfer_anmeldungen FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS helfer_anmeldungen_instanz_idx ON helfer_anmeldungen(rollen_instanz_id);
CREATE INDEX IF NOT EXISTS helfer_anmeldungen_profile_idx ON helfer_anmeldungen(profile_id);
CREATE INDEX IF NOT EXISTS helfer_anmeldungen_status_idx ON helfer_anmeldungen(status);

-- =============================================================================
-- SEED DATA: Default role templates
-- =============================================================================

INSERT INTO helfer_rollen_templates (name, beschreibung, default_anzahl) VALUES
  ('Einlass', 'Kontrolliert Tickets und begrüsst das Publikum', 2),
  ('Garderobe', 'Nimmt Jacken und Taschen entgegen', 2),
  ('Bar', 'Bedient an der Bar', 3),
  ('Küche', 'Bereitet Speisen vor und serviert', 2),
  ('Technik Licht', 'Bedient die Lichttechnik', 1),
  ('Technik Ton', 'Bedient die Tontechnik', 1),
  ('Aufbau', 'Hilft beim Aufbau vor der Veranstaltung', 4),
  ('Abbau', 'Hilft beim Abbau nach der Veranstaltung', 4),
  ('Catering', 'Betreut das Catering für das Team', 2),
  ('Platzanweisung', 'Führt Gäste zu ihren Plätzen', 2)
ON CONFLICT DO NOTHING;
