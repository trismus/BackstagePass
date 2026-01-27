/**
 * Supabase Database Types
 * Generated types for BackstagePass tables
 */

export type Rolle = 'mitglied' | 'vorstand' | 'gast' | 'regie' | 'technik'

// =============================================================================
// Kontaktdaten Types (Issue #3 Mitglieder)
// =============================================================================

export type TelefonTyp = 'mobil' | 'privat' | 'geschaeft'

export type TelefonNummer = {
  typ: TelefonTyp
  nummer: string
  ist_bevorzugt?: boolean
}

export type BevorzugteKontaktart = 'telefon' | 'email' | 'whatsapp' | 'sms'

export type SocialMedia = {
  instagram?: string
  facebook?: string
  linkedin?: string
  twitter?: string
}

export const TELEFON_TYP_LABELS: Record<TelefonTyp, string> = {
  mobil: 'Mobil',
  privat: 'Privat',
  geschaeft: 'Geschäftlich',
}

export const KONTAKTART_LABELS: Record<BevorzugteKontaktart, string> = {
  telefon: 'Telefon',
  email: 'E-Mail',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
}

// =============================================================================
// Person Type
// =============================================================================

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
  // Extended profile fields (Issue #1 Mitglieder)
  notfallkontakt_name: string | null
  notfallkontakt_telefon: string | null
  notfallkontakt_beziehung: string | null
  profilbild_url: string | null
  biografie: string | null
  mitglied_seit: string | null
  austrittsdatum: string | null
  austrittsgrund: string | null
  skills: string[] // JSONB array of skill tags
  // Extended contact fields (Issue #3 Mitglieder)
  telefon_nummern: TelefonNummer[] // Multiple phone numbers
  bevorzugte_kontaktart: BevorzugteKontaktart | null
  social_media: SocialMedia | null
  kontakt_notizen: string | null
  // Archive fields (Issue #5 Mitglieder)
  archiviert_am: string | null
  archiviert_von: string | null
  created_at: string
  updated_at: string
}

export type PersonInsert = Omit<Person, 'id' | 'created_at' | 'updated_at'>

export type PersonUpdate = Partial<PersonInsert>

// =============================================================================
// Vereinsrollen (Organization Roles) - Issue #2 Mitglieder
// =============================================================================

export type Vereinsrolle = {
  id: string
  name: string
  beschreibung: string | null
  farbe: string
  sortierung: number
  aktiv: boolean
  created_at: string
  updated_at: string
}

export type VereinsrolleInsert = Omit<
  Vereinsrolle,
  'id' | 'created_at' | 'updated_at'
>
export type VereinsrolleUpdate = Partial<VereinsrolleInsert>

export type MitgliedRolle = {
  id: string
  mitglied_id: string
  rolle_id: string
  ist_primaer: boolean
  gueltig_von: string
  gueltig_bis: string | null
  notizen: string | null
  created_at: string
  updated_at: string
}

export type MitgliedRolleInsert = Omit<
  MitgliedRolle,
  'id' | 'created_at' | 'updated_at'
>
export type MitgliedRolleUpdate = Partial<MitgliedRolleInsert>

// Extended types for views
export type MitgliedRolleMitDetails = MitgliedRolle & {
  vereinsrolle: Pick<Vereinsrolle, 'id' | 'name' | 'farbe'>
}

export type PersonMitVereinsrollen = Person & {
  vereinsrollen: MitgliedRolleMitDetails[]
}

// =============================================================================
// Verfügbarkeiten (Availability) - Issue #4 Mitglieder
// =============================================================================

export type VerfuegbarkeitStatus =
  | 'verfuegbar'
  | 'eingeschraenkt'
  | 'nicht_verfuegbar'

export type WiederholungTyp = 'keine' | 'woechentlich' | 'monatlich'

