#!/usr/bin/env node
/**
 * Sanity check — verify System A tables exist and have any data at all.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '../apps/web/node_modules/@supabase/supabase-js/dist/index.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const envPath = join(__dirname, '..', 'apps', 'web', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) {
    let val = m[2].replace(/^["']|["']$/g, '')
    val = val.replace(/\\n/g, '')
    env[m[1]] = val
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const tables = [
  'helfer_anmeldungen',
  'helfer_events',
  'helfer_rollen_instanzen',
  'helfer_rollen_templates',
  'veranstaltungen',
]

for (const t of tables) {
  const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true })
  if (error) {
    console.log(`${t}: ERROR ${error.message}`)
  } else {
    console.log(`${t}: ${count} rows`)
  }
}

// Sample a row from helfer_events
console.log('\n--- Sample helfer_events ---')
const { data: sample } = await supabase
  .from('helfer_events')
  .select('id, name, datum_start, datum_end, veranstaltung_id')
  .order('datum_start', { ascending: false })
  .limit(5)
console.log(JSON.stringify(sample, null, 2))

// Sample distinct statuses
console.log('\n--- All distinct statuses in helfer_anmeldungen ---')
const { data: anm } = await supabase.from('helfer_anmeldungen').select('status').limit(2000)
const statuses = new Set((anm || []).map((a) => a.status))
console.log([...statuses])
console.log('Total rows sampled:', anm?.length)
