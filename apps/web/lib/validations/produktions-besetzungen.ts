import { z } from 'zod'

export const produktionsBesetzungSchema = z.object({
  produktion_id: z.string().uuid('Ungültige Produktions-ID'),
  rolle_id: z.string().uuid('Ungültige Rollen-ID'),
  person_id: z.string().uuid().nullable().optional(),
  typ: z
    .enum(['hauptbesetzung', 'zweitbesetzung', 'ersatz'])
    .default('hauptbesetzung'),
  status: z
    .enum(['offen', 'vorgemerkt', 'besetzt', 'abgesagt'])
    .default('offen'),
  notizen: z.string().max(500, 'Notizen zu lang').nullable().optional(),
})

export const produktionsBesetzungUpdateSchema = produktionsBesetzungSchema
  .omit({ produktion_id: true })
  .partial()
