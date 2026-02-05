import Link from 'next/link'
import type { Route } from 'next'
import { getMeetings } from '@/lib/actions/meetings'
import { getUserProfile } from '@/lib/supabase/server'
import { canEdit as checkCanEdit } from '@/lib/supabase/auth-helpers'
import { MEETING_TYP_LABELS } from '@/lib/supabase/types'

export default async function MeetingsPage() {
  const profile = await getUserProfile()
  const canEdit = profile ? checkCanEdit(profile.role) : false
  const meetings = await getMeetings({ limit: 50 })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="mt-1 text-gray-600">
            Vorstandssitzungen, Regiesitzungen und Teambesprechungen
          </p>
        </div>
        {canEdit && (
          <Link
            href={'/meetings/neu' as Route}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Neues Meeting
          </Link>
        )}
      </div>

      {/* Meetings List */}
      <div className="rounded-lg bg-white shadow">
        {meetings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Noch keine Meetings vorhanden
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {meetings.map((meeting) => (
              <li key={meeting.id}>
                <Link
                  href={`/meetings/${meeting.veranstaltung.id}` as Route}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                          {MEETING_TYP_LABELS[meeting.meeting_typ]}
                        </span>
                        <h3 className="font-medium text-gray-900">
                          {meeting.veranstaltung.titel}
                        </h3>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatDate(meeting.veranstaltung.datum)}</span>
                        {meeting.veranstaltung.startzeit && (
                          <span>{meeting.veranstaltung.startzeit.slice(0, 5)} Uhr</span>
                        )}
                        {meeting.veranstaltung.ort && (
                          <span>{meeting.veranstaltung.ort}</span>
                        )}
                      </div>
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
