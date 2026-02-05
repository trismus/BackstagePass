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
  | 'produktionen:read'
  | 'produktionen:write'
  | 'produktionen:delete'

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

export type HelferStatus = 'entwurf' | 'veroeffentlicht' | 'abgeschlossen'

export const HELFER_STATUS_LABELS: Record<HelferStatus, string> = {
  entwurf: 'Entwurf',
  veroeffentlicht: 'Veröffentlicht',
  abgeschlossen: 'Abgeschlossen',
}

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
  helfer_template_id: string | null
  helfer_status: HelferStatus | null
  public_helfer_token: string | null
  // Booking limits (Issue #210)
  max_schichten_pro_helfer: number | null
  helfer_buchung_deadline: string | null
  helfer_buchung_limit_aktiv: boolean
  // Communication (Issue #221)
  public_helfer_token: string | null
  koordinator_id: string | null
  created_at: string
  updated_at: string
}

export type VeranstaltungInsert = Omit<
  Veranstaltung,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'helfer_template_id'
  | 'helfer_status'
  | 'public_helfer_token'
  | 'max_schichten_pro_helfer'
  | 'helfer_buchung_deadline'
  | 'helfer_buchung_limit_aktiv'
  | 'public_helfer_token'
  | 'koordinator_id'
> & {
  helfer_template_id?: string | null
  helfer_status?: HelferStatus | null
  public_helfer_token?: string | null
  max_schichten_pro_helfer?: number | null
  helfer_buchung_deadline?: string | null
  helfer_buchung_limit_aktiv?: boolean
  public_helfer_token?: string | null
  koordinator_id?: string | null
}
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

export type SchichtSichtbarkeit = 'intern' | 'public'

export const SCHICHT_SICHTBARKEIT_LABELS: Record<SchichtSichtbarkeit, string> = {
  intern: 'Intern',
  public: 'Öffentlich',
}

export type AuffuehrungSchicht = {
  id: string
  veranstaltung_id: string
  zeitblock_id: string | null
  rolle: string
  anzahl_benoetigt: number
  sichtbarkeit: SchichtSichtbarkeit
  created_at: string
}

export type AuffuehrungSchichtInsert = Omit<
  AuffuehrungSchicht,
  'id' | 'created_at' | 'sichtbarkeit'
> & {
  sichtbarkeit?: SchichtSichtbarkeit // defaults to 'intern' in DB
}
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
  person_id: string | null
  external_helper_id: string | null
  status: ZuweisungStatus
  notizen: string | null
  abmeldung_token: string | null
  // Check-in fields (M7)
  checked_in_at: string | null
  checked_in_by: string | null
  no_show: boolean
  // Replacement fields (M7)
  ersetzt_zuweisung_id: string | null
  ersatz_grund: string | null
  created_at: string
}

export type AuffuehrungZuweisungInsert = Omit<
  AuffuehrungZuweisung,
  'id' | 'created_at' | 'updated_at' | 'external_helper_id'
> & {
  external_helper_id?: string | null // optional - only for external helpers
}
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
// Check-in Types (M7 Live Operations)
// =============================================================================

export type CheckInStatus = 'erwartet' | 'anwesend' | 'no_show'

export const CHECKIN_STATUS_LABELS: Record<CheckInStatus, string> = {
  erwartet: 'Erwartet',
  anwesend: 'Anwesend',
  no_show: 'Nicht erschienen',
}

export type ZuweisungMitCheckIn = AuffuehrungZuweisung & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'telefon' | 'email'>
  schicht: {
    id: string
    rolle: string
    zeitblock: Pick<Zeitblock, 'id' | 'name' | 'startzeit' | 'endzeit'> | null
  }
  checkin_status: CheckInStatus
}

export type ZeitblockMitCheckIns = {
  id: string
  name: string
  startzeit: string
  endzeit: string
  typ: ZeitblockTyp
  status: 'geplant' | 'aktiv' | 'abgeschlossen'
  zuweisungen: ZuweisungMitCheckIn[]
  stats: {
    total: number
    eingecheckt: number
    no_show: number
    erwartet: number
  }
}

