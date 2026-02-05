import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { WaitlistConfirmForm } from './WaitlistConfirmForm'

export const metadata = {
  title: 'Wartelisten-Platz bestätigen',
  description: 'Bestätige deinen Platz für den Helfereinsatz',
}

async function getWaitlistEntry(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('helfer_warteliste')
    .select(`
      id,
      status,
      antwort_deadline,
      profile:profiles(display_name),
      schicht:auffuehrung_schichten(
        id,
        rolle,
        veranstaltung:veranstaltungen(id, titel, datum, startzeit, ort),
        zeitblock:zeitbloecke(name, startzeit, endzeit)
      )
    `)
    .eq('confirmation_token', token)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export default async function WaitlistConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const entry = await getWaitlistEntry(token)

  if (!entry) {
    notFound()
  }

  const profile = entry.profile as unknown as { display_name: string } | null
  const schicht = entry.schicht as unknown as {
    id: string
    rolle: string
    veranstaltung: { id: string; titel: string; datum: string; startzeit: string; ort: string } | null
    zeitblock: { name: string; startzeit: string; endzeit: string } | null
  } | null

  const veranstaltung = schicht?.veranstaltung
  const zeitblock = schicht?.zeitblock

  // Check status
  if (entry.status === 'zugewiesen') {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-success-700">Bereits bestätigt!</CardTitle>
            <CardDescription>
              Du bist bereits für diesen Einsatz angemeldet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (entry.status === 'abgelehnt') {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Platz nicht mehr verfügbar</CardTitle>
            <CardDescription>
              Dieser Platz wurde bereits abgelehnt oder ist nicht mehr verfügbar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (entry.status !== 'benachrichtigt') {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Link ungültig</CardTitle>
            <CardDescription>
              Dieser Link ist nicht mehr gültig.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check deadline
  if (entry.antwort_deadline && new Date(entry.antwort_deadline) < new Date()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Frist abgelaufen</CardTitle>
            <CardDescription>
              Die Bestätigungsfrist ist leider abgelaufen. Der Platz wurde an die nächste Person auf der Warteliste vergeben.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string) => timeStr?.slice(0, 5)

  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${formatDate(date.toISOString().split('T')[0])}, ${date.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} Uhr`
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-success-700">Ein Platz ist frei geworden!</CardTitle>
          <CardDescription>
            Bestätige jetzt deinen Platz für den folgenden Einsatz:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-success-50 p-4 border border-success-200">
            {profile?.display_name && (
              <p className="mb-2 text-sm text-success-700">
                Für: <span className="font-medium">{profile.display_name}</span>
              </p>
            )}
            {veranstaltung && (
              <>
                <p className="font-semibold text-neutral-900">{veranstaltung.titel}</p>
                <p className="text-sm text-neutral-600">{formatDate(veranstaltung.datum)}</p>
                {veranstaltung.ort && (
                  <p className="text-sm text-neutral-600">{veranstaltung.ort}</p>
                )}
              </>
            )}
            {schicht && (
              <div className="mt-3 border-t border-success-200 pt-3">
                <p className="text-sm">
                  <span className="text-neutral-600">Rolle: </span>
                  <span className="font-medium">{schicht.rolle}</span>
                </p>
                {zeitblock && (
                  <p className="text-sm">
                    <span className="text-neutral-600">Zeit: </span>
                    <span className="font-medium">
                      {formatTime(zeitblock.startzeit)} - {formatTime(zeitblock.endzeit)} Uhr
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          {entry.antwort_deadline && (
            <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
              <p className="text-sm text-warning-800">
                <strong>Bitte bestätige bis:</strong>
                <br />
                {formatDeadline(entry.antwort_deadline)}
              </p>
            </div>
          )}

          <WaitlistConfirmForm token={token} />
        </CardContent>
      </Card>
    </div>
  )
}
