import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { CancellationForm } from './CancellationForm'

export const metadata = {
  title: 'Helfer-Anmeldung stornieren',
  description: 'Storniere deine Helfer-Anmeldung',
}

async function getAnmeldungByToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('helfer_anmeldungen')
    .select(`
      id,
      status,
      external_name,
      rollen_instanz:helfer_rollen_instanzen(
        id,
        zeitblock_start,
        zeitblock_end,
        template:helfer_rollen_templates(name),
        helfer_event:helfer_events(id, name, datum_start, datum_end, ort, abmeldung_frist)
      ),
      profile:profiles(display_name)
    `)
    .eq('abmeldung_token', token)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export default async function HelferlisteCancellationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const anmeldung = await getAnmeldungByToken(token)

  if (!anmeldung) {
    notFound()
  }

  const rollenInstanz = anmeldung.rollen_instanz as unknown as {
    id: string
    zeitblock_start: string | null
    zeitblock_end: string | null
    template: { name: string } | null
    helfer_event: {
      id: string
      name: string
      datum_start: string
      datum_end: string
      ort: string | null
      abmeldung_frist: string | null
    } | null
  } | null

  const profile = anmeldung.profile as unknown as { display_name: string } | null
  const helferEvent = rollenInstanz?.helfer_event
  const rollenName = rollenInstanz?.template?.name || 'Unbekannte Rolle'
  const helferName = profile?.display_name || anmeldung.external_name

  // Check deadline (configurable abmeldung_frist, fallback to 6-hour rule)
  if (helferEvent) {
    const now = new Date()
    let isTooLate = false
    let deadlineMessage = ''

    if (helferEvent.abmeldung_frist) {
      const frist = new Date(helferEvent.abmeldung_frist)
      if (now > frist) {
        isTooLate = true
        deadlineMessage = 'Die Abmeldefrist für diese Veranstaltung ist abgelaufen. Eine Online-Abmeldung ist nicht mehr möglich.'
      }
    } else {
      const eventStart = new Date(helferEvent.datum_start)
      const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60)
      if (hoursUntilEvent < 6) {
        isTooLate = true
        deadlineMessage = 'Die Veranstaltung beginnt in weniger als 6 Stunden. Eine Online-Abmeldung ist nicht mehr möglich.'
      }
    }

    if (isTooLate) {
      return (
        <div className="mx-auto max-w-lg px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Abmeldung nicht mehr möglich</CardTitle>
              <CardDescription>
                {deadlineMessage}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Bitte kontaktiere das Organisationsteam direkt, wenn du nicht teilnehmen kannst.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Anmeldung stornieren?</CardTitle>
          <CardDescription>
            Du möchtest deine Helfer-Anmeldung für den folgenden Einsatz stornieren:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-neutral-50 p-4">
            {helferName && (
              <p className="mb-2 text-sm text-neutral-600">
                Helfer: <span className="font-medium">{helferName}</span>
              </p>
            )}
            {helferEvent && (
              <>
                <p className="font-semibold text-neutral-900">{helferEvent.name}</p>
                <p className="text-sm text-neutral-600">{formatDate(helferEvent.datum_start)}</p>
                {helferEvent.ort && (
                  <p className="text-sm text-neutral-600">{helferEvent.ort}</p>
                )}
              </>
            )}
            <div className="mt-3 border-t border-neutral-200 pt-3">
              <p className="text-sm">
                <span className="text-neutral-600">Rolle: </span>
                <span className="font-medium">{rollenName}</span>
              </p>
              {rollenInstanz?.zeitblock_start && (
                <p className="text-sm">
                  <span className="text-neutral-600">Zeit: </span>
                  <span className="font-medium">
                    {formatTime(rollenInstanz.zeitblock_start)}
                    {rollenInstanz.zeitblock_end && ` - ${formatTime(rollenInstanz.zeitblock_end)}`}
                    {' Uhr'}
                  </span>
                </p>
              )}
            </div>
          </div>

          <CancellationForm token={token} />
        </CardContent>
      </Card>
    </div>
  )
}