export type CheckInOverview = {
  veranstaltung: {
    id: string
    titel: string
    datum: string
    startzeit: string | null
    endzeit: string | null
  }
  zeitbloecke: ZeitblockMitCheckIns[]
  stats: {
    total: number
    eingecheckt: number
    no_show: number
    erwartet: number
  }
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

// =============================================================================
// Template Info-Blöcke (Issue #203)
// =============================================================================

export type TemplateInfoBlock = {
  id: string
  template_id: string
  titel: string
  beschreibung: string | null
  offset_minuten: number
  dauer_minuten: number
  sortierung: number
  created_at: string
}

export type TemplateInfoBlockInsert = Omit<TemplateInfoBlock, 'id' | 'created_at'>
export type TemplateInfoBlockUpdate = Partial<TemplateInfoBlockInsert>

export type InfoBlock = {
  id: string
  veranstaltung_id: string
  titel: string
  beschreibung: string | null
  startzeit: string
  endzeit: string
  sortierung: number
  created_at: string
}

export type InfoBlockInsert = Omit<InfoBlock, 'id' | 'created_at'>
export type InfoBlockUpdate = Partial<InfoBlockInsert>

// =============================================================================
// Template Sachleistungen (Issue #202)
// =============================================================================

export type TemplateSachleistung = {
  id: string
  template_id: string
  name: string
  anzahl: number
  beschreibung: string | null
  created_at: string
}

export type TemplateSachleistungInsert = Omit<
  TemplateSachleistung,
  'id' | 'created_at'
>
export type TemplateSachleistungUpdate = Partial<TemplateSachleistungInsert>

export type Sachleistung = {
  id: string
  veranstaltung_id: string
  name: string
  anzahl: number
  beschreibung: string | null
  created_at: string
}

export type SachleistungInsert = Omit<Sachleistung, 'id' | 'created_at'>
export type SachleistungUpdate = Partial<SachleistungInsert>

// Extended type with all template details
export type TemplateMitDetails = AuffuehrungTemplate & {
  zeitbloecke: TemplateZeitblock[]
  schichten: TemplateSchicht[]
  ressourcen: (TemplateRessource & {
    ressource: Pick<Ressource, 'id' | 'name'> | null
  })[]
  info_bloecke: TemplateInfoBlock[]
  sachleistungen: TemplateSachleistung[]
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
  text: string | null
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
// Externe Helfer Profile (Issue #208)
// =============================================================================

export type ExterneHelferProfil = {
  id: string
  email: string
  vorname: string
  nachname: string
  telefon: string | null
  notizen: string | null
  erstellt_am: string
  letzter_einsatz: string | null
}

export type ExterneHelferProfilInsert = Omit<
  ExterneHelferProfil,
  'id' | 'erstellt_am'
>
export type ExterneHelferProfilUpdate = Partial<
  Omit<ExterneHelferProfilInsert, 'email'>
>

// Extended type with registration count
export type ExterneHelferProfilMitEinsaetze = ExterneHelferProfil & {
  einsaetze_count: number
}

// =============================================================================
// Helfer Warteliste (Issue #211)
// =============================================================================

export type WartelisteStatus =
  | 'wartend'
  | 'benachrichtigt'
  | 'zugewiesen'
  | 'abgelehnt'

export const WARTELISTE_STATUS_LABELS: Record<WartelisteStatus, string> = {
  wartend: 'Wartend',
  benachrichtigt: 'Benachrichtigt',
  zugewiesen: 'Zugewiesen',
  abgelehnt: 'Abgelehnt',
}

export type HelferWarteliste = {
  id: string
  schicht_id: string
  profile_id: string | null
  external_helper_id: string | null
  position: number
  erstellt_am: string
  benachrichtigt_am: string | null
  status: WartelisteStatus
  confirmation_token: string | null
  antwort_deadline: string | null
}

export type HelferWartelisteInsert = Omit<
  HelferWarteliste,
  'id' | 'erstellt_am' | 'position'
>
export type HelferWartelisteUpdate = Partial<
  Omit<HelferWartelisteInsert, 'schicht_id' | 'profile_id' | 'external_helper_id'>
>

// Extended type with person/helper details
export type WartelisteEintragMitDetails = HelferWarteliste & {
  profile: Pick<Profile, 'id' | 'display_name' | 'email'> | null
  external_helper: Pick<ExterneHelferProfil, 'id' | 'vorname' | 'nachname' | 'email'> | null
  schicht: {
    id: string
    rolle: string
    veranstaltung_id: string
  }
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
  external_helper_id: string | null  // FK to externe_helfer_profile (Issue #208)
  external_name: string | null       // Legacy: inline name for external helpers
  external_email: string | null      // Legacy: inline email
  external_telefon: string | null    // Legacy: inline phone
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
// Produktionen (Issue #156)
// =============================================================================

export type ProduktionStatus =
  | 'draft'
  | 'planung'
  | 'casting'
  | 'proben'
  | 'premiere'
  | 'laufend'
  | 'abgeschlossen'
  | 'abgesagt'

export type SerieStatus = 'draft' | 'planung' | 'publiziert' | 'abgeschlossen'

export type AuffuehrungsTyp =
  | 'regulaer'
  | 'premiere'
  | 'derniere'
  | 'schulvorstellung'
  | 'sondervorstellung'

export const PRODUKTION_STATUS_LABELS: Record<ProduktionStatus, string> = {
  draft: 'Entwurf',
  planung: 'In Planung',
  casting: 'Casting',
  proben: 'Probenphase',
  premiere: 'Premiere',
  laufend: 'Laufend',
  abgeschlossen: 'Abgeschlossen',
  abgesagt: 'Abgesagt',
}

export const SERIE_STATUS_LABELS: Record<SerieStatus, string> = {
  draft: 'Entwurf',
  planung: 'In Planung',
  publiziert: 'Publiziert',
  abgeschlossen: 'Abgeschlossen',
}

export const AUFFUEHRUNG_TYP_LABELS: Record<AuffuehrungsTyp, string> = {
  regulaer: 'Regulär',
  premiere: 'Premiere',
  derniere: 'Dernière',
  schulvorstellung: 'Schulvorstellung',
  sondervorstellung: 'Sondervorstellung',
}

export type Produktion = {
  id: string
  titel: string
  beschreibung: string | null
  stueck_id: string | null
  status: ProduktionStatus
  saison: string
  proben_start: string | null
  premiere: string | null
  derniere: string | null
  produktionsleitung_id: string | null
  created_at: string
  updated_at: string
}

export type ProduktionInsert = Omit<
  Produktion,
  'id' | 'created_at' | 'updated_at'
>
export type ProduktionUpdate = Partial<ProduktionInsert>

export type ProduktionsChecklistItem = {
  id: string
  produktion_id: string
  phase: string
  label: string
  pflicht: boolean
  erledigt: boolean
  erledigt_von: string | null
  erledigt_am: string | null
  sort_order: number
  created_at: string
}

export type Auffuehrungsserie = {
  id: string
  produktion_id: string
  name: string
  beschreibung: string | null
  status: SerieStatus
  standard_ort: string | null
  standard_startzeit: string | null
  standard_einlass_minuten: number | null
  template_id: string | null
  stueck_id: string | null
  datum_von: string | null
  datum_bis: string | null
  created_at: string
  updated_at: string
}

export type AuffuehrungsserieInsert = Omit<
  Auffuehrungsserie,
  'id' | 'created_at' | 'updated_at'
>
export type AuffuehrungsserieUpdate = Partial<AuffuehrungsserieInsert>

export type Serienauffuehrung = {
  id: string
  serie_id: string
  veranstaltung_id: string | null
  datum: string
  startzeit: string | null
  ort: string | null
  typ: AuffuehrungsTyp
  ist_ausnahme: boolean
  notizen: string | null
  created_at: string
  updated_at: string
}

export type SerienauffuehrungInsert = Omit<
  Serienauffuehrung,
  'id' | 'created_at' | 'updated_at'
>
export type SerienauffuehrungUpdate = Partial<SerienauffuehrungInsert>

// =============================================================================
// Produktions-Serie Template-Zuweisung (Issue #207)
// =============================================================================

export type Wochentag = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const WOCHENTAG_LABELS: Record<Wochentag, string> = {
  0: 'Sonntag',
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: 'Samstag',
}

export type ProduktionsSerieTemplate = {
  id: string
  serie_id: string
  wochentag: Wochentag
  template_id: string
  created_at: string
}

export type ProduktionsSerieTemplateInsert = Omit<ProduktionsSerieTemplate, 'id' | 'created_at'>
export type ProduktionsSerieTemplateUpdate = Partial<ProduktionsSerieTemplateInsert>

// Extended type with template details
export type ProduktionsSerieTemplateMitDetails = ProduktionsSerieTemplate & {
  template: Pick<AuffuehrungTemplate, 'id' | 'name'>
}

export type ProduktionsStab = {
  id: string
  produktion_id: string
  person_id: string | null
  funktion: string
  ist_leitung: boolean
  von: string | null
  bis: string | null
  notizen: string | null
  externer_name: string | null
  externer_kontakt: string | null
  created_at: string
}

export type ProduktionsStabInsert = Omit<ProduktionsStab, 'id' | 'created_at'>
export type ProduktionsStabUpdate = Partial<ProduktionsStabInsert>

// Stab-Funktionen (Issue #159)
export type StabKategorie = 'kuenstlerisch' | 'technisch' | 'organisation'

export const STAB_KATEGORIE_LABELS: Record<StabKategorie, string> = {
  kuenstlerisch: 'Künstlerisch',
  technisch: 'Technisch',
  organisation: 'Organisation',
}

export type StabFunktion = {
  id: string
  name: string
  kategorie: StabKategorie
  sortierung: number
  aktiv: boolean
  created_at: string
}

export type StabMitgliedMitDetails = ProduktionsStab & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'> | null
}

// Extended types for views
export type ProduktionMitDetails = Produktion & {
  stueck: Pick<Stueck, 'id' | 'titel'> | null
  produktionsleitung: Pick<Person, 'id' | 'vorname' | 'nachname'> | null
  serien_count: number
  naechste_auffuehrung: string | null
}

export type AuffuehrungsserieMitDetails = Auffuehrungsserie & {
  produktion: Pick<Produktion, 'id' | 'titel'>
  auffuehrungen_count: number
  template: Pick<AuffuehrungTemplate, 'id' | 'name'> | null
}

export type ProduktionMitStab = Produktion & {
  stab: StabMitgliedMitDetails[]
}

// =============================================================================
// Produktions-Dokumente (Issue #160)
// =============================================================================

export type DokumentKategorie =
  | 'skript'
  | 'spielplan'
  | 'technik'
  | 'requisiten'
  | 'kostueme'
  | 'werbung'
  | 'sonstiges'

export type DokumentStatus = 'entwurf' | 'freigegeben'

export const DOKUMENT_KATEGORIE_LABELS: Record<DokumentKategorie, string> = {
  skript: 'Skript',
  spielplan: 'Spielplan',
  technik: 'Technik',
  requisiten: 'Requisiten',
  kostueme: 'Kostüme',
  werbung: 'Werbung',
  sonstiges: 'Sonstiges',
}

export const DOKUMENT_STATUS_LABELS: Record<DokumentStatus, string> = {
  entwurf: 'Entwurf',
  freigegeben: 'Freigegeben',
}

export type ProduktionsDokument = {
  id: string
  produktion_id: string
  name: string
  kategorie: DokumentKategorie
  datei_pfad: string
  datei_name: string
  datei_groesse: number | null
  mime_type: string | null
  version: number
  vorgaenger_id: string | null
  status: DokumentStatus
  hochgeladen_von: string | null
  created_at: string
  updated_at: string
}

export type ProduktionsDokumentInsert = Omit<
  ProduktionsDokument,
  'id' | 'created_at' | 'updated_at'
>
export type ProduktionsDokumentUpdate = Partial<
  Omit<ProduktionsDokumentInsert, 'produktion_id' | 'datei_pfad'>
>

// =============================================================================
// Produktions-Besetzungen (Issue #158)
// =============================================================================

export type ProduktionsBesetzungStatus =
  | 'offen'
  | 'vorgemerkt'
  | 'besetzt'
  | 'abgesagt'

export const PRODUKTIONS_BESETZUNG_STATUS_LABELS: Record<
  ProduktionsBesetzungStatus,
  string
> = {
  offen: 'Offen',
  vorgemerkt: 'Vorgemerkt',
  besetzt: 'Besetzt',
  abgesagt: 'Abgesagt',
}

export type ProduktionsBesetzung = {
  id: string
  produktion_id: string
  rolle_id: string
  person_id: string | null
  typ: BesetzungTyp
  status: ProduktionsBesetzungStatus
  notizen: string | null
  created_at: string
  updated_at: string
}

export type ProduktionsBesetzungInsert = Omit<
  ProduktionsBesetzung,
  'id' | 'created_at' | 'updated_at'
>
export type ProduktionsBesetzungUpdate = Partial<
  Omit<ProduktionsBesetzungInsert, 'produktion_id'>
>

// Extended types for views
export type ProduktionsBesetzungMitDetails = ProduktionsBesetzung & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'skills'> | null
  rolle: Pick<StueckRolle, 'id' | 'name' | 'typ'>
}

export type RolleMitProduktionsBesetzungen = StueckRolle & {
  besetzungen: (ProduktionsBesetzung & {
    person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'skills'> | null
  })[]
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
// Email Templates (Issue #220)
// =============================================================================

export type EmailTemplateTyp =
  | 'confirmation'
  | 'reminder_48h'
  | 'reminder_6h'
  | 'cancellation'
  | 'waitlist_assigned'
  | 'waitlist_timeout'
  | 'thank_you'

export const EMAIL_TEMPLATE_TYP_LABELS: Record<EmailTemplateTyp, string> = {
  confirmation: 'Buchungsbestätigung',
  reminder_48h: 'Erinnerung (48h vorher)',
  reminder_6h: 'Erinnerung (6h vorher)',
  cancellation: 'Abmeldebestätigung',
  waitlist_assigned: 'Warteliste: Platz frei',
  waitlist_timeout: 'Warteliste: Timeout',
  thank_you: 'Dankeschön',
}

export type EmailTemplate = {
  id: string
  typ: EmailTemplateTyp
  subject: string
  body_html: string
  body_text: string
  placeholders: string[]
  aktiv: boolean
  created_at: string
  updated_at: string
}

export type EmailTemplateInsert = Omit<
  EmailTemplate,
  'id' | 'created_at' | 'updated_at'
>
export type EmailTemplateUpdate = Partial<
  Omit<EmailTemplateInsert, 'typ'>
>

// Placeholder data structure for rendering templates
export type EmailPlaceholderData = {
  vorname?: string
  nachname?: string
  email?: string
  veranstaltung?: string
  datum?: string
  uhrzeit?: string
  ort?: string
  rolle?: string
  zeitblock?: string
  startzeit?: string
  endzeit?: string
  treffpunkt?: string
  briefing_zeit?: string
  helferessen_zeit?: string
  absage_link?: string
  public_link?: string
  koordinator_name?: string
  koordinator_email?: string
  koordinator_telefon?: string
  frist?: string
}

// =============================================================================
// Email Logs (Issue #221)
// =============================================================================

export type EmailLogStatus = 'pending' | 'sent' | 'failed' | 'retrying'

export type EmailLog = {
  id: string
  anmeldung_id: string | null
  helfer_anmeldung_id: string | null
  template_typ: string
  recipient_email: string
  recipient_name: string | null
  status: EmailLogStatus
  error_message: string | null
  retry_count: number
  sent_at: string | null
  created_at: string
}

export type EmailLogInsert = Omit<EmailLog, 'id' | 'created_at' | 'retry_count'> & {
  retry_count?: number
}
export type EmailLogUpdate = Partial<Omit<EmailLogInsert, 'template_typ' | 'recipient_email'>>

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
      template_info_bloecke: {
        Row: TemplateInfoBlock
        Insert: TemplateInfoBlockInsert
        Update: TemplateInfoBlockUpdate
      }
      info_bloecke: {
        Row: InfoBlock
        Insert: InfoBlockInsert
        Update: InfoBlockUpdate
      }
      template_sachleistungen: {
        Row: TemplateSachleistung
        Insert: TemplateSachleistungInsert
        Update: TemplateSachleistungUpdate
      }
      sachleistungen: {
        Row: Sachleistung
        Insert: SachleistungInsert
        Update: SachleistungUpdate
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
      externe_helfer_profile: {
        Row: ExterneHelferProfil
        Insert: ExterneHelferProfilInsert
        Update: ExterneHelferProfilUpdate
      }
      helfer_warteliste: {
        Row: HelferWarteliste
        Insert: HelferWartelisteInsert
        Update: HelferWartelisteUpdate
      }
      produktionen: {
        Row: Produktion
        Insert: ProduktionInsert
        Update: ProduktionUpdate
      }
      auffuehrungsserien: {
        Row: Auffuehrungsserie
        Insert: AuffuehrungsserieInsert
        Update: AuffuehrungsserieUpdate
      }
      serienauffuehrungen: {
        Row: Serienauffuehrung
        Insert: SerienauffuehrungInsert
        Update: SerienauffuehrungUpdate
      }
      produktions_stab: {
        Row: ProduktionsStab
        Insert: ProduktionsStabInsert
        Update: ProduktionsStabUpdate
      }
      stab_funktionen: {
        Row: StabFunktion
        Insert: Omit<StabFunktion, 'id' | 'created_at'>
        Update: Partial<Omit<StabFunktion, 'id' | 'created_at'>>
      }
      produktions_besetzungen: {
        Row: ProduktionsBesetzung
        Insert: ProduktionsBesetzungInsert
        Update: ProduktionsBesetzungUpdate
      }
      produktions_dokumente: {
        Row: ProduktionsDokument
        Insert: ProduktionsDokumentInsert
        Update: ProduktionsDokumentUpdate
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
      email_templates: {
        Row: EmailTemplate
        Insert: EmailTemplateInsert
        Update: EmailTemplateUpdate
      }
    }
  }
}