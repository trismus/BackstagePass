import { z } from 'zod'

export const onboardingProfileSchema = z.object({
  telefon: z.string().max(50).optional().nullable(),
  notfallkontakt_name: z.string().max(100).optional().nullable(),
  notfallkontakt_telefon: z.string().max(50).optional().nullable(),
  notfallkontakt_beziehung: z.string().max(100).optional().nullable(),
  skills: z.array(z.string().max(50)).max(20).optional(),
})

export type OnboardingProfileData = z.infer<typeof onboardingProfileSchema>
