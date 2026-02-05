import { z } from 'zod'

// =============================================================================
// Enum Schemas
// =============================================================================

export const meetingTypSchema = z.enum(['vorstand', 'regie', 'team', 'sonstiges'])
export type MeetingTypSchema = z.infer<typeof meetingTypSchema>

export const wiederholungTypMeetingSchema = z.enum(['woechentlich', 'zweiwoechentlich', 'monatlich'])
export type WiederholungTypMeetingSchema = z.infer<typeof wiederholungTypMeetingSchema>

// =============================================================================
// Meeting Form Validation
// =============================================================================

export const meetingSchema = z.object({
  meeting_typ: meetingTypSchema,
  leiter_id: z.string().uuid().nullable().optional(),
  protokollant_id: z.string().uuid().nullable().optional(),
})

export type MeetingFormData = z.infer<typeof meetingSchema>

// =============================================================================
// Meeting with Veranstaltung Form Validation
// =============================================================================

export const meetingVeranstaltungSchema = z.object({
  // Veranstaltung fields
  titel: z.string().min(1, 'Titel ist erforderlich'),
  beschreibung: z.string().nullable().optional(),
  datum: z.string().min(1, 'Datum ist erforderlich'),
  startzeit: z.string().nullable().optional(),
  endzeit: z.string().nullable().optional(),
  ort: z.string().nullable().optional(),
  max_teilnehmer: z.number().positive().nullable().optional(),

  // Meeting fields
  meeting_typ: meetingTypSchema,
  leiter_id: z.string().uuid().nullable().optional(),
  protokollant_id: z.string().uuid().nullable().optional(),
})

export type MeetingVeranstaltungFormData = z.infer<typeof meetingVeranstaltungSchema>

// =============================================================================
// Agenda Item Validation
// =============================================================================

export const agendaItemSchema = z.object({
  nummer: z.number().positive('Nummer muss positiv sein'),
  titel: z.string().min(1, 'Titel ist erforderlich'),
  beschreibung: z.string().nullable().optional(),
  dauer_minuten: z.number().positive().nullable().optional(),
  verantwortlich_id: z.string().uuid().nullable().optional(),
})

export type AgendaItemFormData = z.infer<typeof agendaItemSchema>

// =============================================================================
// Beschluss (Decision) Validation
// =============================================================================

export const beschlussSchema = z.object({
  nummer: z.number().positive('Nummer muss positiv sein'),
  titel: z.string().min(1, 'Titel ist erforderlich'),
  beschreibung: z.string().nullable().optional(),
  agenda_item_id: z.string().uuid().nullable().optional(),
  abstimmung_ja: z.number().nonnegative().nullable().optional(),
  abstimmung_nein: z.number().nonnegative().nullable().optional(),
  abstimmung_enthaltung: z.number().nonnegative().nullable().optional(),
  status: z.enum(['beschlossen', 'abgelehnt', 'vertagt', 'umgesetzt']).default('beschlossen'),
  zustaendig_id: z.string().uuid().nullable().optional(),
  faellig_bis: z.string().nullable().optional(),
})

export type BeschlussFormData = z.infer<typeof beschlussSchema>

// =============================================================================
// Meeting Template Validation
// =============================================================================

export const meetingTemplateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  beschreibung: z.string().nullable().optional(),
  meeting_typ: meetingTypSchema,
  default_ort: z.string().nullable().optional(),
  default_startzeit: z.string().nullable().optional(),
  default_dauer_minuten: z.number().positive().default(60),
  default_leiter_id: z.string().uuid().nullable().optional(),
  wiederholung_typ: wiederholungTypMeetingSchema.nullable().optional(),
  wiederholung_tag: z.number().min(0).max(31).nullable().optional(),
  standard_agenda: z.array(z.object({
    titel: z.string().min(1),
    beschreibung: z.string().optional(),
    dauer_minuten: z.number().positive().optional(),
  })).default([]),
})

export type MeetingTemplateFormData = z.infer<typeof meetingTemplateSchema>

// =============================================================================
// Meeting Generator (Recurring Meetings) Validation
// =============================================================================

export const meetingGeneratorSchema = z.object({
  template_id: z.string().uuid('Template ist erforderlich'),
  start_datum: z.string().min(1, 'Startdatum ist erforderlich'),
  end_datum: z.string().min(1, 'Enddatum ist erforderlich'),
  anzahl: z.number().positive().max(52, 'Maximal 52 Meetings erlaubt').optional(),
})

export type MeetingGeneratorFormData = z.infer<typeof meetingGeneratorSchema>
