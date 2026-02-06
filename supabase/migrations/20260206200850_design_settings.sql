-- Design Settings Table
-- Stores global design configuration for the application

CREATE TABLE IF NOT EXISTS design_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Typografie
  font_primary text NOT NULL DEFAULT 'Inter',
  font_secondary text,
  font_size_base text NOT NULL DEFAULT '16px',

  -- Farben
  color_primary text NOT NULL DEFAULT '#6366f1',  -- indigo-500
  color_secondary text NOT NULL DEFAULT '#8b5cf6', -- violet-500
  color_accent text NOT NULL DEFAULT '#f59e0b',    -- amber-500
  color_background text NOT NULL DEFAULT '#ffffff',
  color_text text NOT NULL DEFAULT '#171717',      -- neutral-900
  color_success text NOT NULL DEFAULT '#22c55e',   -- green-500
  color_warning text NOT NULL DEFAULT '#f59e0b',   -- amber-500
  color_error text NOT NULL DEFAULT '#ef4444',     -- red-500

  -- UI Parameter
  border_radius text NOT NULL DEFAULT 'rounded-lg',  -- Tailwind class
  button_style text NOT NULL DEFAULT 'filled' CHECK (button_style IN ('filled', 'outline')),
  shadow_level text NOT NULL DEFAULT 'soft' CHECK (shadow_level IN ('none', 'soft', 'strong')),
  spacing_scale text NOT NULL DEFAULT 'normal' CHECK (spacing_scale IN ('compact', 'normal', 'relaxed')),

  -- Branding
  logo_url text,
  favicon_url text,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Only one settings row should exist
CREATE UNIQUE INDEX IF NOT EXISTS design_settings_singleton ON design_settings ((true));

-- Insert default settings
INSERT INTO design_settings (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE design_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read (settings are public for rendering)
CREATE POLICY "Design settings are readable by all authenticated users"
  ON design_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update
CREATE POLICY "Only admins can update design settings"
  ON design_settings
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_design_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER design_settings_updated
  BEFORE UPDATE ON design_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_design_settings_timestamp();

-- Design Settings History for audit/versioning
CREATE TABLE IF NOT EXISTS design_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_snapshot jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id)
);

-- RLS for history
ALTER TABLE design_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view design settings history"
  ON design_settings_history
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admins can insert design settings history"
  ON design_settings_history
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Trigger to log changes
CREATE OR REPLACE FUNCTION log_design_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO design_settings_history (settings_snapshot, changed_by)
  VALUES (to_jsonb(OLD), auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER design_settings_change_log
  BEFORE UPDATE ON design_settings
  FOR EACH ROW
  EXECUTE FUNCTION log_design_settings_change();

-- Comment
COMMENT ON TABLE design_settings IS 'Global design configuration for the application. Only one row exists (singleton pattern).';
