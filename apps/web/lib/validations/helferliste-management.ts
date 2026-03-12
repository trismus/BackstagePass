import { z } from 'zod'

// Custom UUID regex (Zod v4 strict .uuid() rejects seed data)
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const uuid = (message = 'Ungültige UUID') => z.string().regex(UUID_REGEX, message)

// =============================================================================
// Helfer Rolle Create/Update
// =============================================================================

export const helferRolleCreateSchema = z.object({
  custom_name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(200, 'Name zu lang'),
  anzahl_benoetigt: z
    .number()
    .int('Muss eine ganze Zahl sein')
    .min(1, 'Mindestens 1 benötigt'),
  zeitblock_start: z
    .string()
    .nullable()
    .optional(),
  zeitblock_end: z
    .string()
    .nullable()
    .optional(),
  sichtbarkeit: z.enum(['intern', 'public'], {
    message: 'Sichtbarkeit muss "intern" oder "public" sein',
  }),
})

export type HelferRolleCreateFormData = z.infer<typeof helferRolleCreateSchema>

export const helferRolleUpdateSchema = helferRolleCreateSchema.partial()

export type HelferRolleUpdateFormData = z.infer<typeof helferRolleUpdateSchema>

// =============================================================================
// External Helfer Assignment
// =============================================================================

export const externalHelferAssignSchema = z.object({
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
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail zu lang')
    .transform((val) => val.toLowerCase().trim()),
  telefon: z
    .string()
    .max(50, 'Telefonnummer zu lang')
    .nullable()
    .optional(),
})

export type ExternalHelferAssignFormData = z.infer<typeof externalHelferAssignSchema>

// =============================================================================
// Status Update
// =============================================================================

export const anmeldungStatusUpdateSchema = z.object({
  anmeldungId: uuid('Ungültige Anmeldungs-ID'),
  status: z.enum(['angemeldet', 'bestaetigt', 'abgelehnt', 'warteliste'], {
    message: 'Ungültiger Status',
  }),
})

export type AnmeldungStatusUpdateFormData = z.infer<typeof anmeldungStatusUpdateSchema>
