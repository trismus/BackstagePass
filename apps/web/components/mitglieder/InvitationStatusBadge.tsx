interface InvitationStatusBadgeProps {
  profileId: string | null
  invitedAt: string | null
  invitationAcceptedAt: string | null
  email: string | null
}

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
}

export function InvitationStatusBadge({
  profileId,
  invitedAt,
  invitationAcceptedAt,
  email,
}: InvitationStatusBadgeProps) {
  // No email → no badge
  if (!email) return null

  // Profile linked → active
  if (profileId || invitationAcceptedAt) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        Aktiv
      </span>
    )
  }

  // Invited but not yet accepted
  if (invitedAt) {
    const days = daysSince(invitedAt)
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
        Eingeladen{days > 0 ? ` (vor ${days} T.)` : ''}
      </span>
    )
  }

  // Has email but no invite sent
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
      Kein Zugang
    </span>
  )
}
