-- Migration: Replace offset_minuten/dauer_minuten with startzeit/endzeit on template tables
-- Reason: Offset-based model was confusing for users. Fixed times (HH:MM) are more intuitive
-- and match the real zeitbloecke/info_bloecke format.

-- =============================================================================
-- template_zeitbloecke: offset_minuten/dauer_minuten -> startzeit/endzeit
-- =============================================================================

-- Add new columns
ALTER TABLE template_zeitbloecke
  ADD COLUMN startzeit TEXT,
  ADD COLUMN endzeit TEXT;

-- Convert existing data using 19:00 as default performance start
-- startzeit = 19:00 + offset_minuten
-- endzeit = startzeit + dauer_minuten
UPDATE template_zeitbloecke
SET
  startzeit = LPAD(((19 * 60 + offset_minuten) / 60)::TEXT, 2, '0') || ':' || LPAD(((19 * 60 + offset_minuten) % 60)::TEXT, 2, '0'),
  endzeit = LPAD(((19 * 60 + offset_minuten + dauer_minuten) / 60)::TEXT, 2, '0') || ':' || LPAD(((19 * 60 + offset_minuten + dauer_minuten) % 60)::TEXT, 2, '0');

-- Set NOT NULL after data migration
ALTER TABLE template_zeitbloecke
  ALTER COLUMN startzeit SET NOT NULL,
  ALTER COLUMN endzeit SET NOT NULL;

-- Drop old columns
ALTER TABLE template_zeitbloecke
  DROP COLUMN offset_minuten,
  DROP COLUMN dauer_minuten;

-- =============================================================================
-- template_info_bloecke: offset_minuten/dauer_minuten -> startzeit/endzeit
-- =============================================================================

-- Add new columns
ALTER TABLE template_info_bloecke
  ADD COLUMN startzeit TEXT,
  ADD COLUMN endzeit TEXT;

-- Convert existing data using 19:00 as default performance start
UPDATE template_info_bloecke
SET
  startzeit = LPAD(((19 * 60 + offset_minuten) / 60)::TEXT, 2, '0') || ':' || LPAD(((19 * 60 + offset_minuten) % 60)::TEXT, 2, '0'),
  endzeit = LPAD(((19 * 60 + offset_minuten + dauer_minuten) / 60)::TEXT, 2, '0') || ':' || LPAD(((19 * 60 + offset_minuten + dauer_minuten) % 60)::TEXT, 2, '0');

-- Set NOT NULL after data migration
ALTER TABLE template_info_bloecke
  ALTER COLUMN startzeit SET NOT NULL,
  ALTER COLUMN endzeit SET NOT NULL;

-- Drop old columns
ALTER TABLE template_info_bloecke
  DROP COLUMN offset_minuten,
  DROP COLUMN dauer_minuten;
