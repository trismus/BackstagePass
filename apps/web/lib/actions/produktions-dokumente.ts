'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUserProfile } from '../supabase/server'
import { hasPermission } from '../supabase/auth-helpers'
import type {
  ProduktionsDokument,
  ProduktionsDokumentUpdate,
  DokumentKategorie,
} from '../supabase/types'

const BUCKET = 'produktions-dokumente'

// =============================================================================
// Read Operations
// =============================================================================

export async function getProduktionsDokumente(
  produktionId: string
): Promise<ProduktionsDokument[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('produktions_dokumente')
    .select('id, produktion_id, name, kategorie, datei_pfad, datei_name, datei_groesse, mime_type, version, vorgaenger_id, status, hochgeladen_von, created_at, updated_at')
    .eq('produktion_id', produktionId)
    .order('kategorie', { ascending: true })
    .order('name', { ascending: true })
    .order('version', { ascending: false })

  if (error) {
    console.error('Error fetching produktions-dokumente:', error)
    return []
  }

  return (data as ProduktionsDokument[]) || []
}

export async function getLatestDokumente(
  produktionId: string
): Promise<ProduktionsDokument[]> {
  // Get all docs, then filter to latest version per name+kategorie
  const all = await getProduktionsDokumente(produktionId)
  const latestMap = new Map<string, ProduktionsDokument>()

  for (const doc of all) {
    const key = `${doc.name}::${doc.kategorie}`
    const existing = latestMap.get(key)
    if (!existing || doc.version > existing.version) {
      latestMap.set(key, doc)
    }
  }

  return Array.from(latestMap.values())
}

// =============================================================================
// Upload
// =============================================================================

export async function uploadDokument(
  formData: FormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const file = formData.get('file') as File | null
  const produktionId = formData.get('produktion_id') as string
  const name = formData.get('name') as string
  const kategorie = formData.get('kategorie') as DokumentKategorie
  const vorgaengerId = formData.get('vorgaenger_id') as string | null

  if (!file || !produktionId || !name || !kategorie) {
    return { success: false, error: 'Fehlende Pflichtfelder.' }
  }

  if (file.size > 52428800) {
    return { success: false, error: 'Datei zu gross (max. 50MB).' }
  }

  const supabase = await createClient()

  // Determine version
  let version = 1
  if (vorgaengerId) {
    const { data: prev } = await supabase
      .from('produktions_dokumente')
      .select('version')
      .eq('id', vorgaengerId)
      .single()
    if (prev) {
      version = prev.version + 1
    }
  }

  // Upload to storage
  const ext = file.name.split('.').pop() || 'bin'
  const storagePath = `${produktionId}/${kategorie}/${Date.now()}_v${version}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return { success: false, error: uploadError.message }
  }

  // Create metadata record
  const { data: result, error: dbError } = await supabase
    .from('produktions_dokumente')
    .insert({
      produktion_id: produktionId,
      name,
      kategorie,
      datei_pfad: storagePath,
      datei_name: file.name,
      datei_groesse: file.size,
      mime_type: file.type || null,
      version,
      vorgaenger_id: vorgaengerId || null,
      status: 'entwurf',
      hochgeladen_von: profile.id,
    } as never)
    .select('id')
    .single()

  if (dbError) {
    console.error('Error creating dokument record:', dbError)
    // Clean up uploaded file
    await supabase.storage.from(BUCKET).remove([storagePath])
    return { success: false, error: dbError.message }
  }

  revalidatePath(`/produktionen/${produktionId}`)
  return { success: true, id: result?.id }
}

// =============================================================================
// Download
// =============================================================================

export async function getDokumentDownloadUrl(
  id: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('produktions_dokumente')
    .select('datei_pfad, datei_name')
    .eq('id', id)
    .single()

  if (!doc) {
    return { success: false, error: 'Dokument nicht gefunden.' }
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.datei_pfad, 3600) // 1 hour

  if (error) {
    console.error('Error creating signed URL:', error)
    return { success: false, error: error.message }
  }

  return { success: true, url: data.signedUrl }
}

// =============================================================================
// Update & Delete
// =============================================================================

export async function updateDokument(
  id: string,
  data: ProduktionsDokumentUpdate
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('produktions_dokumente')
    .select('produktion_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('produktions_dokumente')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating dokument:', error)
    return { success: false, error: error.message }
  }

  if (existing?.produktion_id) {
    revalidatePath(`/produktionen/${existing.produktion_id}`)
  }
  return { success: true }
}

export async function deleteDokument(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile || !hasPermission(profile.role, 'produktionen:write')) {
    return { success: false, error: 'Keine Berechtigung.' }
  }

  const supabase = await createClient()

  // Get file path for storage cleanup
  const { data: doc } = await supabase
    .from('produktions_dokumente')
    .select('datei_pfad, produktion_id')
    .eq('id', id)
    .single()

  if (!doc) {
    return { success: false, error: 'Dokument nicht gefunden.' }
  }

  // Delete from storage
  await supabase.storage.from(BUCKET).remove([doc.datei_pfad])

  // Delete metadata
  const { error } = await supabase
    .from('produktions_dokumente')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting dokument:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/produktionen/${doc.produktion_id}`)
  return { success: true }
}
