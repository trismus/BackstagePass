'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/supabase/auth-helpers'
import { DEFAULT_DESIGN_SETTINGS } from './design-settings-utils'
import type { DesignSettings, DesignSettingsUpdate, DesignSettingsHistoryEntry } from './design-settings-utils'

export type { DesignSettings, DesignSettingsUpdate, DesignSettingsHistoryEntry }

// =============================================================================
// Get Design Settings
// =============================================================================

export async function getDesignSettings(): Promise<DesignSettings> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('design_settings')
    .select('*')
    .single()

  if (error || !data) {
    // Return defaults if no settings exist or error
    return {
      id: 'default',
      ...DEFAULT_DESIGN_SETTINGS,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: null,
    }
  }

  return data as DesignSettings
}

// =============================================================================
// Update Design Settings
// =============================================================================

export async function updateDesignSettings(
  updates: DesignSettingsUpdate
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  // Get current settings to update
  const { data: current } = await supabase
    .from('design_settings')
    .select('id')
    .single()

  if (!current) {
    return { success: false, error: 'Design-Einstellungen nicht gefunden' }
  }

  const { error } = await supabase
    .from('design_settings')
    .update(updates)
    .eq('id', current.id)

  if (error) {
    console.error('Failed to update design settings:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/design')
  revalidatePath('/', 'layout') // Revalidate entire app to apply changes

  return { success: true }
}

// =============================================================================
// Reset Design Settings to Defaults
// =============================================================================

export async function resetDesignSettings(): Promise<{ success: boolean; error?: string }> {
  return updateDesignSettings(DEFAULT_DESIGN_SETTINGS)
}

// =============================================================================
// Get Design Settings History
// =============================================================================

export async function getDesignSettingsHistory(
  limit: number = 10
): Promise<DesignSettingsHistoryEntry[]> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('design_settings_history')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to get design settings history:', error)
    return []
  }

  return (data || []) as DesignSettingsHistoryEntry[]
}

// =============================================================================
// Restore Design Settings from History
// =============================================================================

export async function restoreDesignSettings(
  historyId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  // Get the history entry
  const { data: historyEntry, error: historyError } = await supabase
    .from('design_settings_history')
    .select('settings_snapshot')
    .eq('id', historyId)
    .single()

  if (historyError || !historyEntry) {
    return { success: false, error: 'Historieneintrag nicht gefunden' }
  }

  const snapshot = historyEntry.settings_snapshot as DesignSettings

  // Apply the snapshot (excluding metadata fields)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, created_at, updated_at, updated_by, ...settingsToRestore } = snapshot

  return updateDesignSettings(settingsToRestore)
}