export const VERFUEGBARKEIT_STATUS_LABELS: Record<VerfuegbarkeitStatus, string> =
  {
    verfuegbar: 'Verfügbar',
    eingeschraenkt: 'Eingeschränkt',
    nicht_verfuegbar: 'Nicht verfügbar',
  }

export const WIEDERHOLUNG_TYP_LABELS: Record<WiederholungTyp, string> = {
  keine: 'Einmalig',
  woechentlich: 'Wöchentlich',
  monatlich: 'Monatlich',
}

export const VERFUEGBARKEIT_GRUND_OPTIONS = [
  'Urlaub',
  'Arbeit',
  'Privat',
  'Krankheit',
  'Probe',
  'Auffuehrung',
  'Sonstiges',
] as const

export type Verfuegbarkeit = {
  id: string
  mitglied_id: string
  datum_von: string
  datum_bis: string
  zeitfenster_von: string | null
  zeitfenster_bis: string | null
  status: VerfuegbarkeitStatus
  wiederholung: WiederholungTyp
  grund: string | null
  notiz: string | null
  created_at: string
  updated_at: string
}

export type VerfuegbarkeitInsert = Omit<
  Verfuegbarkeit,
  'id' | 'created_at' | 'updated_at'
>
export type VerfuegbarkeitUpdate = Partial<VerfuegbarkeitInsert>

// Extended types for views
export type VerfuegbarkeitMitMitglied = Verfuegbarkeit & {
  mitglied: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
}

export type PersonMitVerfuegbarkeiten = Person & {
  verfuegbarkeiten: Verfuegbarkeit[]
}

// =============================================================================
// User Roles & Permissions (Issue #108)
// =============================================================================

/**
 * App-level user roles for RBAC
 * - ADMIN: System administrator (full access)
 * - VORSTAND: Board/Committee (all operational modules)
 * - MITGLIED_AKTIV: Active member (own data, registrations, hours)
 * - MITGLIED_PASSIV: Passive member (own profile, public info)
 * - HELFER: Helper (assigned shifts only)
 * - PARTNER: Partner organization (own partner data)
 * - FREUNDE: Friends (public info only)
 */
export type UserRole =
  | 'ADMIN'
  | 'VORSTAND'
  | 'MITGLIED_AKTIV'
  | 'MITGLIED_PASSIV'
  | 'HELFER'
  | 'PARTNER'
  | 'FREUNDE'

/**
 * German labels for user roles (for UI display)
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  VORSTAND: 'Vorstand',
  MITGLIED_AKTIV: 'Aktives Mitglied',
  MITGLIED_PASSIV: 'Passives Mitglied',
  HELFER: 'Helfer',
  PARTNER: 'Partner',
  FREUNDE: 'Freunde',
}

/**
 * Capability-based permissions
 */
export type Permission =
  | 'admin:access'
  | 'mitglieder:read'
  | 'mitglieder:write'
  | 'mitglieder:delete'
  | 'profile:write_own'
  | 'veranstaltungen:read'
  | 'veranstaltungen:write'
  | 'veranstaltungen:delete'
  | 'veranstaltungen:register'
  | 'helfereinsaetze:read'
  | 'helfereinsaetze:write'
  | 'helfereinsaetze:delete'
  | 'helfereinsaetze:register'
  | 'helferliste:read'
  | 'helferliste:write'
  | 'helferliste:delete'
  | 'helferliste:register'
  | 'stundenkonto:read'
  | 'stundenkonto:read_own'
  | 'stundenkonto:write'
  | 'partner:read'
  | 'partner:write'
  | 'partner:delete'
  | 'stuecke:read'
  | 'stuecke:write'
  | 'stuecke:delete'
  | 'raeume:read'
  | 'raeume:write'
  | 'ressourcen:read'
  | 'ressourcen:write'

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

export type VeranstaltungTyp =
  | 'vereinsevent'
  | 'probe'
  | 'auffuehrung'
  | 'sonstiges'
export type VeranstaltungStatus =
  | 'geplant'
  | 'bestaetigt'
  | 'abgesagt'
  | 'abgeschlossen'

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

