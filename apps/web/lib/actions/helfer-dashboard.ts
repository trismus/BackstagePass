'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { HelferDashboardData } from '@/lib/supabase/types'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getHelferDashboardData(
  dashboardToken: string
): Promise<HelferDashboardData | null> {
  if (!UUID_REGEX.test(dashboardToken)) {
    return null
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('get_helfer_dashboard_data', {
    p_dashboard_token: dashboardToken,
  })

  if (error || !data) {
    return null
  }

  const result = data as unknown as
    | HelferDashboardData
    | { error: string }

  if ('error' in result) {
    return null
  }

  return result
}
