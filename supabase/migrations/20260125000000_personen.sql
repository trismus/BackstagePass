-- Migration: Create personen table for member management
-- Issue: #33, #43

-- Create table
CREATE TABLE personen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  strasse TEXT,
  plz TEXT,
  ort TEXT,
  geburtstag DATE,
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

-- Seed data: 5 demo members with addresses
INSERT INTO personen (vorname, nachname, strasse, plz, ort, geburtstag, email, telefon, rolle, aktiv, notizen) VALUES
  ('Anna', 'Müller', 'Theaterstraße 12', '80331', 'München', '1985-03-15', 'anna.mueller@theater.de', '+49 171 1234567', 'vorstand', true, 'Erste Vorsitzende seit 2020'),
  ('Max', 'Schmidt', 'Bühnenweg 5', '80333', 'München', '1978-07-22', 'max.schmidt@theater.de', '+49 172 2345678', 'regie', true, 'Hauptregisseur'),
  ('Lisa', 'Weber', 'Kulissenplatz 8', '80335', 'München', '1992-11-08', 'lisa.weber@theater.de', '+49 173 3456789', 'mitglied', true, 'Schauspielerin'),
  ('Tom', 'Fischer', 'Scheinwerferstr. 23', '80337', 'München', '1988-01-30', 'tom.fischer@theater.de', '+49 174 4567890', 'technik', true, 'Licht und Ton'),
  ('Sarah', 'Wagner', 'Maskenbildnerallee 7', '80339', 'München', '1995-06-12', 'sarah.wagner@theater.de', '+49 175 5678901', 'mitglied', true, 'Kostüm und Maske');