export type VeranstaltungInsert = Omit<
  Veranstaltung,
  'id' | 'created_at' | 'updated_at'
>
export type VeranstaltungUpdate = Partial<VeranstaltungInsert>

export type AnmeldungStatus =
  | 'angemeldet'
  | 'warteliste'
  | 'abgemeldet'
  | 'teilgenommen'

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

export type AnmeldungInsert = Omit<
  Anmeldung,
  'id' | 'created_at' | 'updated_at' | 'anmeldedatum'
>
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

export type HelfereinsatzStatus =
  | 'offen'
  | 'bestaetigt'
  | 'abgeschlossen'
  | 'abgesagt'

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

export type HelfereinsatzInsert = Omit<
  Helfereinsatz,
  'id' | 'created_at' | 'updated_at'
>
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

export type HelferschichtStatus =
  | 'zugesagt'
  | 'abgesagt'
  | 'erschienen'
  | 'nicht_erschienen'

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

export type HelferschichtInsert = Omit<
  Helferschicht,
  'id' | 'created_at' | 'updated_at'
>
export type HelferschichtUpdate = Partial<HelferschichtInsert>

// Extended type with person and role details
export type HelferschichtMitDetails = Helferschicht & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
  helferrolle: Pick<Helferrolle, 'id' | 'rolle'> | null
}

// =============================================================================
// Stundenkonto (Hours Ledger) - Issue #95
// =============================================================================

export type StundenTyp =
  | 'helfereinsatz'
  | 'vereinsevent'
  | 'sonstiges'
  | 'korrektur'

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

export type RaumTyp =
  | 'buehne'
  | 'foyer'
  | 'lager'
  | 'garderobe'
  | 'technik'
  | 'sonstiges'

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

export type RessourceKategorie =
  | 'licht'
  | 'ton'
  | 'requisite'
  | 'kostuem'
  | 'buehne'
  | 'sonstiges'

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

export type RessourceInsert = Omit<
  Ressource,
  'id' | 'created_at' | 'updated_at'
>
export type RessourceUpdate = Partial<RessourceInsert>

// =============================================================================
// Zeitblöcke (Time Blocks) - Issue #97
// =============================================================================

export type ZeitblockTyp =
  | 'aufbau'
  | 'einlass'
  | 'vorfuehrung'
  | 'pause'
  | 'abbau'
  | 'standard'

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

export type AuffuehrungSchichtInsert = Omit<
  AuffuehrungSchicht,
  'id' | 'created_at'
>
export type AuffuehrungSchichtUpdate = Partial<AuffuehrungSchichtInsert>

// Extended type with time block details
export type SchichtMitZeitblock = AuffuehrungSchicht & {
  zeitblock: Pick<
    Zeitblock,
    'id' | 'name' | 'startzeit' | 'endzeit' | 'typ'
  > | null
}

// =============================================================================
// Aufführung Zuweisungen (Performance Assignments) - Issue #97
// =============================================================================

export type ZuweisungStatus =
  | 'zugesagt'
  | 'abgesagt'
  | 'erschienen'
  | 'nicht_erschienen'

export type AuffuehrungZuweisung = {
  id: string
  schicht_id: string
  person_id: string
  status: ZuweisungStatus
  notizen: string | null
  created_at: string
}

export type AuffuehrungZuweisungInsert = Omit<
  AuffuehrungZuweisung,
  'id' | 'created_at'
>
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

export type RessourcenReservierungInsert = Omit<
  RessourcenReservierung,
  'id' | 'created_at'
>
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

export type AuffuehrungTemplateInsert = Omit<
  AuffuehrungTemplate,
  'id' | 'created_at' | 'updated_at'
>
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
  ressourcen: (TemplateRessource & {
    ressource: Pick<Ressource, 'id' | 'name'> | null
  })[]
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

export type StueckStatus =
  | 'in_planung'
  | 'in_proben'
  | 'aktiv'
  | 'abgeschlossen'
  | 'archiviert'
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

