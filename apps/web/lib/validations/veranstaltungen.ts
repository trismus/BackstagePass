import { z } from 'zod'

export const veranstaltungSchema = z.object({
  titel: z.string().min(1, 'Titel ist erforderlich').max(200, 'Titel zu lang'),
  datum: z.string().min(1, 'Datum ist erforderlich'),
  typ: z.enum(['vereinsevent', 'probe', 'auffuehrung', 'sonstiges', 'meeting']),
  status: z.enum(['geplant', 'bestaetigt', 'abgesagt', 'abgeschlossen']),
  warteliste_aktiv: z.boolean(),
  beschreibung: z
    .string()
    .max(2000, 'Beschreibung zu lang')
    .nullable()
    .optional(),
  startzeit: z.string().nullable().optional(),
  endzeit: z.string().nullable().optional(),
  ort: z.string().max(200, 'Ort zu lang').nullable().optional(),
  max_teilnehmer: z
    .number()
    .int()
    .min(1, 'Mindestens 1 Teilnehmer')
    .nullable()
    .optional(),
  organisator_id: z
    .string()
    .uuid('Ungültige Organisator-ID')
    .nullable()
    .optional(),
  helfer_template_id: z
    .string()
    .uuid('Ungültige Template-ID')
    .nullable()
    .optional(),
  helfer_status: z
    .enum(['entwurf', 'veroeffentlicht', 'abgeschlossen'])
    .nullable()
    .optional(),
  public_helfer_token: z.string().nullable().optional(),
  max_schichten_pro_helfer: z
    .number()
    .int()
    .min(1, 'Mindestens 1 Schicht')
    .nullable()
    .optional(),
  helfer_buchung_deadline: z.string().nullable().optional(),
  helfer_buchung_limit_aktiv: z.boolean().optional(),
  koordinator_id: z
    .string()
    .uuid('Ungültige Koordinator-ID')
    .nullable()
    .optional(),
})

export const veranstaltungUpdateSchema = veranstaltungSchema.partial()
