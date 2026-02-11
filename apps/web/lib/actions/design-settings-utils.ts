// =============================================================================
// Types
// =============================================================================

export interface DesignSettings {
  id: string
  // Typografie
  font_primary: string
  font_secondary: string | null
  font_size_base: string
  // Farben
  color_primary: string
  color_secondary: string
  color_accent: string
  color_background: string
  color_text: string
  color_success: string
  color_warning: string
  color_error: string
  // UI Parameter
  border_radius: string
  button_style: 'filled' | 'outline'
  shadow_level: 'none' | 'soft' | 'strong'
  spacing_scale: 'compact' | 'normal' | 'relaxed'
  // Branding
  logo_url: string | null
  favicon_url: string | null
  // Metadata
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type DesignSettingsUpdate = Partial<Omit<DesignSettings, 'id' | 'created_at' | 'updated_at' | 'updated_by'>>

export interface DesignSettingsHistoryEntry {
  id: string
  settings_snapshot: DesignSettings
  changed_at: string
  changed_by: string | null
}

// =============================================================================
// Default Settings (used when DB not initialized)
// =============================================================================

export const DEFAULT_DESIGN_SETTINGS: Omit<DesignSettings, 'id' | 'created_at' | 'updated_at' | 'updated_by'> = {
  font_primary: 'Inter',
  font_secondary: null,
  font_size_base: '16px',
  color_primary: '#6366f1',
  color_secondary: '#8b5cf6',
  color_accent: '#f59e0b',
  color_background: '#ffffff',
  color_text: '#171717',
  color_success: '#22c55e',
  color_warning: '#f59e0b',
  color_error: '#ef4444',
  border_radius: 'rounded-lg',
  button_style: 'filled',
  shadow_level: 'soft',
  spacing_scale: 'normal',
  logo_url: null,
  favicon_url: null,
}

// =============================================================================
// Generate CSS Variables from Settings
// =============================================================================

export function generateCSSVariables(settings: DesignSettings): string {
  return `
    :root {
      --color-primary: ${settings.color_primary};
      --color-secondary: ${settings.color_secondary};
      --color-accent: ${settings.color_accent};
      --color-background: ${settings.color_background};
      --color-text: ${settings.color_text};
      --color-success: ${settings.color_success};
      --color-warning: ${settings.color_warning};
      --color-error: ${settings.color_error};
      --font-primary: ${settings.font_primary}, system-ui, sans-serif;
      --font-secondary: ${settings.font_secondary || settings.font_primary}, system-ui, sans-serif;
      --font-size-base: ${settings.font_size_base};
    }
  `.trim()
}

// =============================================================================
// Available Fonts (for dropdown selection)
// =============================================================================

export const AVAILABLE_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'system-ui', label: 'System Font' },
]

export const BORDER_RADIUS_OPTIONS = [
  { value: 'rounded-none', label: 'Keine' },
  { value: 'rounded-sm', label: 'Klein' },
  { value: 'rounded', label: 'Standard' },
  { value: 'rounded-md', label: 'Mittel' },
  { value: 'rounded-lg', label: 'Gross' },
  { value: 'rounded-xl', label: 'Sehr gross' },
  { value: 'rounded-2xl', label: 'Extra gross' },
  { value: 'rounded-full', label: 'Rund' },
]