export type StueckRolleInsert = Omit<
  StueckRolle,
  'id' | 'created_at' | 'updated_at'
>
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
// Besetzungen (Issue #102)
// =============================================================================

export type BesetzungTyp = 'hauptbesetzung' | 'zweitbesetzung' | 'ersatz'

export type Besetzung = {
  id: string
  rolle_id: string
  person_id: string
  typ: BesetzungTyp
  gueltig_von: string | null
  gueltig_bis: string | null
  notizen: string | null
  created_at: string
  updated_at: string
}

export type BesetzungInsert = Omit<
  Besetzung,
  'id' | 'created_at' | 'updated_at'
>
export type BesetzungUpdate = Partial<BesetzungInsert>

export type BesetzungHistorieAktion = 'erstellt' | 'geaendert' | 'entfernt'

export type BesetzungHistorie = {
  id: string
  besetzung_id: string | null
  rolle_id: string
  person_id: string
  typ: BesetzungTyp
  aktion: BesetzungHistorieAktion
  geaendert_von: string | null
  geaendert_am: string
  details: Record<string, unknown> | null
}

// Extended types for views
export type BesetzungMitDetails = Besetzung & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
  rolle: Pick<StueckRolle, 'id' | 'name' | 'typ'> & {
    stueck: Pick<Stueck, 'id' | 'titel'>
  }
}

export type RolleMitBesetzungen = StueckRolle & {
  besetzungen: (Besetzung & {
    person: Pick<Person, 'id' | 'vorname' | 'nachname'>
  })[]
}

export type PersonMitRollen = Person & {
  besetzungen: (Besetzung & {
    rolle: Pick<StueckRolle, 'id' | 'name' | 'typ'> & {
      stueck: Pick<Stueck, 'id' | 'titel'>
    }
  })[]
}

export type UnbesetzteRolle = StueckRolle & {
  stueck_titel: string
}

// =============================================================================
// Proben (Issue #103)
// =============================================================================

export type ProbeStatus =
  | 'geplant'
  | 'bestaetigt'
  | 'abgesagt'
  | 'verschoben'
  | 'abgeschlossen'
export type TeilnehmerStatus =
  | 'eingeladen'
  | 'zugesagt'
  | 'abgesagt'
  | 'erschienen'
  | 'nicht_erschienen'

export type Probe = {
  id: string
  stueck_id: string
  titel: string
  beschreibung: string | null
  datum: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  status: ProbeStatus
  notizen: string | null
  created_at: string
  updated_at: string
}

export type ProbeInsert = Omit<Probe, 'id' | 'created_at' | 'updated_at'>
export type ProbeUpdate = Partial<ProbeInsert>

export type ProbeSzene = {
  id: string
  probe_id: string
  szene_id: string
  reihenfolge: number | null
  notizen: string | null
  created_at: string
}

export type ProbeSzeneInsert = Omit<ProbeSzene, 'id' | 'created_at'>

export type ProbeTeilnehmer = {
  id: string
  probe_id: string
  person_id: string
  status: TeilnehmerStatus
  notizen: string | null
  created_at: string
  updated_at: string
}

export type ProbeTeilnehmerInsert = Omit<
  ProbeTeilnehmer,
  'id' | 'created_at' | 'updated_at'
>
export type ProbeTeilnehmerUpdate = Partial<ProbeTeilnehmerInsert>

// Extended types
export type ProbeMitDetails = Probe & {
  stueck: Pick<Stueck, 'id' | 'titel'>
  szenen: (ProbeSzene & { szene: Pick<Szene, 'id' | 'nummer' | 'titel'> })[]
  teilnehmer: (ProbeTeilnehmer & {
    person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
  })[]
}

export type KommendeProbe = Probe & {
  stueck_titel: string
  szenen_count: number
  teilnehmer_count: number
  zusagen_count: number
}

