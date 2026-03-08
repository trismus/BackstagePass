import { z } from 'zod'

// =============================================================================
// Alle Helfer Validations
// =============================================================================

/**
 * Schema for manually creating a new external helper via the Alle Helfer page.
 * Email is optional here (unlike public registration where it's required).
 */
export const helferErfassenSchema = z.object({
  vorname: z
    .string()
    .min(1, 'Vorname ist erforderlich')
    .max(100, 'Vorname zu lang'),
  nachname: z
    .string()
    .min(1, 'Nachname ist erforderlich')
    .max(100, 'Nachname zu lang'),
  email: z
    .string()
    .email('Ungueltige E-Mail-Adresse')
    .max(255, 'E-Mail zu lang')
    .transform((val) => val.toLowerCase().trim())
    .optional()
    .or(z.literal('')),
  telefon: z
    .string()
    .max(50, 'Telefonnummer zu lang')
    .optional()
    .or(z.literal('')),
})

export type HelferErfassenFormData = z.infer<typeof helferErfassenSchema>

// Custom UUID regex (Zod v4 compatibility)
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const uuid = (message = 'Ungueltige UUID') => z.string().regex(UUID_REGEX, message)

/**
 * Schema for updating an existing helper (internal or external).
 */
export const helferUpdateSchema = z.object({
  id: uuid('Ungueltige Helfer-ID'),
  typ: z.enum(['intern', 'extern']),
  vorname: z
    .string()
    .min(1, 'Vorname ist erforderlich')
    .max(100, 'Vorname zu lang'),
  nachname: z
    .string()
    .min(1, 'Nachname ist erforderlich')
    .max(100, 'Nachname zu lang'),
  email: z
    .string()
    .email('Ungueltige E-Mail-Adresse')
    .max(255, 'E-Mail zu lang')
    .transform((val) => val.toLowerCase().trim())
    .optional()
    .or(z.literal('')),
  telefon: z
    .string()
    .max(50, 'Telefonnummer zu lang')
    .optional()
    .or(z.literal('')),
})

export type HelferUpdateFormData = z.infer<typeof helferUpdateSchema>
