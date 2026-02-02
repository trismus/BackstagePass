-- Create the helfer_event_type enum
DO $$ BEGIN
  CREATE TYPE public.helfer_event_type AS ENUM ('auffuehrung', 'helfereinsatz');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create the helfer_events table
CREATE TABLE public.helfer_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type public.helfer_event_type NOT NULL,
  veranstaltung_id UUID REFERENCES public.veranstaltungen(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.helfer_events ENABLE ROW LEVEL SECURITY;

-- Policy for admin users (full CRUD access)
CREATE POLICY "Admins have full access to helfer_events"
ON public.helfer_events
FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON ur.profile_id = p.id WHERE p.user_id = auth.uid() AND ur.role = 'ADMIN'));

-- Policy for authenticated users (view access)
CREATE POLICY "Authenticated users can view helfer_events"
ON public.helfer_events
FOR SELECT
USING (auth.role() = 'authenticated');

-- Update updated_at timestamp on update
CREATE TRIGGER update_helfer_events_updated_at
BEFORE UPDATE ON public.helfer_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
