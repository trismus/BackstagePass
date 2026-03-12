-- Create the helfer_rollen_templates table
-- Note: Table and policies already exist on remote DB. Made idempotent for migration tracking.
CREATE TABLE IF NOT EXISTS public.helfer_rollen_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  default_anzahl_personen INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.helfer_rollen_templates ENABLE ROW LEVEL SECURITY;

-- Update updated_at timestamp on update
DROP TRIGGER IF EXISTS update_helfer_rollen_templates_updated_at ON public.helfer_rollen_templates;
CREATE TRIGGER update_helfer_rollen_templates_updated_at
BEFORE UPDATE ON public.helfer_rollen_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
