/**
 * Email Template Renderer
 *
 * Utility for rendering email templates with placeholder replacement.
 */

import type { EmailPlaceholderData } from '@/lib/supabase/types'

/**
 * Escape HTML entities to prevent XSS in email templates
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Placeholder keys that contain trusted URLs/HTML (not user input)
 */
const TRUSTED_PLACEHOLDERS = new Set([
  'absage_link',
  'public_link',
  'magic_link',
])

/**
 * Replace placeholders in a string with actual values.
 * When escapeForHtml is true, user-provided values are HTML-escaped
 * to prevent XSS in email HTML bodies.
 */
export function replacePlaceholders(
  template: string,
  data: EmailPlaceholderData,
  escapeForHtml: boolean = false
): string {
  let result = template

  // Replace all placeholders with their values or empty string if not provided
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`
    const raw = value || ''
    const safeValue = escapeForHtml && !TRUSTED_PLACEHOLDERS.has(key)
      ? escapeHtml(raw)
      : raw
    result = result.replace(new RegExp(placeholder, 'g'), safeValue)
  }

  // Remove any remaining unreplaced placeholders (set to empty)
  result = result.replace(/\{\{[a-z_]+\}\}/g, '')

  return result
}

/**
 * Render a complete email template
 */
export function renderEmailTemplate(
  template: { subject: string; body_html: string; body_text: string },
  data: EmailPlaceholderData
): { subject: string; html: string; text: string } {
  return {
    subject: replacePlaceholders(template.subject, data),
    html: replacePlaceholders(template.body_html, data, true),
    text: replacePlaceholders(template.body_text, data),
  }
}

/**
 * Sample data for template preview
 */
export const SAMPLE_PLACEHOLDER_DATA: EmailPlaceholderData = {
  vorname: 'Max',
  nachname: 'Muster',
  email: 'max.muster@example.com',
  veranstaltung: 'Der Besuch der alten Dame',
  datum: 'Samstag, 15. März 2026',
  uhrzeit: '19:30',
  ort: 'Gemeindesaal Widen',
  rolle: 'Einlasskontrolle',
  zeitblock: 'Einlass',
  startzeit: '18:30',
  endzeit: '19:30',
  treffpunkt: 'Haupteingang',
  briefing_zeit: '18:00',
  helferessen_zeit: '22:00',
  absage_link: 'https://example.com/helfer/abmeldung/abc123',
  public_link: 'https://example.com/helfer/anmeldung/xyz789',
  koordinator_name: 'Anna Koordinator',
  koordinator_email: 'anna@tgw.ch',
  koordinator_telefon: '+41 79 123 45 67',
  frist: 'Freitag, 14. März 2026, 18:00 Uhr',
  magic_link: 'https://example.com/auth/confirm?token_hash=abc123&type=invite',
}

/**
 * Extract placeholders from a template string
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{\{([a-z_]+)\}\}/g) || []
  const placeholders = matches.map((m) => m.replace(/\{\{|\}\}/g, ''))
  return [...new Set(placeholders)] // Remove duplicates
}

/**
 * Validate that all required placeholders have data
 */
export function validatePlaceholderData(
  requiredPlaceholders: string[],
  data: EmailPlaceholderData
): { valid: boolean; missing: string[] } {
  const missing = requiredPlaceholders.filter(
    (p) => !data[p as keyof EmailPlaceholderData]
  )
  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Format date for email display (German locale)
 */
export function formatDateForEmail(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format time for email display
 */
export function formatTimeForEmail(time: string): string {
  // Expects HH:MM format, returns HH:MM
  return time.slice(0, 5)
}

/**
 * Format datetime for deadline display
 */
export function formatDeadlineForEmail(date: Date): string {
  return `${formatDateForEmail(date)}, ${date.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  })} Uhr`
}