// =============================================================================
// Helferliste (Helper List Feature) - Issues #115-134
// =============================================================================

export type HelferEventTyp = 'auffuehrung' | 'helfereinsatz'
export type RollenSichtbarkeit = 'intern' | 'public'
export type HelferAnmeldungStatus =
  | 'angemeldet'
  | 'bestaetigt'
  | 'abgelehnt'
  | 'warteliste'

export const HELFER_ANMELDUNG_STATUS_LABELS: Record<
  HelferAnmeldungStatus,
  string
> = {
  angemeldet: 'Angemeldet',
  bestaetigt: 'Bestätigt',
  abgelehnt: 'Abgelehnt',
  warteliste: 'Warteliste',
}

export const ROLLEN_SICHTBARKEIT_LABELS: Record<RollenSichtbarkeit, string> = {
  intern: 'Intern (nur Mitglieder)',
  public: 'Öffentlich (mit Link)',
}

export type HelferEvent = {
  id: string
  typ: HelferEventTyp
  veranstaltung_id: string | null
  name: string
  beschreibung: string | null
  datum_start: string
  datum_end: string
  ort: string | null
  public_token: string
  created_at: string
  updated_at: string
}

export type HelferEventInsert = Omit<
  HelferEvent,
  'id' | 'public_token' | 'created_at' | 'updated_at'
>
export type HelferEventUpdate = Partial<HelferEventInsert>

export type HelferRollenTemplate = {
  id: string
  name: string
  beschreibung: string | null
  default_anzahl: number
  created_at: string
  updated_at: string
}

export type HelferRollenTemplateInsert = Omit<
  HelferRollenTemplate,
  'id' | 'created_at' | 'updated_at'
>
export type HelferRollenTemplateUpdate = Partial<HelferRollenTemplateInsert>

export type HelferRollenInstanz = {
  id: string
  helfer_event_id: string
  template_id: string | null
  custom_name: string | null
  zeitblock_start: string | null
  zeitblock_end: string | null
  anzahl_benoetigt: number
  sichtbarkeit: RollenSichtbarkeit
  created_at: string
  updated_at: string
}

export type HelferRollenInstanzInsert = Omit<
  HelferRollenInstanz,
  'id' | 'created_at' | 'updated_at'
>
export type HelferRollenInstanzUpdate = Partial<HelferRollenInstanzInsert>

export type HelferAnmeldung = {
  id: string
  rollen_instanz_id: string
  profile_id: string | null
  external_name: string | null
  external_email: string | null
  external_telefon: string | null
  status: HelferAnmeldungStatus
  created_at: string
}

export type HelferAnmeldungInsert = Omit<HelferAnmeldung, 'id' | 'created_at'>
export type HelferAnmeldungUpdate = Partial<
  Omit<HelferAnmeldungInsert, 'rollen_instanz_id'>
>

// Extended types with joins
export type HelferEventMitDetails = HelferEvent & {
  veranstaltung: Pick<Veranstaltung, 'id' | 'titel'> | null
  rollen_count: number
  anmeldungen_count: number
}

export type RollenInstanzMitAnmeldungen = HelferRollenInstanz & {
  template: Pick<HelferRollenTemplate, 'id' | 'name'> | null
  anmeldungen: (HelferAnmeldung & {
    profile: Pick<Profile, 'id' | 'display_name' | 'email'> | null
  })[]
  angemeldet_count: number
}

export type HelferEventMitRollen = HelferEvent & {
  veranstaltung: Pick<Veranstaltung, 'id' | 'titel'> | null
  rollen: RollenInstanzMitAnmeldungen[]
}

export type HelferAnmeldungMitDetails = HelferAnmeldung & {
  rollen_instanz: HelferRollenInstanz & {
    template: Pick<HelferRollenTemplate, 'id' | 'name'> | null
    helfer_event: Pick<
      HelferEvent,
      'id' | 'name' | 'datum_start' | 'datum_end' | 'ort'
    >
  }
  profile: Pick<Profile, 'id' | 'display_name' | 'email'> | null
}

