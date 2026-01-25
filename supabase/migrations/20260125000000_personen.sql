-- Migration: Create personen table for member management
-- Issue: #33

-- Create table
CREATE TABLE personen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  email TEXT UNIQUE,
  telefon TEXT,
  rolle TEXT DEFAULT 'mitglied' CHECK (rolle IN ('mitglied', 'vorstand', 'gast', 'regie', 'technik')),
  aktiv BOOLEAN DEFAULT true,
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE personen ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "personen_select" ON personen
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "personen_insert" ON personen
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "personen_update" ON personen
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "personen_delete" ON personen
  FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personen_updated_at
  BEFORE UPDATE ON personen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed data for development
INSERT INTO personen (vorname, nachname, email, telefon, rolle, aktiv) VALUES
  ('Anna', 'Müller', 'anna.mueller@theater.de', '+49 171 1234567', 'vorstand', true),
  ('Max', 'Schmidt', 'max.schmidt@theater.de', '+49 172 2345678', 'regie', true),
  ('Lisa', 'Weber', 'lisa.weber@theater.de', '+49 173 3456789', 'mitglied', true),
  ('Tom', 'Fischer', 'tom.fischer@theater.de', '+49 174 4567890', 'technik', true),
  ('Sarah', 'Wagner', 'sarah.wagner@theater.de', '+49 175 5678901', 'mitglied', true),
  ('Jan', 'Becker', NULL, '+49 176 6789012', 'gast', false);
