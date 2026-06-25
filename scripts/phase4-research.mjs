#!/usr/bin/env node
/**
 * Phase 4 — research: enumerate DB objects that depend on System A tables.
 * - Functions referencing System A tables (DROP candidates)
 * - Foreign keys touching System A tables (any inbound?)
 * - Enum types defined for System A (DROP candidates)
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

// Use a generic SQL-RPC if available; fall back to information_schema via PostgREST limits.
// PostgREST cannot exec arbitrary SQL. So we use the existing exec_sql RPC if present.
async function rpcSql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  if (error) return { error: error.message }
  return { data }
}

// Try a simpler approach: query information_schema views directly via REST.
// Supabase exposes pg_proc / pg_type via a custom RPC if you've set one up.
// Without a known RPC we test exec_sql first; if it fails, instructions are printed.

console.log('--- 1) Functions referencing System A tables ---')
let res = await rpcSql(`
  SELECT routine_name, routine_definition
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND (routine_definition ILIKE '%helfer_events%'
      OR routine_definition ILIKE '%helfer_anmeldungen%'
      OR routine_definition ILIKE '%helfer_rollen_templates%'
      OR routine_definition ILIKE '%helfer_rollen_instanzen%');
`)
console.log(JSON.stringify(res, null, 2))

console.log('\n--- 2) Foreign keys involving System A tables ---')
res = await rpcSql(`
  SELECT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    tc.constraint_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name IN ('helfer_events','helfer_anmeldungen','helfer_rollen_templates','helfer_rollen_instanzen')
      OR ccu.table_name IN ('helfer_events','helfer_anmeldungen','helfer_rollen_templates','helfer_rollen_instanzen'));
`)
console.log(JSON.stringify(res, null, 2))

console.log('\n--- 3) Enum types for System A (look for helfer_*) ---')
res = await rpcSql(`
  SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid = t.oid
  WHERE t.typname ILIKE '%helfer%'
  GROUP BY t.typname;
`)
console.log(JSON.stringify(res, null, 2))

console.log('\n--- 4) All columns from System A tables (incl. type names for enums in use) ---')
res = await rpcSql(`
  SELECT table_name, column_name, data_type, udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('helfer_events','helfer_anmeldungen','helfer_rollen_templates','helfer_rollen_instanzen')
  ORDER BY table_name, ordinal_position;
`)
console.log(JSON.stringify(res, null, 2))

console.log('\n--- 5) Exact function signatures for known candidates ---')
res = await rpcSql(`
  SELECT n.nspname AS schema, p.proname AS name,
         pg_get_function_identity_arguments(p.oid) AS args,
         pg_get_function_result(p.oid) AS result
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'book_helfer_slot','book_helfer_slots','check_helfer_time_conflicts',
      'find_or_create_external_helper','get_helfer_dashboard_data',
      'get_helfer_event_belegung','get_helfer_anmeldung_historie'
    );
`)
console.log(JSON.stringify(res, null, 2))

console.log('\n--- 6) Inbound FKs FROM other tables INTO externe_helfer_profile (helfer_anmeldungen reference) ---')
res = await rpcSql(`
  SELECT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    tc.constraint_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'externe_helfer_profile';
`)
console.log(JSON.stringify(res, null, 2))
