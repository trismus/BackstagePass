import type { DesignSettings } from './design-settings'

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
