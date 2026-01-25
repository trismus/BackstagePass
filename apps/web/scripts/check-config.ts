#!/usr/bin/env npx tsx
/**
 * Configuration Check Script
 *
 * Prüft ob Vercel und Supabase korrekt konfiguriert sind.
 *
 * Usage:
 *   npx tsx scripts/check-config.ts
 *   npm run check:config
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
}

const SYMBOLS = {
  ok: `${COLORS.green}✓${COLORS.reset}`,
  error: `${COLORS.red}✗${COLORS.reset}`,
  warn: `${COLORS.yellow}!${COLORS.reset}`,
  info: `${COLORS.blue}→${COLORS.reset}`,
}

interface CheckResult {
  name: string
  status: 'ok' | 'error' | 'warn'
  message: string
}

const results: CheckResult[] = []

function check(name: string, condition: boolean, message: string, warnOnly = false) {
  results.push({
    name,
    status: condition ? 'ok' : warnOnly ? 'warn' : 'error',
    message,
  })
}

function printHeader(title: string) {
  console.log(`\n${COLORS.blue}━━━ ${title} ━━━${COLORS.reset}\n`)
}

function printResults() {
  console.log(`\n${COLORS.blue}━━━ Ergebnis ━━━${COLORS.reset}\n`)

  for (const result of results) {
    const symbol = SYMBOLS[result.status]
    console.log(`  ${symbol} ${result.name}: ${result.message}`)
  }

  const errors = results.filter((r) => r.status === 'error')
  const warns = results.filter((r) => r.status === 'warn')

  console.log('')

  if (errors.length === 0 && warns.length === 0) {
    console.log(`${COLORS.green}Alle Checks bestanden!${COLORS.reset}\n`)
  } else if (errors.length === 0) {
    console.log(
      `${COLORS.yellow}${warns.length} Warnung(en), aber keine kritischen Fehler.${COLORS.reset}\n`
    )
  } else {
    console.log(
      `${COLORS.red}${errors.length} Fehler gefunden. Bitte beheben vor dem Deployment.${COLORS.reset}\n`
    )
    process.exit(1)
  }
}

async function main() {
  console.log(`\n${COLORS.blue}BackstagePass - Konfigurations-Check${COLORS.reset}`)
  console.log(`${COLORS.dim}Prüft Vercel und Supabase Konfiguration${COLORS.reset}`)

  // ─────────────────────────────────────────────
  // 1. Dateien prüfen
  // ─────────────────────────────────────────────
  printHeader('1. Projekt-Dateien')

  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.ts',
    'tailwind.config.ts',
    'lib/supabase/client.ts',
    'lib/supabase/server.ts',
  ]

  for (const file of requiredFiles) {
    const filePath = join(process.cwd(), file)
    const exists = existsSync(filePath)
    check(`Datei: ${file}`, exists, exists ? 'vorhanden' : 'fehlt')
  }

  // ─────────────────────────────────────────────
  // 2. Environment Variables prüfen
  // ─────────────────────────────────────────────
  printHeader('2. Environment Variables')

  // Check for .env.local
  const envLocalPath = join(process.cwd(), '.env.local')
  const envLocalExists = existsSync(envLocalPath)

  check(
    '.env.local Datei',
    envLocalExists,
    envLocalExists ? 'vorhanden' : 'fehlt - erstelle mit Supabase Credentials',
    true
  )

  // Required env vars
  const requiredEnvVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', pattern: /^https:\/\/.*\.supabase\.co$/ },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', pattern: /^eyJ.*/ },
  ]

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name]
    const exists = !!value
    const valid = exists && envVar.pattern.test(value)

    if (!exists) {
      check(envVar.name, false, 'nicht gesetzt')
    } else if (!valid) {
      check(envVar.name, false, 'ungültiges Format')
    } else {
      check(envVar.name, true, 'korrekt konfiguriert')
    }
  }

  // ─────────────────────────────────────────────
  // 3. Supabase Verbindung testen
  // ─────────────────────────────────────────────
  printHeader('3. Supabase Verbindung')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      })

      check(
        'Supabase API',
        response.ok || response.status === 404,
        response.ok || response.status === 404
          ? `erreichbar (${response.status})`
          : `Fehler: ${response.status}`
      )
    } catch (err) {
      check(
        'Supabase API',
        false,
        `Verbindungsfehler: ${err instanceof Error ? err.message : 'unbekannt'}`
      )
    }
  } else {
    check('Supabase API', false, 'Credentials fehlen - Test übersprungen', true)
  }

  // ─────────────────────────────────────────────
  // 4. Vercel Konfiguration
  // ─────────────────────────────────────────────
  printHeader('4. Vercel Konfiguration')

  // Check for vercel.json (optional)
  const vercelJsonPath = join(process.cwd(), 'vercel.json')
  const vercelJsonExists = existsSync(vercelJsonPath)
  check('vercel.json', vercelJsonExists, vercelJsonExists ? 'vorhanden' : 'nicht vorhanden (optional)', true)

  // Check if running on Vercel
  const isVercel = !!process.env.VERCEL
  check(
    'Vercel Environment',
    true,
    isVercel ? `Läuft auf Vercel (${process.env.VERCEL_ENV})` : 'Lokale Entwicklung',
    true
  )

  // ─────────────────────────────────────────────
  // 5. package.json Scripts
  // ─────────────────────────────────────────────
  printHeader('5. npm Scripts')

  try {
    const pkgPath = join(process.cwd(), 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const scripts = pkg.scripts || {}

    const requiredScripts = ['dev', 'build', 'start', 'lint']
    for (const script of requiredScripts) {
      check(`Script: ${script}`, !!scripts[script], scripts[script] ? 'vorhanden' : 'fehlt')
    }
  } catch {
    check('package.json', false, 'konnte nicht gelesen werden')
  }

  // ─────────────────────────────────────────────
  // Ergebnis
  // ─────────────────────────────────────────────
  printResults()
}

main().catch(console.error)
