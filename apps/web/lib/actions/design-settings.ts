'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/supabase/auth-helpers'

// =============================================================================
// Types
// =============================================================================

export interface DesignSettings {
  id: string
  // Typografie
  font_primary: string
  font_secondary: string | null
  font_size_base: string
  // Farben
  color_primary: string
  color_secondary: string
  color_accent: string
  color_background: string
  color_text: string
  color_success: string
  color_warning: string
  color_error: string
  // UI Parameter
  border_radius: string
  button_style: 'filled' | 'outline'
  shadow_level: 'none' | 'soft' | 'strong'
  spacing_scale: 'compact' | 'normal' | 'relaxed'
  // Branding
  logo_url: string | null
  favicon_url: string | null
  // Metadata
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type DesignSettingsUpdate = Partial<Omit<DesignSettings, 'id' | 'created_at' | 'updated_at' | 'updated_by'>>

export interface DesignSettingsHistoryEntry {
  id: string
  settings_snapshot: DesignSettings
  changed_at: string
  changed_by: string | null
}

// =============================================================================
// Default Settings (used when DB not initialized)
// =============================================================================

export const DEFAULT_DESIGN_SETTINGS: Omit<DesignSettings, 'id' | 'created_at' | 'updated_at' | 'updated_by'> = {
  font_primary: 'Inter',
  font_secondary: null,
  font_size_base: '16px',
  color_primary: '#6366f1',
  color_secondary: '#8b5cf6',
  color_accent: '#f59e0b',
  color_background: '#ffffff',
  color_text: '#171717',
  color_success: '#22c55e',
  color_warning: '#f59e0b',
  color_error: '#ef4444',
  border_radius: 'rounded-lg',
  button_style: 'filled',
  shadow_level: 'soft',
  spacing_scale: 'normal',
  logo_url: null,
  favicon_url: null,
}

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

