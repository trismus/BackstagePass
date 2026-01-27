import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { MeineSchichten } from '@/components/helfer/MeineSchichten'
import { VerfuegbareEinsaetze } from '@/components/helfer/VerfuegbareEinsaetze'

// Type for raw Supabase data
interface RawSchicht {
  id: string
  status: string
  startzeit: string | null
  endzeit: string | null
  helferrolle: { rolle: string }[] | null
  helfereinsatz: {
    id: string
    titel: string
    datum: string
    startzeit: string | null
    endzeit: string | null
    ort: string | null
    partner: { name: string }[] | null
  }[] | null
}

interface RawEinsatz {
  id: string
  titel: string
  datum: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  status: string
  helfer_max: number | null
  partner: { name: string }[] | null
  helferschichten: { id: string }[] | null
}

// Types for components
interface Schicht {
  id: string
  status: string
  startzeit: string | null
  endzeit: string | null
  helferrolle: { rolle: string } | null
  helfereinsatz: {
    id: string
    titel: string
    datum: string
    startzeit: string | null
    endzeit: string | null
    ort: string | null
    partner: { name: string } | null
  } | null
}

interface Einsatz {
  id: string
  titel: string
  datum: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  status: string
  helfer_max: number | null
  partner: { name: string } | null
  helferschichten: { id: string }[] | null
}

export default async function HelferDashboardPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only HELFER role sees this dashboard
  // Other roles use mein-bereich or dashboard
  if (profile.role !== 'HELFER') {
    redirect('/mein-bereich')
  }

  const supabase = await createClient()

  // Get the person linked to this user
  const { data: person } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .eq('email', profile.email)
    .single()

  const today = new Date().toISOString().split('T')[0]

  // Get my assigned shifts (upcoming)
  const { data: rawSchichten } = person
    ? await supabase
        .from('helferschichten')
        .select(`
          id,
          status,
          startzeit,
          endzeit,
          helferrolle:helferrollen(rolle),
          helfereinsatz:helfereinsaetze(
            id,
            titel,
            datum,
            startzeit,
            endzeit,
            ort,
            partner:partner(name)
          )
        `)
        .eq('person_id', person.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Transform raw data to expected format
  const meineSchichten: Schicht[] = ((rawSchichten as RawSchicht[]) || []).map((s) => ({
    id: s.id,
    status: s.status,
    startzeit: s.startzeit,
    endzeit: s.endzeit,
    helferrolle: s.helferrolle?.[0] || null,
    helfereinsatz: s.helfereinsatz?.[0]
      ? {
          ...s.helfereinsatz[0],
          partner: s.helfereinsatz[0].partner?.[0] || null,
        }
      : null,
  }))

  // Filter to upcoming only
  const upcomingSchichten = meineSchichten.filter(
    (s) => s.helfereinsatz && s.helfereinsatz.datum >= today
  )

  // Get available events I can sign up for
  const { data: rawEinsaetze } = await supabase
    .from('helfereinsaetze')
    .select(`
      id,
      titel,
      datum,
      startzeit,
      endzeit,
      ort,
      status,
      helfer_max,
      partner:partner(name),
      helferschichten(id)
    `)
    .gte('datum', today)
    .in('status', ['offen', 'bestaetigt'])
    .order('datum', { ascending: true })
    .limit(10)

  // Transform to expected format
  const verfuegbareEinsaetze: Einsatz[] = ((rawEinsaetze as RawEinsatz[]) || []).map((e) => ({
    ...e,
    partner: e.partner?.[0] || null,
  }))

  // Filter out events I'm already signed up for
  const meineEinsatzIds = new Set(
    upcomingSchichten
      .map((s) => s.helfereinsatz?.id)
      .filter(Boolean)
  )

  const verfuegbar = verfuegbareEinsaetze.filter(
    (e) => !meineEinsatzIds.has(e.id)
  )

  // Count upcoming shifts
  const upcomingShiftsCount = upcomingSchichten.filter(
    (s) => s.status !== 'abgesagt'
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Hallo{person ? `, ${person.vorname}` : ''}!
        </h1>
        <p className="mt-1 text-neutral-600">
          Deine Übersicht der Helfereinsätze
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Meine Einsätze</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {upcomingShiftsCount}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Verfügbare Einsätze</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {verfuegbar.length}
          </p>
        </div>
      </div>

      {!person && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">
            Dein Account ist noch nicht mit einem Mitgliederprofil verknüpft.
            Bitte wende dich an einen Administrator.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Shifts */}
        <MeineSchichten
          schichten={upcomingSchichten}
          personId={person?.id}
        />

        {/* Available Events */}
        <VerfuegbareEinsaetze
          einsaetze={verfuegbar}
          personId={person?.id}
        />
      </div>
    </div>
  )
}
