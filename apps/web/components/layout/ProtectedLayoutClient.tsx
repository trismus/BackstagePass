'use client'

import { AppLayout } from '@/components/layout'
import { signOut } from '@/app/actions/auth'
import type { UserRole } from '@/lib/supabase/types'

interface ProtectedLayoutClientProps {
  children: React.ReactNode
  userEmail?: string
  userRole: UserRole
  displayName?: string | null
}

export function ProtectedLayoutClient({
  children,
  userEmail,
  userRole,
  displayName,
}: ProtectedLayoutClientProps) {
  const handleLogout = async () => {
    await signOut()
  }

  return (
    <AppLayout
      userEmail={userEmail}
      userRole={userRole}
      displayName={displayName}
      onLogout={handleLogout}
    >
      {children}
    </AppLayout>
  )
}
