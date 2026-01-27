import Link from 'next/link'

interface QuickLinkProps {
  href: string
  label: string
}

interface VorstandModulProps {
  titel: string
  icon?: React.ReactNode
  children: React.ReactNode
  quickLinks?: QuickLinkProps[]
  className?: string
}

export function VorstandModul({
  titel,
  icon,
  children,
  quickLinks,
  className = '',
}: VorstandModulProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-neutral-200 bg-white ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
        {icon && <span className="text-neutral-500">{icon}</span>}
        <h3 className="font-semibold text-neutral-900">{titel}</h3>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">{children}</div>

      {/* Quick Links */}
      {quickLinks && quickLinks.length > 0 && (
        <div className="border-t border-neutral-100 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href as never}
                className="text-xs text-neutral-500 hover:text-neutral-900 hover:underline"
              >
                {link.label} &rarr;
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Stat display within a module
interface ModulStatProps {
  label: string
  value: number | string
  subValue?: string
}

export function ModulStat({ label, value, subValue }: ModulStatProps) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-sm text-neutral-600">{label}</span>
      <div className="text-right">
        <span className="text-lg font-semibold text-neutral-900">{value}</span>
        {subValue && (
          <span className="ml-1 text-xs text-neutral-500">{subValue}</span>
        )}
      </div>
    </div>
  )
}

// Activity item within a module
interface ModulAktivitaetProps {
  icon?: 'neu' | 'austritt' | 'aenderung'
  text: string
  datum?: string
}

export function ModulAktivitaet({ icon, text, datum }: ModulAktivitaetProps) {
  const iconColors = {
    neu: 'text-green-500',
    austritt: 'text-red-500',
    aenderung: 'text-blue-500',
  }

  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      {icon && (
        <span className={`text-xs ${iconColors[icon]}`}>
          {icon === 'neu' ? '+' : icon === 'austritt' ? '-' : '~'}
        </span>
      )}
      <span className="flex-1 text-neutral-700">{text}</span>
      {datum && <span className="text-xs text-neutral-400">{datum}</span>}
    </div>
  )
}

export type { VorstandModulProps, QuickLinkProps, ModulStatProps, ModulAktivitaetProps }
