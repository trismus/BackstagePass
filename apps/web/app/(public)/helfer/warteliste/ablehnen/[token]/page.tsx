import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { rejectWaitlistByToken } from '@/lib/actions/warteliste-notification'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui'

export const metadata = {
  title: 'Wartelisten-Platz ablehnen',
  description: 'Lehne den angebotenen Platz ab',
}

export default async function WaitlistRejectPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Verify token exists
  const supabase = await createClient()
  const { data: entry } = await supabase
    .from('helfer_warteliste')
    .select('id, status')
    .eq('confirmation_token', token)
    .single()

  if (!entry) {
    notFound()
  }

  // If already rejected or assigned, show message
  if (entry.status === 'abgelehnt') {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Bereits abgelehnt</CardTitle>
            <CardDescription>
              Du hast diesen Platz bereits abgelehnt.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (entry.status === 'zugewiesen') {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Bereits angemeldet</CardTitle>
            <CardDescription>
              Du bist bereits für diesen Einsatz angemeldet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Process rejection
  const result = await rejectWaitlistByToken(token)

  if (!result.success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Fehler</CardTitle>
            <CardDescription>
              {result.error || 'Ein Fehler ist aufgetreten.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Platz abgelehnt</CardTitle>
          <CardDescription>
            Schade, dass es nicht klappt. Der Platz wird an die nächste Person auf der Warteliste vergeben.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
