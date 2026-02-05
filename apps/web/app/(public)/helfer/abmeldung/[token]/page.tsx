import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { CancellationForm } from './CancellationForm'

export const metadata = {
  title: 'Anmeldung stornieren',
  description: 'Storniere deine Helfer-Anmeldung',
}

async function getZuweisungByToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id,
      status,
      person:personen(vorname, nachname),
      schicht:auffuehrung_schichten(
        id,
        rolle,
        veranstaltung:veranstaltungen(id, titel, datum, startzeit, ort),
        zeitblock:zeitbloecke(name, startzeit, endzeit)
      )
    `)
    .eq('abmeldung_token', token)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export default async function CancellationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const zuweisung = await getZuweisungByToken(token)

  if (!zuweisung) {
    notFound()
  }

  const person = zuweisung.person as unknown as { vorname: string; nachname: string } | null
  const schicht = zuweisung.schicht as unknown as {
    id: string
    rolle: string
    veranstaltung: { id: string; titel: string; datum: string; startzeit: string; ort: string } | null
    zeitblock: { name: string; startzeit: string; endzeit: string } | null
  } | null

  const veranstaltung = schicht?.veranstaltung
  const zeitblock = schicht?.zeitblock

  // Check if already cancelled
  if (zuweisung.status === 'abgesagt') {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Bereits abgemeldet</CardTitle>
            <CardDescription>
              Diese Anmeldung wurde bereits storniert.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check if event is in the past or too close
  if (veranstaltung) {
    const eventDate = new Date(`${veranstaltung.datum}T${veranstaltung.startzeit || '00:00'}`)
    const now = new Date()
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilEvent < 6) {
      return (
        <div className="mx-auto max-w-lg px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Abmeldung nicht mehr möglich</CardTitle>
              <CardDescription>
                Die Veranstaltung beginnt in weniger als 6 Stunden. Eine Online-Abmeldung ist nicht mehr möglich.
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

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Anmeldung stornieren?</CardTitle>
          <CardDescription>
            Du möchtest deine Anmeldung für den folgenden Einsatz stornieren:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-neutral-50 p-4">
            {person && (
              <p className="mb-2 text-sm text-neutral-600">
                Helfer: <span className="font-medium">{person.vorname} {person.nachname}</span>
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
              <div className="mt-3 border-t border-neutral-200 pt-3">
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

          <CancellationForm
            zuweisungId={zuweisung.id}
            token={token}
          />
        </CardContent>
      </Card>
    </div>
  )
}
