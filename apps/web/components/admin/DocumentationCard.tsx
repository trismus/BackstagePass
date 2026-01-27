import Link from 'next/link'

interface DocLink {
  href: string
  label: string
  description?: string
  icon: 'book' | 'code' | 'changelog' | 'external'
  external?: boolean
}

const DOCUMENTATION_LINKS: DocLink[] = [
  {
    href: '/docs/user-guide',
    label: 'Benutzerhandbuch',
    description: 'Anleitung für alle Funktionen',
    icon: 'book',
  },
  {
    href: '/admin/changelog',
    label: 'Changelog',
    description: 'Versionshistorie und Updates',
    icon: 'changelog',
  },
  {
    href: 'https://github.com/trismus/BackstagePass',
    label: 'GitHub Repository',
    description: 'Quellcode und Issues',
    icon: 'code',
    external: true,
  },
]

const ICON_MAP = {
  book: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  code: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  changelog: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  external: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
}

export function DocumentationCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
        <h3 className="font-medium text-neutral-900">Dokumentation</h3>
      </div>

      <div className="divide-y divide-neutral-100">
        {DOCUMENTATION_LINKS.map((link) => {
          const icon = ICON_MAP[link.icon]

          if (link.external) {
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
              >
                <span className="text-neutral-400">{icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-neutral-900">{link.label}</p>
                    <svg className="h-3 w-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  {link.description && (
                    <p className="text-xs text-neutral-500">{link.description}</p>
                  )}
                </div>
              </a>
            )
          }

          return (
            <Link
              key={link.href}
              href={link.href as never}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
            >
              <span className="text-neutral-400">{icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{link.label}</p>
                {link.description && (
                  <p className="text-xs text-neutral-500">{link.description}</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
