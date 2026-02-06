-- Migration: Partner-Kontingente
-- Issue #174: Kontingent-Verwaltung fuer Partnervereine mit Soll/Ist-Tracking

-- =============================================================================
-- TABLE: partner_kontingente
-- Defines helper contingents for partner organizations per production series
-- =============================================================================

CREATE TABLE IF NOT EXISTS partner_kontingente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner(id) ON DELETE CASCADE,
  serie_id UUID NOT NULL REFERENCES auffuehrungsserien(id) ON DELETE CASCADE,
  soll_stunden NUMERIC(6,2) NOT NULL DEFAULT 0,
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, serie_id)
);

-- =============================================================================
-- TABLE: partner_kontingent_zuweisungen
-- Tracks actual helper contributions from partners
-- =============================================================================

CREATE TABLE IF NOT EXISTS partner_kontingent_zuweisungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kontingent_id UUID NOT NULL REFERENCES partner_kontingente(id) ON DELETE CASCADE,
  zuweisung_id UUID NOT NULL REFERENCES auffuehrung_zuweisungen(id) ON DELETE CASCADE,
  stunden NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kontingent_id, zuweisung_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_partner_kontingente_partner
  ON partner_kontingente(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_kontingente_serie
  ON partner_kontingente(serie_id);
CREATE INDEX IF NOT EXISTS idx_partner_kontingent_zuweisungen_kontingent
  ON partner_kontingent_zuweisungen(kontingent_id);
CREATE INDEX IF NOT EXISTS idx_partner_kontingent_zuweisungen_zuweisung
  ON partner_kontingent_zuweisungen(zuweisung_id);

-- =============================================================================
-- Triggers
-- =============================================================================

CREATE TRIGGER set_partner_kontingente_updated_at
  BEFORE UPDATE ON partner_kontingente
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE partner_kontingente ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_kontingent_zuweisungen ENABLE ROW LEVEL SECURITY;

-- Partner kontingente policies
CREATE POLICY "Authenticated users can view partner_kontingente"
  ON partner_kontingente FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert partner_kontingente"
  ON partner_kontingente FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update partner_kontingente"
  ON partner_kontingente FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete partner_kontingente"
  ON partner_kontingente FOR DELETE
  TO authenticated
  USING (is_management());

-- Partner kontingent zuweisungen policies
CREATE POLICY "Authenticated users can view partner_kontingent_zuweisungen"
  ON partner_kontingent_zuweisungen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert partner_kontingent_zuweisungen"
  ON partner_kontingent_zuweisungen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update partner_kontingent_zuweisungen"
  ON partner_kontingent_zuweisungen FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete partner_kontingent_zuweisungen"
  ON partner_kontingent_zuweisungen FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- View: partner_kontingent_uebersicht
-- Provides Soll/Ist overview for each kontingent
-- =============================================================================

CREATE OR REPLACE VIEW partner_kontingent_uebersicht AS
SELECT
  pk.id,
  pk.partner_id,
  p.name AS partner_name,
  pk.serie_id,
  s.name AS serie_name,
  pk.soll_stunden,
  COALESCE(SUM(pkz.stunden), 0) AS ist_stunden,
  pk.soll_stunden - COALESCE(SUM(pkz.stunden), 0) AS differenz,
  CASE
    WHEN pk.soll_stunden = 0 THEN 100
    ELSE ROUND((COALESCE(SUM(pkz.stunden), 0) / pk.soll_stunden) * 100, 1)
  END AS erfuellungsgrad,
  pk.notizen,
  pk.created_at,
  pk.updated_at
FROM partner_kontingente pk
JOIN partner p ON p.id = pk.partner_id
JOIN auffuehrungsserien s ON s.id = pk.serie_id
LEFT JOIN partner_kontingent_zuweisungen pkz ON pkz.kontingent_id = pk.id
GROUP BY pk.id, pk.partner_id, p.name, pk.serie_id, s.name, pk.soll_stunden, pk.notizen, pk.created_at, pk.updated_at;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE partner_kontingente IS 'Helper contingent agreements with partner organizations per production series';
COMMENT ON TABLE partner_kontingent_zuweisungen IS 'Actual helper contributions tracked against contingent agreements';
COMMENT ON VIEW partner_kontingent_uebersicht IS 'Overview of Soll/Ist tracking for partner contingents';
COMMENT ON COLUMN partner_kontingente.soll_stunden IS 'Target hours the partner should contribute';
COMMENT ON COLUMN partner_kontingent_zuweisungen.stunden IS 'Actual hours contributed by this assignment';
