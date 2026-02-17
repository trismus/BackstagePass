'use server'

import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { isManagement } from '../supabase/permissions'
import type {
  PersonEngagements,
  StueckBesetzungHistorie,
  ProduktionsBesetzungHistorie,
  ProduktionsStabHistorie,
  AuffuehrungsZuweisungHistorie,
  ProbenTeilnahmeHistorie,
  HelferAnmeldungHistorie,
  EngagementStatistik,
} from '../supabase/types'

export async function getPersonEngagements(
  personId: string
): Promise<PersonEngagements> {
  const profile = await requirePermission('mitglieder:read')
  if (!isManagement(profile.role)) {
    return emptyEngagements()
  }

  const supabase = await createClient()

  // Get person's profile_id for helfer_anmeldungen lookup
  const { data: person } = await supabase
    .from('personen')
    .select('profile_id')
    .eq('id', personId)
    .single()

  const [
    stueckBesetzungen,
    produktionsBesetzungen,
    produktionsStab,
    auffuehrungsZuweisungen,
    probenTeilnahmen,
    helferAnmeldungen,
  ] = await Promise.all([
    fetchStueckBesetzungen(supabase, personId),
    fetchProduktionsBesetzungen(supabase, personId),
    fetchProduktionsStab(supabase, personId),
    fetchAuffuehrungsZuweisungen(supabase, personId),
    fetchProbenTeilnahmen(supabase, personId),
    fetchHelferAnmeldungen(supabase, person?.profile_id ?? null),
  ])

  const statistik = berechneStatistik(
    stueckBesetzungen,
    produktionsBesetzungen,
    produktionsStab,
    auffuehrungsZuweisungen,
    probenTeilnahmen,
    helferAnmeldungen
  )

  return {
    stueckBesetzungen,
    produktionsBesetzungen,
    produktionsStab,
    auffuehrungsZuweisungen,
    probenTeilnahmen,
    helferAnmeldungen,
    statistik,
  }
}

// ---------------------------------------------------------------------------
// Fetch helpers (non-exported async — safe for 'use server')
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

async function fetchStueckBesetzungen(
  supabase: SupabaseClient,
  personId: string
): Promise<StueckBesetzungHistorie[]> {
  const { data, error } = await supabase
    .from('besetzungen')
    .select(`
      id, typ, gueltig_von, gueltig_bis,
      rolle:rollen(id, name, typ, stueck:stuecke(id, titel))
    `)
    .eq('person_id', personId)

  if (error || !data) {
    console.error('Error fetching stueck besetzungen:', error)
    return []
  }

  return data.map((b: Record<string, unknown>) => {
    const rolle = b.rolle as Record<string, unknown> | null
    const stueck = rolle?.stueck as Record<string, unknown> | null
    return {
      besetzungId: b.id as string,
      stueckId: (stueck?.id as string) ?? '',
      stueckTitel: (stueck?.titel as string) ?? '',
      rolleName: (rolle?.name as string) ?? '',
      rolleTyp: (rolle?.typ as string) ?? 'nebenrolle',
      besetzungTyp: b.typ as string,
      gueltigVon: b.gueltig_von as string | null,
      gueltigBis: b.gueltig_bis as string | null,
    }
  }) as StueckBesetzungHistorie[]
}

async function fetchProduktionsBesetzungen(
  supabase: SupabaseClient,
  personId: string
): Promise<ProduktionsBesetzungHistorie[]> {
  const { data, error } = await supabase
    .from('produktions_besetzungen')
    .select(`
      id, typ, status,
      rolle:rollen(id, name, typ),
      produktion:produktionen(id, titel, status)
    `)
    .eq('person_id', personId)

  if (error || !data) {
    console.error('Error fetching produktions besetzungen:', error)
    return []
  }

  return data.map((b: Record<string, unknown>) => {
    const rolle = b.rolle as Record<string, unknown> | null
    const produktion = b.produktion as Record<string, unknown> | null
    return {
      besetzungId: b.id as string,
      produktionId: (produktion?.id as string) ?? '',
      produktionTitel: (produktion?.titel as string) ?? '',
      produktionStatus: (produktion?.status as string) ?? 'draft',
      rolleName: (rolle?.name as string) ?? '',
      rolleTyp: (rolle?.typ as string) ?? 'nebenrolle',
      besetzungTyp: b.typ as string,
      besetzungStatus: b.status as string,
    }
  }) as ProduktionsBesetzungHistorie[]
}

