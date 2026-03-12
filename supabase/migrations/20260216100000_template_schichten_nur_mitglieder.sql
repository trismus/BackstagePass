-- Add nur_mitglieder flag to template_schichten
-- When true, generated auffuehrung_schichten get sichtbarkeit='intern'
-- When false (default), they get sichtbarkeit='public'

ALTER TABLE template_schichten
  ADD COLUMN nur_mitglieder BOOLEAN DEFAULT false NOT NULL;