// =============================================================================
// Gruppen (Teams, Gremien, Produktions-Casts) - Dashboards Milestone
// =============================================================================

export type GruppenTyp = 'team' | 'gremium' | 'produktion' | 'sonstiges'

export const GRUPPEN_TYP_LABELS: Record<GruppenTyp, string> = {
  team: 'Team',
  gremium: 'Gremium',
  produktion: 'Produktion',
  sonstiges: 'Sonstiges',
}

export type Gruppe = {
  id: string
  name: string
  typ: GruppenTyp
  beschreibung: string | null
  stueck_id: string | null
  aktiv: boolean
  created_at: string
  updated_at: string
}

export type GruppeInsert = Omit<Gruppe, 'id' | 'created_at' | 'updated_at'>
export type GruppeUpdate = Partial<GruppeInsert>

export type GruppeMitglied = {
  id: string
  gruppe_id: string
  person_id: string
  rolle_in_gruppe: string | null
  von: string | null
  bis: string | null
  created_at: string
}

export type GruppeMitgliedInsert = Omit<GruppeMitglied, 'id' | 'created_at'>
export type GruppeMitgliedUpdate = Partial<GruppeMitgliedInsert>

// Extended types for views
export type GruppeMitDetails = Gruppe & {
  mitglieder_count: number
  stueck: Pick<Stueck, 'id' | 'titel'> | null
}

export type GruppeMitMitglieder = Gruppe & {
  mitglieder: (GruppeMitglied & {
    person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
  })[]
  stueck: Pick<Stueck, 'id' | 'titel'> | null
}

export type PersonMitGruppen = Person & {
  gruppen: (GruppeMitglied & {
    gruppe: Pick<Gruppe, 'id' | 'name' | 'typ'>
  })[]
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
      besetzungen: {
        Row: Besetzung
        Insert: BesetzungInsert
        Update: BesetzungUpdate
      }
      besetzungen_historie: {
        Row: BesetzungHistorie
        Insert: never
        Update: never
      }
      proben: {
        Row: Probe
        Insert: ProbeInsert
        Update: ProbeUpdate
      }
      proben_szenen: {
        Row: ProbeSzene
        Insert: ProbeSzeneInsert
        Update: Partial<ProbeSzeneInsert>
      }
      proben_teilnehmer: {
        Row: ProbeTeilnehmer
        Insert: ProbeTeilnehmerInsert
        Update: ProbeTeilnehmerUpdate
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
      helfer_events: {
        Row: HelferEvent
        Insert: HelferEventInsert
        Update: HelferEventUpdate
      }
      helfer_rollen_templates: {
        Row: HelferRollenTemplate
        Insert: HelferRollenTemplateInsert
        Update: HelferRollenTemplateUpdate
      }
      helfer_rollen_instanzen: {
        Row: HelferRollenInstanz
        Insert: HelferRollenInstanzInsert
        Update: HelferRollenInstanzUpdate
      }
      helfer_anmeldungen: {
        Row: HelferAnmeldung
        Insert: HelferAnmeldungInsert
        Update: HelferAnmeldungUpdate
      }
      gruppen: {
        Row: Gruppe
        Insert: GruppeInsert
        Update: GruppeUpdate
      }
      gruppen_mitglieder: {
        Row: GruppeMitglied
        Insert: GruppeMitgliedInsert
        Update: GruppeMitgliedUpdate
      }
      vereinsrollen: {
        Row: Vereinsrolle
        Insert: VereinsrolleInsert
        Update: VereinsrolleUpdate
      }
      mitglied_rollen: {
        Row: MitgliedRolle
        Insert: MitgliedRolleInsert
        Update: MitgliedRolleUpdate
      }
      verfuegbarkeiten: {
        Row: Verfuegbarkeit
        Insert: VerfuegbarkeitInsert
        Update: VerfuegbarkeitUpdate
      }
    }
  }
}
