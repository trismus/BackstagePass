/**
 * Sanitize a search query for use in iLike filters.
 * Escapes SQL wildcard characters (% and _) and enforces a max length.
 */
export function sanitizeSearchQuery(query: string, maxLength = 100): string {
  return query
    .slice(0, maxLength)
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}
