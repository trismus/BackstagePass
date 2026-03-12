import { z } from 'zod'

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const uuid = (message = 'Ungültige UUID') =>
  z.string().regex(UUID_REGEX, message)

export const produktionsBesetzungSchema = z.object({
  produktion_id: uuid('Ungültige Produktions-ID'),
  rolle_id: uuid('Ungültige Rollen-ID'),
  person_id: uuid().nullable().optional(),
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
