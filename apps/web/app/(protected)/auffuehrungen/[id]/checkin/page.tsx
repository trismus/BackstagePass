import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
import { getUserProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/supabase/auth-helpers'
import { getCheckInOverview } from '@/lib/actions/check-in'
import { CheckInList } from '@/components/checkin/CheckInList'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const data = await getCheckInOverview(id)
  return {
    title: data
      ? `Check-in - ${data.veranstaltung.titel}`
      : 'Check-in',
    description: 'Helfer Check-in am Veranstaltungstag',
  }
}

export default async function CheckInPage({ params }: PageProps) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Check permission - only management can access check-in
  if (!hasPermission(profile.role, 'veranstaltungen:write')) {
    redirect('/dashboard')
  }

  const { id } = await params
  const data = await getCheckInOverview(id)

  if (!data) {
    notFound()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/auffuehrungen/${id}` as never}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Check-in
                </h1>
              </div>
              <p className="text-sm text-gray-500">
                {data.veranstaltung.titel} - {formatDate(data.veranstaltung.datum)}
              </p>
            </div>
            <Link
              href={`/auffuehrungen/${id}/live-board` as never}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Live-Board
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        <CheckInList initialData={data} />
      </div>
    </main>
  )
}
