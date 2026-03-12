import { z } from 'zod'

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const uuid = (message = 'Ungültige UUID') =>
  z.string().regex(UUID_REGEX, message)

// =============================================================================
// Produktion Validations
// =============================================================================

export const produktionSchema = z.object({
  titel: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(200, 'Titel zu lang'),
  beschreibung: z
    .string()
    .max(2000, 'Beschreibung zu lang')
    .nullable()
    .optional(),
  stueck_id: uuid().nullable().optional(),
  status: z
    .enum([
      'draft',
      'planung',
      'casting',
      'proben',
      'premiere',
      'laufend',
      'abgeschlossen',
      'abgesagt',
    ])
    .default('draft'),
  saison: z
    .string()
    .min(1, 'Saison ist erforderlich')
    .max(20, 'Saison zu lang'),
  proben_start: z.string().nullable().optional(),
  premiere: z.string().nullable().optional(),
  derniere: z.string().nullable().optional(),
  produktionsleitung_id: uuid().nullable().optional(),
})

export const produktionUpdateSchema = produktionSchema.partial()

// =============================================================================
// Aufführungsserie Validations
// =============================================================================

export const serieSchema = z.object({
  produktion_id: uuid('Ungültige Produktions-ID'),
  name: z.string().min(1, 'Name ist erforderlich').max(200, 'Name zu lang'),
  beschreibung: z
    .string()
    .max(2000, 'Beschreibung zu lang')
    .nullable()
    .optional(),
  status: z
    .enum(['draft', 'planung', 'publiziert', 'abgeschlossen'])
    .default('draft'),
  standard_ort: z.string().max(200, 'Ort zu lang').nullable().optional(),
  standard_startzeit: z.string().nullable().optional(),
  standard_einlass_minuten: z
    .number()
    .int()
    .min(0)
    .max(120)
    .nullable()
    .optional(),
  template_id: uuid().nullable().optional(),
})

export const serieUpdateSchema = serieSchema
  .omit({ produktion_id: true })
  .partial()

// =============================================================================
// Aufführung Generator Validations
// =============================================================================

export const auffuehrungGeneratorSchema = z.object({
  termine: z
    .array(
      z.object({
        datum: z.string().min(1, 'Datum ist erforderlich'),
        startzeit: z.string().optional(),
        typ: z
          .enum([
            'regulaer',
            'premiere',
            'derniere',
            'schulvorstellung',
            'sondervorstellung',
          ])
          .optional(),
      })
    )
    .min(1, 'Mindestens ein Termin erforderlich'),
})

export const wiederholungGeneratorSchema = z
  .object({
    startDatum: z.string().min(1, 'Startdatum ist erforderlich'),
    endDatum: z.string().min(1, 'Enddatum ist erforderlich'),
    wochentage: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'Mindestens ein Wochentag erforderlich'),
    startzeit: z.string().optional(),
    ausnahmen: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      return new Date(data.endDatum) > new Date(data.startDatum)
    },
    { message: 'Enddatum muss nach Startdatum liegen', path: ['endDatum'] }
  )
