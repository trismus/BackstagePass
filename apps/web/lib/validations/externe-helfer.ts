import { z } from 'zod'

// =============================================================================
// Externe Helfer Profile Validations (Issue #208)
// =============================================================================

/**
 * Schema for creating/updating external helper profiles
 */
export const externeHelferProfilSchema = z.object({
  email: z
    .string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail zu lang')
    .transform((val) => val.toLowerCase().trim()),
  vorname: z
    .string()
    .min(1, 'Vorname ist erforderlich')
    .max(100, 'Vorname zu lang'),
  nachname: z
    .string()
    .min(1, 'Nachname ist erforderlich')
    .max(100, 'Nachname zu lang'),
  telefon: z
    .string()
    .max(50, 'Telefonnummer zu lang')
    .nullable()
    .optional(),
  notizen: z
    .string()
    .max(1000, 'Notizen zu lang')
    .nullable()
    .optional(),
})

/**
 * Schema for updating (email cannot be changed)
 */
export const externeHelferProfilUpdateSchema = externeHelferProfilSchema
  .omit({ email: true })
  .partial()

/**
 * Schema for public registration (used by external helpers)
 */
export const externeHelferRegistrierungSchema = z.object({
  email: z
    .string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail zu lang')
    .transform((val) => val.toLowerCase().trim()),
  vorname: z
    .string()
    .min(1, 'Vorname ist erforderlich')
    .max(100, 'Vorname zu lang'),
  nachname: z
    .string()
    .min(1, 'Nachname ist erforderlich')
    .max(100, 'Nachname zu lang'),
  telefon: z
    .string()
    .max(50, 'Telefonnummer zu lang')
    .optional(),
})

/**
 * Schema for public registration form with privacy acceptance
 */
export const externeHelferRegistrierungFormSchema = externeHelferRegistrierungSchema.extend({
  datenschutz: z
    .boolean()
    .refine((val) => val === true, 'Bitte akzeptiere die Datenschutzerklärung'),
})

// Export types inferred from schemas
export type ExterneHelferProfilFormData = z.infer<typeof externeHelferProfilSchema>
export type ExterneHelferProfilUpdateFormData = z.infer<typeof externeHelferProfilUpdateSchema>
export type ExterneHelferRegistrierungFormData = z.infer<typeof externeHelferRegistrierungSchema>
export type ExterneHelferRegistrierungFormWithPrivacy = z.infer<typeof externeHelferRegistrierungFormSchema>
