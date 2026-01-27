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
// Räume (Rooms) - Issue #98
// =============================================================================

export type RaumTyp = 'buehne' | 'foyer' | 'lager' | 'garderobe' | 'technik' | 'sonstiges'

export type Raum = {
  id: string
  name: string
  typ: RaumTyp | null
  kapazitaet: number | null
  beschreibung: string | null
  aktiv: boolean
  created_at: string
  updated_at: string
}

export type RaumInsert = Omit<Raum, 'id' | 'created_at' | 'updated_at'>
export type RaumUpdate = Partial<RaumInsert>

// =============================================================================
// Ressourcen (Equipment) - Issue #98
// =============================================================================

export type RessourceKategorie = 'licht' | 'ton' | 'requisite' | 'kostuem' | 'buehne' | 'sonstiges'

export type Ressource = {
  id: string
  name: string
  kategorie: RessourceKategorie | null
  menge: number
  beschreibung: string | null
  aktiv: boolean
  created_at: string
  updated_at: string
}

export type RessourceInsert = Omit<Ressource, 'id' | 'created_at' | 'updated_at'>
export type RessourceUpdate = Partial<RessourceInsert>

// =============================================================================
// Zeitblöcke (Time Blocks) - Issue #97
// =============================================================================

export type ZeitblockTyp = 'aufbau' | 'einlass' | 'vorfuehrung' | 'pause' | 'abbau' | 'standard'

export type Zeitblock = {
  id: string
  veranstaltung_id: string
  name: string
  startzeit: string
  endzeit: string
  typ: ZeitblockTyp
  sortierung: number
  created_at: string
}

export type ZeitblockInsert = Omit<Zeitblock, 'id' | 'created_at'>
export type ZeitblockUpdate = Partial<ZeitblockInsert>

// =============================================================================
// Aufführung Schichten (Performance Shifts) - Issue #97
// =============================================================================

export type AuffuehrungSchicht = {
  id: string
  veranstaltung_id: string
  zeitblock_id: string | null
  rolle: string
  anzahl_benoetigt: number
  created_at: string
}

export type AuffuehrungSchichtInsert = Omit<AuffuehrungSchicht, 'id' | 'created_at'>
export type AuffuehrungSchichtUpdate = Partial<AuffuehrungSchichtInsert>

// Extended type with time block details
export type SchichtMitZeitblock = AuffuehrungSchicht & {
  zeitblock: Pick<Zeitblock, 'id' | 'name' | 'startzeit' | 'endzeit' | 'typ'> | null
}

// =============================================================================
// Aufführung Zuweisungen (Performance Assignments) - Issue #97
// =============================================================================

export type ZuweisungStatus = 'zugesagt' | 'abgesagt' | 'erschienen' | 'nicht_erschienen'

export type AuffuehrungZuweisung = {
  id: string
  schicht_id: string
  person_id: string
  status: ZuweisungStatus
  notizen: string | null
  created_at: string
}

export type AuffuehrungZuweisungInsert = Omit<AuffuehrungZuweisung, 'id' | 'created_at'>
export type AuffuehrungZuweisungUpdate = Partial<AuffuehrungZuweisungInsert>

// Extended type with person details
export type ZuweisungMitPerson = AuffuehrungZuweisung & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
}

// Extended type with full shift details
export type ZuweisungMitSchicht = AuffuehrungZuweisung & {
  schicht: SchichtMitZeitblock
}

// =============================================================================
// Reservierungen (Reservations) - Issue #98
// =============================================================================

export type RaumReservierung = {
  id: string
  veranstaltung_id: string
  raum_id: string
  notizen: string | null
  created_at: string
}

export type RaumReservierungInsert = Omit<RaumReservierung, 'id' | 'created_at'>
export type RaumReservierungUpdate = Partial<RaumReservierungInsert>

// Extended type with room details
export type RaumReservierungMitRaum = RaumReservierung & {
  raum: Pick<Raum, 'id' | 'name' | 'typ' | 'kapazitaet'>
}

export type RessourcenReservierung = {
  id: string
  veranstaltung_id: string
  ressource_id: string
  menge: number
  notizen: string | null
  created_at: string
}

export type RessourcenReservierungInsert = Omit<RessourcenReservierung, 'id' | 'created_at'>
export type RessourcenReservierungUpdate = Partial<RessourcenReservierungInsert>

// Extended type with resource details
export type RessourcenReservierungMitRessource = RessourcenReservierung & {
  ressource: Pick<Ressource, 'id' | 'name' | 'kategorie' | 'menge'>
}

// =============================================================================
// Templates (Performance Templates) - Issue #99
// =============================================================================

export type AuffuehrungTemplate = {
  id: string
  name: string
  beschreibung: string | null
  archiviert: boolean
  created_at: string
  updated_at: string
}

export type AuffuehrungTemplateInsert = Omit<AuffuehrungTemplate, 'id' | 'created_at' | 'updated_at'>
export type AuffuehrungTemplateUpdate = Partial<AuffuehrungTemplateInsert>

export type TemplateZeitblock = {
  id: string
  template_id: string
  name: string
  offset_minuten: number
  dauer_minuten: number
  typ: ZeitblockTyp
  sortierung: number
}

export type TemplateZeitblockInsert = Omit<TemplateZeitblock, 'id'>
export type TemplateZeitblockUpdate = Partial<TemplateZeitblockInsert>

export type TemplateSchicht = {
  id: string
  template_id: string
  zeitblock_name: string | null
  rolle: string
  anzahl_benoetigt: number
}

