import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagement } from '@/lib/supabase/permissions'
import {
  getHelferEventMitDetails,
  getProfilesForAssignment,
} from '@/lib/actions/helferliste-management'
import { HelferEventDetail } from '@/components/vorstand/helferliste/HelferEventDetail'

export const metadata = {
  title: 'Event-Details | Helferliste | BackstagePass',
  description: 'Details und Verwaltung eines Helfer-Events',
}

export default async function VorstandHelferlisteDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login' as never)
  }

  if (!isManagement(profile.role)) {
    redirect('/dashboard' as never)
  }

  const { eventId } = await params

  const [eventResult, profilesResult] = await Promise.all([
    getHelferEventMitDetails(eventId),
    getProfilesForAssignment(),
  ])

  if (!eventResult.success || !eventResult.data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href={"/vorstand/helferliste" as never}
          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
        >
          &larr; Zurück zur Übersicht
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800">
            {eventResult.error || 'Event nicht gefunden'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href={"/vorstand/helferliste" as never}
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
      >
        &larr; Zurück zur Übersicht
      </Link>

      <HelferEventDetail
        event={eventResult.data}
        profiles={profilesResult.success ? profilesResult.data ?? [] : []}
      />
    </div>
  )
}
