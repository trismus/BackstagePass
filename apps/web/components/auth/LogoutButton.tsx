'use client'

import { signOut } from '@/app/actions/auth'

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
    >
      Abmelden
    </button>
  )
}
