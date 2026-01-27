import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/supabase/auth-helpers'

export const metadata = {
  title: 'Changelog - Admin',
  description: 'Versionshistorie und Updates',
}

async function getChangelog(): Promise<string> {
  try {
    // Read CHANGELOG.md from project root
    const changelogPath = path.join(process.cwd(), '..', '..', 'CHANGELOG.md')
    const content = await fs.readFile(changelogPath, 'utf-8')
    return content
  } catch {
    // Fallback: try current directory
    try {
      const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
      const content = await fs.readFile(changelogPath, 'utf-8')
      return content
    } catch {
      return '# Changelog\n\nKein Changelog gefunden.'
    }
  }
}

function parseChangelog(content: string): { version: string; changes: string[] }[] {
  const lines = content.split('\n')
  const sections: { version: string; changes: string[] }[] = []
  let currentVersion = ''
  let currentChanges: string[] = []
  let inSection = false

  for (const line of lines) {
    // Match version headers like "## [Unreleased]" or "## [1.0.0] - 2024-01-01"
    const versionMatch = line.match(/^## \[([^\]]+)\]/)
    if (versionMatch) {
      if (currentVersion) {
        sections.push({ version: currentVersion, changes: currentChanges })
      }
      currentVersion = versionMatch[1]
      currentChanges = []
      inSection = true
      continue
    }

    // Skip subsection headers (### Added, ### Changed, etc) but keep content
    if (line.startsWith('### ')) {
      currentChanges.push(`**${line.substring(4)}**`)
      continue
    }

    // Collect bullet points
    if (inSection && line.startsWith('- ')) {
      currentChanges.push(line.substring(2))
    }
  }

  // Don't forget the last section
  if (currentVersion) {
    sections.push({ version: currentVersion, changes: currentChanges })
  }

  return sections
}

export default async function ChangelogPage() {
  const profile = await getUserProfile()

  if (!profile || !isAdmin(profile.role)) {
    redirect('/dashboard')
  }

  const changelogContent = await getChangelog()
  const sections = parseChangelog(changelogContent)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Changelog</h1>
          <p className="mt-1 text-neutral-600">
            Versionshistorie und Updates von BackstagePass
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          &larr; Zurück
        </Link>
      </div>

      {/* Changelog Sections */}
      <div className="space-y-6">
        {sections.length > 0 ? (
          sections.map((section) => (
            <div
              key={section.version}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
            >
              <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
                <h2 className="font-semibold text-neutral-900">
                  {section.version === 'Unreleased' ? (
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      In Entwicklung
                    </span>
                  ) : (
                    `Version ${section.version}`
                  )}
                </h2>
              </div>
              <div className="p-4">
                {section.changes.length > 0 ? (
                  <ul className="space-y-2">
                    {section.changes.map((change, index) =>
                      change.startsWith('**') ? (
                        <li
                          key={index}
                          className="mt-3 first:mt-0 text-sm font-semibold text-neutral-700"
                        >
                          {change.replace(/\*\*/g, '')}
                        </li>
                      ) : (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-neutral-600"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-300"></span>
                          {change}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500">Keine Einträge</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
            <p className="text-neutral-500">Kein Changelog verfügbar</p>
          </div>
        )}
      </div>

      {/* Raw Markdown */}
      <details className="rounded-xl border border-neutral-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm text-neutral-500 hover:text-neutral-900">
          Raw Markdown anzeigen
        </summary>
        <div className="border-t border-neutral-100 p-4">
          <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-neutral-600">
            {changelogContent}
          </pre>
        </div>
      </details>
    </div>
  )
}
