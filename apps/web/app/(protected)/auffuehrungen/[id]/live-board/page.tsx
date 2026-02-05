import { redirect, notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/supabase/auth-helpers'
import { getLiveBoardData } from '@/lib/actions/live-board'
import { TimelineView } from '@/components/live-board/TimelineView'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const data = await getLiveBoardData(id)
  return {
    title: data
      ? `Live-Board - ${data.veranstaltung.titel}`
      : 'Live-Board',
    description: 'Echtzeit-Uebersicht ueber Helfer-Status',
  }
}

export default async function LiveBoardPage({ params }: PageProps) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Check permission - only management can access live board
  if (!hasPermission(profile.role, 'veranstaltungen:write')) {
    redirect('/dashboard')
  }

  const { id } = await params
  const data = await getLiveBoardData(id)

  if (!data) {
    notFound()
  }

  return <TimelineView initialData={data} />
}
