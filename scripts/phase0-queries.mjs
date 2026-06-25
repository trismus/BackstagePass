#!/usr/bin/env node
/**
 * Phase 0 — Datenbasis-Erhebung für System A Abschaffung (Issue #468)
 *
 * Führt 6 read-only SELECT-Queries gegen die Supabase-DB aus,
 * aggregiert in JS (da REST-API keine SQL-Aggregates unterstützt).
 *
 * Usage: node scripts/phase0-queries.mjs
 * Env:   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from apps/web/.env.local)
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '../apps/web/node_modules/@supabase/supabase-js/dist/index.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load env from apps/web/.env.local
const envPath = join(__dirname, '..', 'apps', 'web', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) {
    let val = m[2].replace(/^["']|["']$/g, '')
    // Strip embedded literal \n that some env exports include
    val = val.replace(/\\n/g, '')
    env[m[1]] = val
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const now = new Date().toISOString()

async function main() {
  // ------------------------------------------------------------------
  // Query 1: Anmeldungen nach Status
  // ------------------------------------------------------------------
  const { data: q1Data, error: q1Err } = await supabase
    .from('helfer_anmeldungen')
    .select('status')
  if (q1Err) throw q1Err
  const q1 = {}
  for (const row of q1Data) {
    q1[row.status] = (q1[row.status] || 0) + 1
  }

  // ------------------------------------------------------------------
  // Query 2: Zukünftige Events (datum_end >= NOW())
  // ------------------------------------------------------------------
  const { count: q2Count, error: q2Err } = await supabase
    .from('helfer_events')
    .select('*', { count: 'exact', head: true })
    .gte('datum_end', now)
  if (q2Err) throw q2Err

  // ------------------------------------------------------------------
  // Query 3: Verknüpfte Veranstaltungen (zukünftig)
  // ------------------------------------------------------------------
  const { data: q3, error: q3Err } = await supabase
    .from('helfer_events')
    .select('name, datum_start, veranstaltung_id, veranstaltungen(titel)')
    .gte('datum_end', now)
    .order('datum_start', { ascending: true })
  if (q3Err) throw q3Err

  // ------------------------------------------------------------------
  // Query 4 & 6: Anmeldungen in zukünftigen Events
  // (joined über helfer_rollen_instanzen -> helfer_events)
  // ------------------------------------------------------------------
  // Hole zuerst alle zukünftigen Event-IDs
  const { data: futureEvents, error: feErr } = await supabase
    .from('helfer_events')
    .select('id, name, datum_start, datum_end')
    .gte('datum_end', now)
  if (feErr) throw feErr
  const futureEventIds = futureEvents.map((e) => e.id)
  const eventMap = new Map(futureEvents.map((e) => [e.id, e]))

  // Hole alle rollen_instanzen für diese events
  let futureAnmeldungen = []
  if (futureEventIds.length > 0) {
    const { data: rollenInstanzen, error: riErr } = await supabase
      .from('helfer_rollen_instanzen')
      .select('id, helfer_event_id')
      .in('helfer_event_id', futureEventIds)
    if (riErr) throw riErr
    const instanzMap = new Map(rollenInstanzen.map((r) => [r.id, r.helfer_event_id]))
    const rollenInstanzIds = rollenInstanzen.map((r) => r.id)

    if (rollenInstanzIds.length > 0) {
      // Hole alle Anmeldungen für diese Rollen-Instanzen
      // Batch in chunks von 200 für IN-Klausel-Sicherheit
      const chunkSize = 200
      for (let i = 0; i < rollenInstanzIds.length; i += chunkSize) {
        const chunk = rollenInstanzIds.slice(i, i + chunkSize)
        const { data, error } = await supabase
          .from('helfer_anmeldungen')
          .select('status, rollen_instanz_id')
          .in('rollen_instanz_id', chunk)
        if (error) throw error
        for (const a of data) {
          const eventId = instanzMap.get(a.rollen_instanz_id)
          const event = eventMap.get(eventId)
          futureAnmeldungen.push({
            status: a.status,
            event_name: event?.name,
            datum_start: event?.datum_start,
          })
        }
      }
    }
  }

  // Query 4: Status-Aggregat über zukünftige Anmeldungen
  const q4 = {}
  for (const a of futureAnmeldungen) {
    q4[a.status] = (q4[a.status] || 0) + 1
  }

  // Query 5: Wartelisten-Einträge (gesamt, nicht nur zukünftig)
  const q5Count = q1.warteliste || 0

  // Query 6: Detail-Aggregat — Event x Status
  const q6Map = new Map()
  for (const a of futureAnmeldungen) {
    const key = `${a.event_name}|${a.datum_start}|${a.status}`
    q6Map.set(key, (q6Map.get(key) || 0) + 1)
  }
  const q6 = []
  for (const [key, anzahl] of q6Map) {
    const [event_name, datum_start, status] = key.split('|')
    q6.push({ event_name, datum_start, status, anzahl })
  }
  q6.sort((a, b) => {
    if (a.datum_start !== b.datum_start) return a.datum_start.localeCompare(b.datum_start)
    return a.status.localeCompare(b.status)
  })

  // ------------------------------------------------------------------
  // Auswertung: 3 Kernzahlen
  // ------------------------------------------------------------------
  const inactiveStatuses = new Set(['abgelehnt', 'storniert', 'abgesagt'])
  const aktiveZukunft = futureAnmeldungen.filter(
    (a) => !inactiveStatuses.has(a.status),
  ).length

  let latestEvent = null
  for (const e of futureEvents) {
    if (!latestEvent || e.datum_start > latestEvent.datum_start) latestEvent = e
  }

  const result = {
    timestamp: now,
    queries: {
      q1_anmeldungen_by_status: q1,
      q2_future_events_count: q2Count,
      q3_future_events_with_veranstaltungen: q3.map((e) => ({
        event_name: e.name,
        veranstaltung_titel: e.veranstaltungen?.titel ?? null,
        datum_start: e.datum_start,
      })),
      q4_future_anmeldungen_by_status: q4,
      q5_warteliste_total: q5Count,
      q6_future_anmeldungen_detail: q6,
    },
    kernzahlen: {
      aktive_anmeldungen_zukunft: aktiveZukunft,
      spaetestes_zukuenftiges_event: latestEvent
        ? { name: latestEvent.name, datum_start: latestEvent.datum_start }
        : null,
      wartelisten_eintraege_total: q5Count,
    },
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error('FAILED:', err)
  process.exit(1)
})
