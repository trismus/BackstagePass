'use client'

import { useCallback } from 'react'
import type { UserRole } from '@/lib/supabase/types'
import { AppLayout } from './AppLayout'

interface AppLayoutWrapperProps {
  children: React.ReactNode
  userEmail?: string
  userRole: UserRole
  displayName?: string | null
  onLogout?: () => Promise<void>
}

export function AppLayoutWrapper({
  children,
  userEmail,
  userRole,
  displayName,
  onLogout,
}: AppLayoutWrapperProps) {
  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout()
    }
  }, [onLogout])

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
