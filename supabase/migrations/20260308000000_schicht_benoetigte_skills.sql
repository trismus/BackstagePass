-- Add benoetigte_skills column to shifts and template shifts
-- Issue #347: Skills-basierte Schicht-Vorschlaege

ALTER TABLE auffuehrung_schichten ADD COLUMN benoetigte_skills text[] DEFAULT '{}';
ALTER TABLE template_schichten ADD COLUMN benoetigte_skills text[] DEFAULT '{}';
