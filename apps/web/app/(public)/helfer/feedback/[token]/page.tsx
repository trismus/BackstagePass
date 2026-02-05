import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { FeedbackForm } from './FeedbackForm'

export const metadata = {
  title: 'Feedback geben',
  description: 'Gib uns Feedback zu deinem Helfereinsatz',
}

async function getZuweisungByFeedbackToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id,
      feedback_token,
      person:personen(id, vorname, nachname),
      schicht:auffuehrung_schichten(
        id,
        rolle,
        veranstaltung:veranstaltungen(id, titel, datum)
      )
    `)
    .eq('feedback_token', token)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function checkExistingFeedback(zuweisungId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('helfer_feedback')
    .select('id')
    .eq('zuweisung_id', zuweisungId)
    .single()

  return !!data
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const zuweisung = await getZuweisungByFeedbackToken(token)

  if (!zuweisung) {
    notFound()
  }

  const person = zuweisung.person as unknown as {
    id: string
    vorname: string
    nachname: string
  } | null

  const schicht = zuweisung.schicht as unknown as {
    id: string
    rolle: string
    veranstaltung: { id: string; titel: string; datum: string } | null
  } | null

  const veranstaltung = schicht?.veranstaltung

  // Check if feedback already submitted
  const alreadySubmitted = await checkExistingFeedback(zuweisung.id)

  if (alreadySubmitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-success-700">Danke fuer dein Feedback!</CardTitle>
            <CardDescription>
              Du hast bereits Feedback fuer diesen Einsatz gegeben.
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

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Wie war dein Einsatz?</CardTitle>
          <CardDescription>
            Dein Feedback hilft uns, zukuenftige Veranstaltungen zu verbessern.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Info */}
          <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200">
            {person && (
              <p className="mb-2 text-sm text-neutral-600">
                Hallo <span className="font-medium">{person.vorname}</span>!
              </p>
            )}
            {veranstaltung && (
              <>
                <p className="font-semibold text-neutral-900">{veranstaltung.titel}</p>
                <p className="text-sm text-neutral-600">{formatDate(veranstaltung.datum)}</p>
              </>
            )}
            {schicht && (
              <p className="mt-2 text-sm">
                <span className="text-neutral-600">Deine Rolle: </span>
                <span className="font-medium">{schicht.rolle}</span>
              </p>
            )}
          </div>

          {/* Feedback Form */}
          <FeedbackForm zuweisungId={zuweisung.id} token={token} />
        </CardContent>
      </Card>
    </div>
  )
}