export type TemplateSchichtInsert = Omit<TemplateSchicht, 'id'>
export type TemplateSchichtUpdate = Partial<TemplateSchichtInsert>

export type TemplateRessource = {
  id: string
  template_id: string
  ressource_id: string | null
  menge: number
}

export type TemplateRessourceInsert = Omit<TemplateRessource, 'id'>
export type TemplateRessourceUpdate = Partial<TemplateRessourceInsert>

// Extended type with all template details
export type TemplateMitDetails = AuffuehrungTemplate & {
  zeitbloecke: TemplateZeitblock[]
  schichten: TemplateSchicht[]
  ressourcen: (TemplateRessource & { ressource: Pick<Ressource, 'id' | 'name'> | null })[]
}

// =============================================================================
// Bedarf Übersicht (Demand Overview) - Issue #97
// =============================================================================

export type BedarfStatus = {
  rolle: string
  zeitblock: Pick<Zeitblock, 'id' | 'name' | 'startzeit' | 'endzeit'> | null
  benoetigt: number
  zugewiesen: number
  offen: number
}

// =============================================================================
// Stücke, Szenen und Rollen (Issue #101)
// =============================================================================

export type StueckStatus = 'in_planung' | 'in_proben' | 'aktiv' | 'abgeschlossen' | 'archiviert'
export type RollenTyp = 'hauptrolle' | 'nebenrolle' | 'ensemble' | 'statisterie'

export type Stueck = {
  id: string
  titel: string
  beschreibung: string | null
  autor: string | null
  status: StueckStatus
  premiere_datum: string | null
  created_at: string
  updated_at: string
}

export type StueckInsert = Omit<Stueck, 'id' | 'created_at' | 'updated_at'>
export type StueckUpdate = Partial<StueckInsert>

export type Szene = {
  id: string
  stueck_id: string
  nummer: number
  titel: string
  beschreibung: string | null
  dauer_minuten: number | null
  created_at: string
  updated_at: string
}

export type SzeneInsert = Omit<Szene, 'id' | 'created_at' | 'updated_at'>
export type SzeneUpdate = Partial<SzeneInsert>

// Theaterrolle (Charakter in einem Stück) - nicht zu verwechseln mit Vereinsrolle (Rolle)
export type StueckRolle = {
  id: string
  stueck_id: string
  name: string
  beschreibung: string | null
  typ: RollenTyp
  created_at: string
  updated_at: string
}

export type StueckRolleInsert = Omit<StueckRolle, 'id' | 'created_at' | 'updated_at'>
export type StueckRolleUpdate = Partial<StueckRolleInsert>

// Verknüpfung: welche Rollen in welchen Szenen auftreten
export type SzeneRolle = {
  id: string
  szene_id: string
  rolle_id: string
  notizen: string | null
  created_at: string
}

export type SzeneRolleInsert = Omit<SzeneRolle, 'id' | 'created_at'>

// Extended types for views
export type StueckMitDetails = Stueck & {
  szenen_count: number
  rollen_count: number
}

export type SzeneMitRollen = Szene & {
  rollen: Pick<StueckRolle, 'id' | 'name' | 'typ'>[]
}

export type StueckRolleMitSzenen = StueckRolle & {
  szenen: Pick<Szene, 'id' | 'nummer' | 'titel'>[]
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
      stuecke: {
        Row: Stueck
        Insert: StueckInsert
        Update: StueckUpdate
      }
      szenen: {
        Row: Szene
        Insert: SzeneInsert
        Update: SzeneUpdate
      }
      rollen: {
        Row: StueckRolle
        Insert: StueckRolleInsert
        Update: StueckRolleUpdate
      }
      szenen_rollen: {
        Row: SzeneRolle
        Insert: SzeneRolleInsert
        Update: Partial<SzeneRolleInsert>
      }
      raeume: {
        Row: Raum
        Insert: RaumInsert
        Update: RaumUpdate
      }
      ressourcen: {
        Row: Ressource
        Insert: RessourceInsert
        Update: RessourceUpdate
      }
      zeitbloecke: {
        Row: Zeitblock
        Insert: ZeitblockInsert
        Update: ZeitblockUpdate
      }
      auffuehrung_schichten: {
        Row: AuffuehrungSchicht
        Insert: AuffuehrungSchichtInsert
        Update: AuffuehrungSchichtUpdate
      }
      auffuehrung_zuweisungen: {
        Row: AuffuehrungZuweisung
        Insert: AuffuehrungZuweisungInsert
        Update: AuffuehrungZuweisungUpdate
      }
      raum_reservierungen: {
        Row: RaumReservierung
        Insert: RaumReservierungInsert
        Update: RaumReservierungUpdate
      }
      ressourcen_reservierungen: {
        Row: RessourcenReservierung
        Insert: RessourcenReservierungInsert
        Update: RessourcenReservierungUpdate
      }
      auffuehrung_templates: {
        Row: AuffuehrungTemplate
        Insert: AuffuehrungTemplateInsert
        Update: AuffuehrungTemplateUpdate
      }
      template_zeitbloecke: {
        Row: TemplateZeitblock
        Insert: TemplateZeitblockInsert
        Update: TemplateZeitblockUpdate
      }
      template_schichten: {
        Row: TemplateSchicht
        Insert: TemplateSchichtInsert
        Update: TemplateSchichtUpdate
      }
      template_ressourcen: {
        Row: TemplateRessource
        Insert: TemplateRessourceInsert
        Update: TemplateRessourceUpdate
      }
    }
  }
}