async function fetchProduktionsStab(
  supabase: SupabaseClient,
  personId: string
): Promise<ProduktionsStabHistorie[]> {
  const { data, error } = await supabase
    .from('produktions_stab')
    .select(`
      id, funktion, ist_leitung, von, bis,
      produktion:produktionen(id, titel, status)
    `)
    .eq('person_id', personId)

  if (error || !data) {
    console.error('Error fetching produktions stab:', error)
    return []
  }

  return data.map((s: Record<string, unknown>) => {
    const produktion = s.produktion as Record<string, unknown> | null
    return {
      stabId: s.id as string,
      produktionId: (produktion?.id as string) ?? '',
      produktionTitel: (produktion?.titel as string) ?? '',
      produktionStatus: (produktion?.status as string) ?? 'draft',
      funktion: s.funktion as string,
      istLeitung: s.ist_leitung as boolean,
      von: s.von as string | null,
      bis: s.bis as string | null,
    }
  }) as ProduktionsStabHistorie[]
}

async function fetchAuffuehrungsZuweisungen(
  supabase: SupabaseClient,
  personId: string
): Promise<AuffuehrungsZuweisungHistorie[]> {
  const { data, error } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id, status, checked_in_at,
      schicht:auffuehrung_schichten(
        rolle,
        zeitblock:zeitbloecke(
          name, startzeit, endzeit,
          veranstaltung:veranstaltungen(id, titel, datum)
        )
      )
    `)
    .eq('person_id', personId)

  if (error || !data) {
    console.error('Error fetching auffuehrungs zuweisungen:', error)
    return []
  }

  return data.map((z: Record<string, unknown>) => {
    const schicht = z.schicht as Record<string, unknown> | null
    const zeitblock = schicht?.zeitblock as Record<string, unknown> | null
    const veranstaltung = zeitblock?.veranstaltung as Record<string, unknown> | null
    return {
      zuweisungId: z.id as string,
      veranstaltungId: (veranstaltung?.id as string) ?? '',
      veranstaltungTitel: (veranstaltung?.titel as string) ?? '',
      veranstaltungDatum: (veranstaltung?.datum as string) ?? '',
      schichtRolle: (schicht?.rolle as string) ?? '',
      zeitblockName: (zeitblock?.name as string) ?? null,
      zeitblockStartzeit: (zeitblock?.startzeit as string) ?? null,
      zeitblockEndzeit: (zeitblock?.endzeit as string) ?? null,
      status: z.status as string,
      checkedInAt: z.checked_in_at as string | null,
    }
  }) as AuffuehrungsZuweisungHistorie[]
}

async function fetchProbenTeilnahmen(
  supabase: SupabaseClient,
  personId: string
): Promise<ProbenTeilnahmeHistorie[]> {
  const { data, error } = await supabase
    .from('proben_teilnehmer')
    .select(`
      id, status,
      probe:proben(id, titel, datum, stueck:stuecke(id, titel))
    `)
    .eq('person_id', personId)

  if (error || !data) {
    console.error('Error fetching proben teilnahmen:', error)
    return []
  }

  return data.map((t: Record<string, unknown>) => {
    const probe = t.probe as Record<string, unknown> | null
    const stueck = probe?.stueck as Record<string, unknown> | null
    return {
      teilnehmerId: t.id as string,
      probeId: (probe?.id as string) ?? '',
      probeTitel: (probe?.titel as string) ?? '',
      probeDatum: (probe?.datum as string) ?? '',
      stueckId: (stueck?.id as string) ?? '',
      stueckTitel: (stueck?.titel as string) ?? '',
      status: t.status as string,
    }
  }) as ProbenTeilnahmeHistorie[]
}

async function fetchHelferAnmeldungen(
  supabase: SupabaseClient,
  profileId: string | null
): Promise<HelferAnmeldungHistorie[]> {
  if (!profileId) return []

  const { data, error } = await supabase
    .from('helfer_anmeldungen')
    .select(`
      id, status,
      rollen_instanz:helfer_rollen_instanzen(
        zeitblock_start, zeitblock_end,
        template:helfer_rollen_templates(name),
        helfer_event:helfer_events(id, name, datum_start)
      )
    `)
    .eq('profile_id', profileId)

  if (error || !data) {
    console.error('Error fetching helfer anmeldungen:', error)
    return []
  }

  return data.map((a: Record<string, unknown>) => {
    const instanz = a.rollen_instanz as Record<string, unknown> | null
    const template = instanz?.template as Record<string, unknown> | null
    const event = instanz?.helfer_event as Record<string, unknown> | null
    return {
      anmeldungId: a.id as string,
      eventId: (event?.id as string) ?? '',
      eventName: (event?.name as string) ?? '',
      eventDatum: (event?.datum_start as string) ?? '',
      rollenName: (template?.name as string) ?? '',
      zeitblockStart: (instanz?.zeitblock_start as string) ?? null,
      zeitblockEnd: (instanz?.zeitblock_end as string) ?? null,
      status: a.status as string,
    }
  }) as HelferAnmeldungHistorie[]
}

// ---------------------------------------------------------------------------
// Statistik (pure computation)
// ---------------------------------------------------------------------------

function berechneStatistik(
  stueckBesetzungen: StueckBesetzungHistorie[],
  produktionsBesetzungen: ProduktionsBesetzungHistorie[],
  produktionsStab: ProduktionsStabHistorie[],
  auffuehrungsZuweisungen: AuffuehrungsZuweisungHistorie[],
  probenTeilnahmen: ProbenTeilnahmeHistorie[],
  helferAnmeldungen: HelferAnmeldungHistorie[]
): EngagementStatistik {
  const totalAuffuehrungen = auffuehrungsZuweisungen.filter(
    (z) => z.status === 'erschienen' || z.status === 'zugesagt'
  ).length

  const totalProben = probenTeilnahmen.length
  const erschienen = probenTeilnahmen.filter((t) => t.status === 'erschienen').length
  const probenAnwesenheitsquote = totalProben > 0
    ? Math.round((erschienen / totalProben) * 100)
    : 0

  const totalHelferEinsaetze = helferAnmeldungen.filter(
    (a) => a.status === 'angemeldet' || a.status === 'bestaetigt'
  ).length

  const produktionIds = new Set([
    ...produktionsBesetzungen.map((b) => b.produktionId),
    ...produktionsStab.map((s) => s.produktionId),
  ])

  return {
    totalAuffuehrungen,
    totalProben,
    probenAnwesenheitsquote,
    totalHelferEinsaetze,
    totalProduktionen: produktionIds.size,
    totalStueckBesetzungen: stueckBesetzungen.length,
  }
}

function emptyEngagements(): PersonEngagements {
  return {
    stueckBesetzungen: [],
    produktionsBesetzungen: [],
    produktionsStab: [],
    auffuehrungsZuweisungen: [],
    probenTeilnahmen: [],
    helferAnmeldungen: [],
    statistik: {
      totalAuffuehrungen: 0,
      totalProben: 0,
      probenAnwesenheitsquote: 0,
      totalHelferEinsaetze: 0,
      totalProduktionen: 0,
      totalStueckBesetzungen: 0,
    },
  }
}
