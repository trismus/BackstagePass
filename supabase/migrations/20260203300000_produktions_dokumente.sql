-- Migration: Produktions-Dokumente (Issue #160)
-- Dokumentenverwaltung für produktionsbezogene Dateien mit Versionierung

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE dokument_kategorie AS ENUM (
  'skript',
  'spielplan',
  'technik',
  'requisiten',
  'kostueme',
  'werbung',
  'sonstiges'
);

CREATE TYPE dokument_status AS ENUM (
  'entwurf',
  'freigegeben'
);

-- =============================================================================
-- Tables
-- =============================================================================

CREATE TABLE produktions_dokumente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produktion_id UUID NOT NULL REFERENCES produktionen(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kategorie dokument_kategorie NOT NULL DEFAULT 'sonstiges',
  datei_pfad TEXT NOT NULL,
  datei_name TEXT NOT NULL,
  datei_groesse INTEGER,
  mime_type TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  vorgaenger_id UUID REFERENCES produktions_dokumente(id) ON DELETE SET NULL,
  status dokument_status NOT NULL DEFAULT 'entwurf',
  hochgeladen_von UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_prod_dokumente_produktion ON produktions_dokumente(produktion_id);
CREATE INDEX idx_prod_dokumente_kategorie ON produktions_dokumente(kategorie);
CREATE INDEX idx_prod_dokumente_status ON produktions_dokumente(status);
CREATE INDEX idx_prod_dokumente_vorgaenger ON produktions_dokumente(vorgaenger_id);

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE TRIGGER set_produktions_dokumente_updated_at
  BEFORE UPDATE ON produktions_dokumente
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE produktions_dokumente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view produktions_dokumente"
  ON produktions_dokumente FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert produktions_dokumente"
  ON produktions_dokumente FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update produktions_dokumente"
  ON produktions_dokumente FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete produktions_dokumente"
  ON produktions_dokumente FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- Storage Bucket
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'produktions-dokumente',
  'produktions-dokumente',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Authenticated users can read
CREATE POLICY "Authenticated users can read produktions-dokumente"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'produktions-dokumente');

-- Storage RLS: Management can upload
CREATE POLICY "Management can upload produktions-dokumente"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'produktions-dokumente' AND is_management());

-- Storage RLS: Management can delete
CREATE POLICY "Management can delete produktions-dokumente"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'produktions-dokumente' AND is_management());

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE produktions_dokumente IS 'Produktionsbezogene Dokumente mit Versionierung und Kategorisierung';
