/**
 * Supabase Database Types
 * Generated types for BackstagePass tables
 */

export type Rolle = 'mitglied' | 'vorstand' | 'gast' | 'regie' | 'technik'

export type Person = {
  id: string
  vorname: string
  nachname: string
  strasse: string | null
  plz: string | null
  ort: string | null
  geburtstag: string | null
  email: string | null
  telefon: string | null
  rolle: Rolle
  aktiv: boolean
  notizen: string | null
  created_at: string
  updated_at: string
}

export type PersonInsert = Omit<Person, 'id' | 'created_at' | 'updated_at'>

export type PersonUpdate = Partial<PersonInsert>

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER'

export type Profile = {
  id: string
  email: string
  display_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>

export type ProfileUpdate = Partial<Omit<Profile, 'id'>>

// =============================================================================
// Veranstaltungen (Club Events) - Issue #93
// =============================================================================

export type VeranstaltungTyp = 'vereinsevent' | 'probe' | 'auffuehrung' | 'sonstiges'
export type VeranstaltungStatus = 'geplant' | 'bestaetigt' | 'abgesagt' | 'abgeschlossen'

export type Veranstaltung = {
  id: string
  titel: string
  beschreibung: string | null
  datum: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  max_teilnehmer: number | null
  warteliste_aktiv: boolean
  organisator_id: string | null
  typ: VeranstaltungTyp
  status: VeranstaltungStatus
  created_at: string
  updated_at: string
}

export type VeranstaltungInsert = Omit<Veranstaltung, 'id' | 'created_at' | 'updated_at'>
export type VeranstaltungUpdate = Partial<VeranstaltungInsert>

export type AnmeldungStatus = 'angemeldet' | 'warteliste' | 'abgemeldet' | 'teilgenommen'

export type Anmeldung = {
  id: string
  veranstaltung_id: string
  person_id: string
  status: AnmeldungStatus
  anmeldedatum: string
  notizen: string | null
  created_at: string
  updated_at: string
}

export type AnmeldungInsert = Omit<Anmeldung, 'id' | 'created_at' | 'updated_at' | 'anmeldedatum'>
export type AnmeldungUpdate = Partial<AnmeldungInsert>

// Extended type with person details for participant lists
export type AnmeldungMitPerson = Anmeldung & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
}

// Extended type with event details for personal overview
export type AnmeldungMitVeranstaltung = Anmeldung & {
  veranstaltung: Pick<Veranstaltung, 'id' | 'titel' | 'datum' | 'ort' | 'typ'>
}

// =============================================================================
// Helfereinsaetze (Helper Events) - Issue #94
// =============================================================================

export type Partner = {
  id: string
  name: string
  kontakt_name: string | null
  kontakt_email: string | null
  kontakt_telefon: string | null
  adresse: string | null
  notizen: string | null
  aktiv: boolean
  created_at: string
  updated_at: string
}

export type PartnerInsert = Omit<Partner, 'id' | 'created_at' | 'updated_at'>
export type PartnerUpdate = Partial<PartnerInsert>

export type HelfereinsatzStatus = 'offen' | 'bestaetigt' | 'abgeschlossen' | 'abgesagt'

export type Helfereinsatz = {
  id: string
  partner_id: string | null
  titel: string
  beschreibung: string | null
  datum: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  stundenlohn_verein: number | null
  status: HelfereinsatzStatus
  created_at: string
  updated_at: string
}

export type HelfereinsatzInsert = Omit<Helfereinsatz, 'id' | 'created_at' | 'updated_at'>
export type HelfereinsatzUpdate = Partial<HelfereinsatzInsert>

// Extended type with partner details
export type HelfereinsatzMitPartner = Helfereinsatz & {
  partner: Pick<Partner, 'id' | 'name'> | null
}

export type Helferrolle = {
  id: string
  helfereinsatz_id: string
  rolle: string
  anzahl_benoetigt: number
  created_at: string
}

export type HelferrolleInsert = Omit<Helferrolle, 'id' | 'created_at'>
export type HelferrolleUpdate = Partial<HelferrolleInsert>

export type HelferschichtStatus = 'zugesagt' | 'abgesagt' | 'erschienen' | 'nicht_erschienen'

export type Helferschicht = {
  id: string
  helfereinsatz_id: string
  person_id: string
  helferrolle_id: string | null
  startzeit: string | null
  endzeit: string | null
  stunden_gearbeitet: number | null
  status: HelferschichtStatus
  notizen: string | null
  created_at: string
  updated_at: string
}

export type HelferschichtInsert = Omit<Helferschicht, 'id' | 'created_at' | 'updated_at'>
export type HelferschichtUpdate = Partial<HelferschichtInsert>

// Extended type with person and role details
export type HelferschichtMitDetails = Helferschicht & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
  helferrolle: Pick<Helferrolle, 'id' | 'rolle'> | null
}

// =============================================================================
// Stundenkonto (Hours Ledger) - Issue #95
// =============================================================================

export type StundenTyp = 'helfereinsatz' | 'vereinsevent' | 'sonstiges' | 'korrektur'

export type StundenkontoEintrag = {
  id: string
  person_id: string
  typ: StundenTyp
  referenz_id: string | null
  stunden: number
  beschreibung: string | null
  erfasst_von: string | null
  created_at: string
}

export type StundenkontoInsert = Omit<StundenkontoEintrag, 'id' | 'created_at'>

// Extended type with person details
export type StundenkontoMitPerson = StundenkontoEintrag & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname'>
}

// =============================================================================
// Database Schema Type
// =============================================================================

export type Database = {
  public: {
    Tables: {
      personen: {
        Row: Person
        Insert: PersonInsert
        Update: PersonUpdate
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      veranstaltungen: {
        Row: Veranstaltung
        Insert: VeranstaltungInsert
        Update: VeranstaltungUpdate
      }
      anmeldungen: {
        Row: Anmeldung
        Insert: AnmeldungInsert
        Update: AnmeldungUpdate
      }
      partner: {
        Row: Partner
        Insert: PartnerInsert
        Update: PartnerUpdate
      }
      helfereinsaetze: {
        Row: Helfereinsatz
        Insert: HelfereinsatzInsert
        Update: HelfereinsatzUpdate
      }
      helferrollen: {
        Row: Helferrolle
        Insert: HelferrolleInsert
        Update: HelferrolleUpdate
      }
      helferschichten: {
        Row: Helferschicht
        Insert: HelferschichtInsert
        Update: HelferschichtUpdate
      }
      stundenkonto: {
        Row: StundenkontoEintrag
        Insert: StundenkontoInsert
        Update: Partial<StundenkontoInsert>
      }
    }
  }
}
