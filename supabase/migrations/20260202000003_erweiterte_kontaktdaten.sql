-- Migration: Erweiterte Kontaktdaten (Issue #3)
-- Adds flexible contact management with multiple phone numbers and preferences

-- ============================================================================
-- Extended Contact Fields
-- ============================================================================

-- Additional phone numbers (JSONB for flexibility)
-- Format: [{"typ": "mobil", "nummer": "+41...", "ist_bevorzugt": true}, ...]
ALTER TABLE personen ADD COLUMN IF NOT EXISTS telefon_nummern JSONB DEFAULT '[]'::jsonb;

-- Preferred contact method
ALTER TABLE personen ADD COLUMN IF NOT EXISTS bevorzugte_kontaktart TEXT CHECK (
  bevorzugte_kontaktart IS NULL OR
  bevorzugte_kontaktart IN ('telefon', 'email', 'whatsapp', 'sms')
);

-- Social media links (JSONB for flexibility)
-- Format: {"instagram": "@handle", "facebook": "url", "linkedin": "url"}
ALTER TABLE personen ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb;

-- Contact notes (e.g., "Don't call before 10 AM")
ALTER TABLE personen ADD COLUMN IF NOT EXISTS kontakt_notizen TEXT;

-- ============================================================================
-- Indexes
-- ============================================================================

-- GIN index for searching within contact data
CREATE INDEX IF NOT EXISTS idx_personen_telefon_nummern ON personen USING GIN (telefon_nummern);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN personen.telefon_nummern IS 'Multiple phone numbers as JSONB array: [{typ, nummer, ist_bevorzugt}]';
COMMENT ON COLUMN personen.bevorzugte_kontaktart IS 'Preferred contact method: telefon, email, whatsapp, sms';
COMMENT ON COLUMN personen.social_media IS 'Social media links as JSONB object: {platform: handle/url}';
COMMENT ON COLUMN personen.kontakt_notizen IS 'Contact notes, e.g., availability preferences';
