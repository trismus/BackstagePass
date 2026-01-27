import Link from 'next/link'

type Prioritaet = 'kritisch' | 'warnung' | 'info' | 'ok'

interface HandlungsbedarfCardProps {
  prioritaet: Prioritaet
  titel: string
  beschreibung: string
  href?: string
  count?: number
}

const prioritaetStyles: Record<Prioritaet, { bg: string; border: string; icon: string; text: string }> = {
  kritisch: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    text: 'text-red-800',
  },
  warnung: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    text: 'text-amber-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-800',
  },
  ok: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    text: 'text-green-800',
  },
}

const prioritaetIcons: Record<Prioritaet, React.ReactNode> = {
  kritisch: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  warnung: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ok: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export function HandlungsbedarfCard({
  prioritaet,
  titel,
  beschreibung,
  href,
  count,
}: HandlungsbedarfCardProps) {
  const styles = prioritaetStyles[prioritaet]

  const content = (
    <div
      className={`rounded-lg border p-3 ${styles.bg} ${styles.border} ${
        href ? 'transition-colors hover:opacity-80' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={styles.icon}>{prioritaetIcons[prioritaet]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-medium ${styles.text}`}>{titel}</p>
            {count !== undefined && (
              <span className={`text-lg font-bold ${styles.text}`}>{count}</span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${styles.text} opacity-80`}>
            {beschreibung}
          </p>
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href as never}>{content}</Link>
  }

  return content
}

export type { Prioritaet, HandlungsbedarfCardProps }
