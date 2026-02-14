import { z } from 'zod'

export const helfereinsatzSchema = z.object({
  titel: z.string().min(1, 'Titel ist erforderlich').max(200, 'Titel zu lang'),
  datum: z.string().min(1, 'Datum ist erforderlich'),
  status: z.enum(['offen', 'bestaetigt', 'abgeschlossen', 'abgesagt']),
  partner_id: z.string().uuid('Ungültige Partner-ID').nullable().optional(),
  beschreibung: z
    .string()
    .max(2000, 'Beschreibung zu lang')
    .nullable()
    .optional(),
  startzeit: z.string().nullable().optional(),
  endzeit: z.string().nullable().optional(),
  ort: z.string().max(200, 'Ort zu lang').nullable().optional(),
  stundenlohn_verein: z
    .number()
    .min(0, 'Stundenlohn muss positiv sein')
    .nullable()
    .optional(),
})

export const helfereinsatzUpdateSchema = helfereinsatzSchema.partial()

export const helferrolleSchema = z.object({
  helfereinsatz_id: z.string().uuid('Ungültige Helfereinsatz-ID'),
  rolle: z
    .string()
    .min(1, 'Rolle ist erforderlich')
    .max(100, 'Rolle zu lang'),
  anzahl_benoetigt: z
    .number()
    .int()
    .min(1, 'Mindestens 1 Person benötigt'),
})
