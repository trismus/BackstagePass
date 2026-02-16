import { z } from 'zod'

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const uuid = (message = 'Ungültige UUID') =>
  z.string().regex(UUID_REGEX, message)

// Recurring pattern options
export const wiederholungTypSchema = z.enum([
  'woechentlich',
  'zweiwoechentlich',
  'monatlich',
])

export type WiederholungTyp = z.infer<typeof wiederholungTypSchema>

export const WIEDERHOLUNG_TYP_LABELS: Record<WiederholungTyp, string> = {
  woechentlich: 'Wöchentlich',
  zweiwoechentlich: 'Alle 2 Wochen',
  monatlich: 'Monatlich',
}

// Weekday options (0 = Sunday, 1 = Monday, etc.)
export const WOCHENTAG_LABELS: Record<number, string> = {
  0: 'Sonntag',
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: 'Samstag',
}

// Schema for generating proben (recurring)
export const probenGeneratorSchema = z.object({
  stueck_id: uuid('Ungültige Stück-ID'),
  titel_prefix: z.string().min(1, 'Titel-Präfix ist erforderlich'),
  beschreibung: z.string().optional(),
  // Recurring settings
  wiederholung_typ: wiederholungTypSchema,
  wochentag: z.number().min(0).max(6),
  startzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Zeitformat (HH:MM)'),
  endzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Zeitformat (HH:MM)'),
  // Date range
  start_datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  end_datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  // Location
  ort: z.string().optional(),
  // Scenes to include
  szenen_ids: z.array(uuid()).optional(),
  // Auto-invite based on cast
  auto_einladen: z.boolean().default(true),
}).refine(
  (data) => data.startzeit < data.endzeit,
  { message: 'Endzeit muss nach Startzeit liegen', path: ['endzeit'] }
).refine(
  (data) => data.start_datum <= data.end_datum,
  { message: 'Enddatum muss nach Startdatum liegen', path: ['end_datum'] }
)

export type ProbenGeneratorFormData = z.infer<typeof probenGeneratorSchema>

// Schema for saving a template
export const probenplanTemplateSchema = z.object({
  stueck_id: uuid('Ungültige Stück-ID'),
  name: z.string().min(1, 'Name ist erforderlich'),
  beschreibung: z.string().optional(),
  wiederholung_typ: wiederholungTypSchema,
  wochentag: z.number().min(0).max(6),
  startzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Zeitformat'),
  endzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Zeitformat'),
  dauer_wochen: z.number().min(1).max(52).default(1),
  ort: z.string().optional(),
  szenen_ids: z.array(uuid()).optional(),
})

export type ProbenplanTemplateFormData = z.infer<typeof probenplanTemplateSchema>

// Schema for conflict check request
export const konfliktCheckSchema = z.object({
  stueck_id: uuid(),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startzeit: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endzeit: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  szenen_ids: z.array(uuid()).optional(),
})

export type KonfliktCheckData = z.infer<typeof konfliktCheckSchema>
