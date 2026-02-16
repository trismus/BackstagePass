import { z } from 'zod'

// =============================================================================
// Räume Validations
// =============================================================================

export const raumSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  typ: z
    .enum(['buehne', 'foyer', 'lager', 'garderobe', 'technik', 'sonstiges'])
    .nullable()
    .optional(),
  kapazitaet: z
    .number()
    .int()
    .min(0, 'Kapazität muss positiv sein')
    .nullable()
    .optional(),
  beschreibung: z
    .string()
    .max(500, 'Beschreibung zu lang')
    .nullable()
    .optional(),
  aktiv: z.boolean().optional(),
})

export const raumUpdateSchema = raumSchema.partial()

// =============================================================================
// Ressourcen Validations
// =============================================================================

export const ressourceSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  kategorie: z
    .enum(['licht', 'ton', 'requisite', 'kostuem', 'buehne', 'sonstiges'])
    .nullable()
    .optional(),
  menge: z.number().int().min(1, 'Menge muss mindestens 1 sein').default(1),
  beschreibung: z
    .string()
    .max(500, 'Beschreibung zu lang')
    .nullable()
    .optional(),
  aktiv: z.boolean().optional(),
})

export const ressourceUpdateSchema = ressourceSchema.partial()

// =============================================================================
// Zeitblock Validations
// =============================================================================

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/

export const zeitblockSchema = z
  .object({
    veranstaltung_id: z.string().uuid('Ungültige Veranstaltungs-ID'),
    name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
    startzeit: z.string().regex(timeRegex, 'Ungültiges Zeitformat (HH:MM)'),
    endzeit: z.string().regex(timeRegex, 'Ungültiges Zeitformat (HH:MM)'),
    typ: z
      .enum(['aufbau', 'einlass', 'vorfuehrung', 'pause', 'abbau', 'standard'])
      .optional(),
    sortierung: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startzeit.split(':').map(Number)
      const [endH, endM] = data.endzeit.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      return endMinutes > startMinutes
    },
    { message: 'Endzeit muss nach Startzeit liegen', path: ['endzeit'] }
  )

export const zeitblockUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(100, 'Name zu lang')
    .optional(),
  startzeit: z
    .string()
    .regex(timeRegex, 'Ungültiges Zeitformat (HH:MM)')
    .optional(),
  endzeit: z
    .string()
    .regex(timeRegex, 'Ungültiges Zeitformat (HH:MM)')
    .optional(),
  typ: z
    .enum(['aufbau', 'einlass', 'vorfuehrung', 'pause', 'abbau', 'standard'])
    .optional(),
  sortierung: z.number().int().min(0).optional(),
})

// =============================================================================
// Schicht Validations
// =============================================================================

export const schichtSchema = z.object({
  veranstaltung_id: z.string().uuid('Ungültige Veranstaltungs-ID'),
  zeitblock_id: z.string().uuid().nullable().optional(),
  rolle: z.string().min(1, 'Rolle ist erforderlich').max(100, 'Rolle zu lang'),
  anzahl_benoetigt: z
    .number()
    .int()
    .min(1, 'Mindestens 1 Person benötigt')
    .default(1),
})

export const schichtUpdateSchema = schichtSchema
  .omit({ veranstaltung_id: true })
  .partial()

// =============================================================================
// Zuweisung Validations
// =============================================================================

export const zuweisungSchema = z.object({
  schicht_id: z.string().uuid('Ungültige Schicht-ID'),
  person_id: z.string().uuid('Ungültige Personen-ID'),
  status: z
    .enum(['zugesagt', 'abgesagt', 'erschienen', 'nicht_erschienen'])
    .optional(),
  notizen: z.string().max(500, 'Notizen zu lang').nullable().optional(),
})

export const zuweisungUpdateSchema = z.object({
  status: z
    .enum(['zugesagt', 'abgesagt', 'erschienen', 'nicht_erschienen'])
    .optional(),
  notizen: z.string().max(500, 'Notizen zu lang').nullable().optional(),
})

