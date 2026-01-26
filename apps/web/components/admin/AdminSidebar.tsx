'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'

function DashboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function AuditIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function NavLinkContent({
  icon,
  label,
  isActive,
}: {
  icon: React.ReactNode
  label: string
  isActive: boolean
}) {
  return (
    <span
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-neutral-900 text-white'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      }`}
    >
      {icon}
      {label}
    </span>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full border-b border-neutral-200 bg-white lg:w-64 lg:border-b-0 lg:border-r">
      <div className="p-4">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Administration
        </h2>
        <nav className="flex flex-row gap-2 lg:flex-col">
          <Link href={'/admin' as Route}>
            <NavLinkContent
              icon={<DashboardIcon />}
              label="Dashboard"
              isActive={pathname === '/admin'}
            />
          </Link>
          <Link href="/admin/users">
            <NavLinkContent
              icon={<UsersIcon />}
              label="Benutzer"
              isActive={pathname === '/admin/users'}
            />
          </Link>
          <Link href="/admin/audit">
            <NavLinkContent
              icon={<AuditIcon />}
              label="Audit Log"
              isActive={pathname === '/admin/audit'}
            />
          </Link>
        </nav>
      </div>
    </aside>
  )
}
