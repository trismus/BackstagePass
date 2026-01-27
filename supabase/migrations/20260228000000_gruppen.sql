-- =============================================================================
-- Migration: Gruppen (Teams, Gremien, Produktions-Casts)
-- Issue: Dashboards Milestone #D1
-- =============================================================================

-- 1. Enum für Gruppen-Typen
CREATE TYPE gruppen_typ AS ENUM ('team', 'gremium', 'produktion', 'sonstiges');

-- 2. Gruppen-Tabelle
CREATE TABLE gruppen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  typ gruppen_typ NOT NULL DEFAULT 'sonstiges',
  beschreibung TEXT,
  stueck_id UUID REFERENCES stuecke(id) ON DELETE SET NULL,
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Gruppen-Mitgliedschaften
CREATE TABLE gruppen_mitglieder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gruppe_id UUID NOT NULL REFERENCES gruppen(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  rolle_in_gruppe TEXT,
  von DATE,
  bis DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gruppe_id, person_id)
);

-- 4. Indizes für Performance
CREATE INDEX idx_gruppen_typ ON gruppen(typ);
CREATE INDEX idx_gruppen_aktiv ON gruppen(aktiv);
CREATE INDEX idx_gruppen_stueck ON gruppen(stueck_id);
CREATE INDEX idx_gruppen_mitglieder_person ON gruppen_mitglieder(person_id);
CREATE INDEX idx_gruppen_mitglieder_gruppe ON gruppen_mitglieder(gruppe_id);

-- 5. Updated_at Trigger für gruppen
CREATE TRIGGER update_gruppen_updated_at
  BEFORE UPDATE ON gruppen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS Policies

-- gruppen: Lesezugriff für alle authentifizierten User
ALTER TABLE gruppen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gruppen lesen für authentifizierte User"
  ON gruppen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gruppen erstellen für ADMIN/VORSTAND"
  ON gruppen FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'VORSTAND')
    )
  );

CREATE POLICY "Gruppen bearbeiten für ADMIN/VORSTAND"
  ON gruppen FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'VORSTAND')
    )
  );

CREATE POLICY "Gruppen löschen für ADMIN"
  ON gruppen FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- gruppen_mitglieder: Ähnliche Policies
ALTER TABLE gruppen_mitglieder ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gruppen-Mitglieder lesen für authentifizierte User"
  ON gruppen_mitglieder FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gruppen-Mitglieder verwalten für ADMIN/VORSTAND"
  ON gruppen_mitglieder FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'VORSTAND')
    )
  );

CREATE POLICY "Gruppen-Mitglieder bearbeiten für ADMIN/VORSTAND"
  ON gruppen_mitglieder FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'VORSTAND')
    )
  );

CREATE POLICY "Gruppen-Mitglieder löschen für ADMIN/VORSTAND"
  ON gruppen_mitglieder FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'VORSTAND')
    )
  );

-- 7. Vordefinierte Gruppen einfügen
INSERT INTO gruppen (name, typ, beschreibung) VALUES
  ('Vorstand', 'gremium', 'Vereinsvorstand'),
  ('Technik-Team', 'team', 'Technik & Bühnenbau'),
  ('Maske & Kostüm', 'team', 'Maske und Kostümabteilung'),
  ('Regie-Team', 'team', 'Regie und Regieassistenz');

-- 8. Kommentare für Dokumentation
COMMENT ON TABLE gruppen IS 'Gruppen für Teams, Gremien und Produktions-Casts';
COMMENT ON TABLE gruppen_mitglieder IS 'Zuordnung von Personen zu Gruppen mit optionaler Rolle';
COMMENT ON COLUMN gruppen.stueck_id IS 'Verknüpfung mit Stück für Produktions-Casts (typ=produktion)';
COMMENT ON COLUMN gruppen_mitglieder.rolle_in_gruppe IS 'Optionale Rolle innerhalb der Gruppe (z.B. Teamleiter, Kassier)';
COMMENT ON COLUMN gruppen_mitglieder.von IS 'Beginn der Mitgliedschaft (optional)';
COMMENT ON COLUMN gruppen_mitglieder.bis IS 'Ende der Mitgliedschaft (optional, NULL = aktiv)';
