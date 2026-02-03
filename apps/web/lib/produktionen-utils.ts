import type { ProduktionStatus } from '../supabase/types'

// =============================================================================
// Status Workflow
// =============================================================================

export const ALLOWED_TRANSITIONS: Record<ProduktionStatus, ProduktionStatus[]> = {
  draft: ['planung', 'abgesagt'],
  planung: ['casting', 'proben', 'abgesagt'],
  casting: ['proben', 'planung', 'abgesagt'],
  proben: ['premiere', 'casting', 'abgesagt'],
  premiere: ['laufend', 'abgesagt'],
  laufend: ['abgeschlossen', 'abgesagt'],
  abgeschlossen: [],
  abgesagt: [],
}

export function getAllowedTransitions(
  currentStatus: ProduktionStatus
): ProduktionStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] || []
}
