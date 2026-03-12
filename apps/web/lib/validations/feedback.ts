import { z } from 'zod'

export const FEEDBACK_KATEGORIEN = ['feature'] as const
export type FeedbackKategorie = (typeof FEEDBACK_KATEGORIEN)[number]

export const KATEGORIE_LABELS: Record<FeedbackKategorie, string> = {
  feature: 'Feature-Wunsch',
}

export const KATEGORIE_GITHUB_LABELS: Record<FeedbackKategorie, string> = {
  feature: 'enhancement',
}

export const feedbackSchema = z.object({
  kategorie: z.enum(FEEDBACK_KATEGORIEN, {
    message: 'Bitte wähle eine Kategorie',
  }),
  titel: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(200, 'Titel darf maximal 200 Zeichen lang sein'),
  beschreibung: z
    .string()
    .min(1, 'Beschreibung ist erforderlich')
    .max(2000, 'Beschreibung darf maximal 2000 Zeichen lang sein'),
})

export type FeedbackFormData = z.infer<typeof feedbackSchema>
