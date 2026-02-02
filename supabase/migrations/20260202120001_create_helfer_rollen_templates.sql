-- Create the helfer_rollen_templates table
CREATE TABLE public.helfer_rollen_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  default_anzahl_personen INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.helfer_rollen_templates ENABLE ROW LEVEL SECURITY;

-- Policy for admin users (full CRUD access)
CREATE POLICY "Admins have full access to helfer_rollen_templates"
ON public.helfer_rollen_templates
FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON ur.profile_id = p.id WHERE p.user_id = auth.uid() AND ur.role = 'ADMIN'));

-- Policy for authenticated users (view access)
CREATE POLICY "Authenticated users can view helfer_rollen_templates"
ON public.helfer_rollen_templates
FOR SELECT
USING (auth.role() = 'authenticated');

-- Update updated_at timestamp on update
CREATE TRIGGER update_helfer_rollen_templates_updated_at
BEFORE UPDATE ON public.helfer_rollen_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