// =============================================================================
// Reservierung Validations
// =============================================================================

export const raumReservierungSchema = z.object({
  veranstaltung_id: z.string().uuid('Ungültige Veranstaltungs-ID'),
  raum_id: z.string().uuid('Ungültiger Raum'),
  notizen: z.string().max(500, 'Notizen zu lang').nullable().optional(),
})

export const ressourcenReservierungSchema = z.object({
  veranstaltung_id: z.string().uuid('Ungültige Veranstaltungs-ID'),
  ressource_id: z.string().uuid('Ungültige Ressource'),
  menge: z.number().int().min(1, 'Menge muss mindestens 1 sein').default(1),
  notizen: z.string().max(500, 'Notizen zu lang').nullable().optional(),
})

// =============================================================================
// Template Validations
// =============================================================================

export const templateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  beschreibung: z
    .string()
    .max(500, 'Beschreibung zu lang')
    .nullable()
    .optional(),
  archiviert: z.boolean().optional(),
})

export const templateUpdateSchema = templateSchema.partial()

export const templateZeitblockSchema = z.object({
  template_id: z.string().uuid('Ungültige Template-ID'),
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  startzeit: z.string().regex(timeRegex, 'Ungültiges Zeitformat (HH:MM)'),
  endzeit: z.string().regex(timeRegex, 'Ungültiges Zeitformat (HH:MM)'),
  typ: z
    .enum(['aufbau', 'einlass', 'vorfuehrung', 'pause', 'abbau', 'standard'])
    .optional(),
  sortierung: z.number().int().min(0).optional(),
})

export const templateSchichtSchema = z.object({
  template_id: z.string().uuid('Ungültige Template-ID'),
  zeitblock_name: z.string().max(100).nullable().optional(),
  rolle: z.string().min(1, 'Rolle ist erforderlich').max(100, 'Rolle zu lang'),
  anzahl_benoetigt: z
    .number()
    .int()
    .min(1, 'Mindestens 1 Person benötigt')
    .default(1),
  nur_mitglieder: z.boolean().optional().default(false),
})

export const templateZeitblockUpdateSchema = templateZeitblockSchema
  .omit({ template_id: true })
  .partial()

export const templateSchichtUpdateSchema = templateSchichtSchema
  .omit({ template_id: true })
  .partial()

export const templateRessourceSchema = z.object({
  template_id: z.string().uuid('Ungültige Template-ID'),
  ressource_id: z.string().uuid('Ungültige Ressource'),
  menge: z.number().int().min(1, 'Menge muss mindestens 1 sein').default(1),
})

// =============================================================================
// Template Info-Block Validations (Issue #203)
// =============================================================================

export const templateInfoBlockSchema = z.object({
  template_id: z.string().uuid('Ungültige Template-ID'),
  titel: z.string().min(1, 'Titel ist erforderlich').max(100, 'Titel zu lang'),
  beschreibung: z
    .string()
    .max(500, 'Beschreibung zu lang')
    .nullable()
    .optional(),
  startzeit: z.string().regex(timeRegex, 'Ungültiges Zeitformat (HH:MM)'),
  endzeit: z.string().regex(timeRegex, 'Ungültiges Zeitformat (HH:MM)'),
  sortierung: z.number().int().min(0).optional(),
})

export const templateInfoBlockUpdateSchema = templateInfoBlockSchema
  .omit({ template_id: true })
  .partial()

// =============================================================================
// Template Sachleistung Validations (Issue #202)
// =============================================================================

export const templateSachleistungSchema = z.object({
  template_id: z.string().uuid('Ungültige Template-ID'),
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  anzahl: z.number().int().min(1, 'Anzahl muss mindestens 1 sein').default(1),
  beschreibung: z
    .string()
    .max(500, 'Beschreibung zu lang')
    .nullable()
    .optional(),
})

// =============================================================================
// Helper function for validation
// =============================================================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return {
      success: false,
      error: firstError?.message || 'Validierungsfehler',
    }
  }
  return { success: true, data: result.data }
}
