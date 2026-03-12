'use server'

import { promises as fs } from 'fs'
import path from 'path'
import { getUserProfile } from '@/lib/supabase/server'
import {
  HELP_TOPICS,
  canAccessHelpTopic,
  getAccessibleRelatedTopics,
  type HelpContextKey,
  type HelpTopic,
} from '@/lib/help'

export interface HelpContent {
  title: string
  description: string
  html: string
  relatedTopics: Array<{
    key: HelpContextKey
    title: string
    description: string
  }>
}

export interface HelpResult {
  success: boolean
  content?: HelpContent
  error?: string
}

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Validate that a URL uses a safe protocol (not javascript:, data:, etc.)
 */
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('#')) {
    return true
  }
  return false
}

/**
 * Parse markdown to HTML
 * Lightweight parser without external dependencies
 */
function parseMarkdown(markdown: string): string {
  let html = markdown

  // Remove front matter if present
  html = html.replace(/^---[\s\S]*?---\n*/m, '')

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-900 mt-6 mb-2">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-gray-900 mt-8 mb-3">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mb-4">$1</h1>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-6 border-gray-200" />')

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono">$1</code>')

  // Blockquotes (tips)
  html = html.replace(
    /^> (.+)$/gm,
    '<blockquote class="pl-4 border-l-4 border-primary-300 bg-primary-50 py-2 my-3 text-gray-700">$1</blockquote>'
  )

  // Tables
  html = parseTable(html)

  // Links - convert internal docs links to /hilfe routes
  html = html.replace(
    /\[([^\]]+)\]\(\.\/([^)]+)\.md\)/g,
    (_match: string, text: string, slug: string) =>
      `<a href="/hilfe/${encodeURI(slug)}" class="text-primary-600 hover:text-primary-700 underline">${escapeHtml(text)}</a>`
  )
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match: string, text: string, url: string) => {
      if (!isSafeUrl(url)) return escapeHtml(text)
      return `<a href="${encodeURI(url)}" class="text-primary-600 hover:text-primary-700 underline" target="_blank" rel="noopener">${escapeHtml(text)}</a>`
    }
  )

  // Unordered lists
  html = parseUnorderedLists(html)

  // Paragraphs - wrap remaining text blocks
  html = html
    .split('\n\n')
    .map((block) => {
      block = block.trim()
      if (!block) return ''
      // Don't wrap if already wrapped in HTML tags
      if (
        block.startsWith('<h') ||
        block.startsWith('<ul') ||
        block.startsWith('<table') ||
        block.startsWith('<hr') ||
        block.startsWith('<blockquote')
      ) {
        return block
      }
      // Check if it's a list item line
      if (block.match(/^<li/)) {
        return block
      }
      return `<p class="text-gray-700 mb-4">${block.replace(/\n/g, '<br />')}</p>`
    })
    .join('\n')

  return html
}

/**
 * Parse unordered lists
 */
function parseUnorderedLists(html: string): string {
  const lines = html.split('\n')
  const result: string[] = []
  let inList = false

  for (const line of lines) {
    const listMatch = line.match(/^- (.+)$/)
    if (listMatch) {
      if (!inList) {
        result.push('<ul class="list-disc list-inside space-y-1 my-4 text-gray-700">')
        inList = true
      }
      result.push(`<li>${listMatch[1]}</li>`)
    } else {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      result.push(line)
    }
  }

  if (inList) {
    result.push('</ul>')
  }

  return result.join('\n')
}

/**
 * Parse markdown tables
 */
function parseTable(html: string): string {
  const tableRegex = /\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g

  return html.replace(tableRegex, (_match, headerRow, bodyRows) => {
    const headers = headerRow
      .split('|')
      .map((h: string) => h.trim())
      .filter(Boolean)
    const rows = bodyRows
      .trim()
      .split('\n')
      .map((row: string) =>
        row
          .split('|')
          .map((c: string) => c.trim())
          .filter(Boolean)
      )

    let table =
      '<table class="min-w-full border-collapse my-4 text-sm">'
    table += '<thead><tr class="bg-gray-50">'
    for (const header of headers) {
      table += `<th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">${escapeHtml(header)}</th>`
    }
    table += '</tr></thead><tbody>'

    for (const row of rows) {
      table += '<tr>'
      for (const cell of row) {
        table += `<td class="border border-gray-200 px-3 py-2 text-gray-600">${escapeHtml(cell)}</td>`
      }
      table += '</tr>'
    }

    table += '</tbody></table>'
    return table
  })
}

/**
 * Load help content for a specific context key
 */
export async function getHelpContent(
  contextKey: HelpContextKey
): Promise<HelpResult> {
  try {
    // Get user profile for access check
    const profile = await getUserProfile()
    if (!profile) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    // Check access
    if (!canAccessHelpTopic(profile.role, contextKey)) {
      return { success: false, error: 'Keine Berechtigung' }
    }

    const topic = HELP_TOPICS[contextKey]
    if (!topic) {
      return { success: false, error: 'Thema nicht gefunden' }
    }

    // Load markdown file
    const filePath = path.join(
      process.cwd(),
      '..',
      '..',
      'docs',
      'user-guide',
      topic.file
    )

    let markdown: string
    try {
      markdown = await fs.readFile(filePath, 'utf-8')
    } catch {
      return { success: false, error: 'Hilfedatei nicht gefunden' }
    }

    // Parse to HTML
    const html = parseMarkdown(markdown)

    // Get accessible related topics
    const relatedTopics = getAccessibleRelatedTopics(
      profile.role,
      topic.relatedTopics
    ).map((t) => ({
      key: Object.entries(HELP_TOPICS).find(
        ([, v]) => v === t
      )?.[0] as HelpContextKey,
      title: t.title,
      description: t.description,
    }))

    return {
      success: true,
      content: {
        title: topic.title,
        description: topic.description,
        html,
        relatedTopics,
      },
    }
  } catch (error) {
    console.error('Error loading help content:', error)
    return { success: false, error: 'Fehler beim Laden der Hilfe' }
  }
}

/**
 * Get help topic metadata (for overview pages)
 */
export async function getHelpTopics(): Promise<{
  success: boolean
  sections?: Record<string, Array<{ key: HelpContextKey; topic: HelpTopic }>>
  error?: string
}> {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    const sections: Record<
      string,
      Array<{ key: HelpContextKey; topic: HelpTopic }>
    > = {}

    for (const [key, topic] of Object.entries(HELP_TOPICS)) {
      if (!canAccessHelpTopic(profile.role, key as HelpContextKey)) {
        continue
      }
      if (key === 'hilfe') continue // Skip overview topic

      if (!sections[topic.section]) {
        sections[topic.section] = []
      }
      sections[topic.section].push({
        key: key as HelpContextKey,
        topic,
      })
    }

    return { success: true, sections }
  } catch (error) {
    console.error('Error loading help topics:', error)
    return { success: false, error: 'Fehler beim Laden der Themen' }
  }
}
