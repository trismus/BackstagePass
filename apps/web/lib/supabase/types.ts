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

export type Database = {
  public: {
    Tables: {
      personen: {
        Row: Person
        Insert: PersonInsert
        Update: PersonUpdate
      }
    }
  }
}
