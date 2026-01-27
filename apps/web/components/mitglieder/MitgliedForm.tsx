'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createPerson,
  createPersonWithAccount,
  updatePerson,
  deletePerson,
} from '@/lib/actions/personen'
import type {
  Person,
  Rolle,
  UserRole,
  TelefonNummer,
  TelefonTyp,
  BevorzugteKontaktart,
  SocialMedia,
} from '@/lib/supabase/types'
import { TELEFON_TYP_LABELS, KONTAKTART_LABELS } from '@/lib/supabase/types'

interface MitgliedFormProps {
  person?: Person
  mode: 'create' | 'edit'
}

const rollenOptions: { value: Rolle; label: string }[] = [
  { value: 'mitglied', label: 'Mitglied' },
  { value: 'vorstand', label: 'Vorstand' },
  { value: 'regie', label: 'Regie' },
  { value: 'technik', label: 'Technik' },
  { value: 'gast', label: 'Gast' },
]

const appRollenOptions: {
  value: UserRole
  label: string
  description: string
}[] = [
  {
    value: 'MITGLIED_PASSIV',
    label: 'Passives Mitglied',
    description: 'Nur eigenes Profil',
  },
  {
    value: 'MITGLIED_AKTIV',
    label: 'Aktives Mitglied',
    description: 'Anmeldungen, Stundenkonto',
  },
  {
    value: 'VORSTAND',
    label: 'Vorstand',
    description: 'Alle operativen Module',
  },
  {
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Vollzugriff inkl. System',
  },
]

export function MitgliedForm({ person, mode }: MitgliedFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [vorname, setVorname] = useState(person?.vorname || '')
  const [nachname, setNachname] = useState(person?.nachname || '')
  const [strasse, setStrasse] = useState(person?.strasse || '')
  const [plz, setPlz] = useState(person?.plz || '')
  const [ort, setOrt] = useState(person?.ort || '')
  const [geburtstag, setGeburtstag] = useState(person?.geburtstag || '')
  const [email, setEmail] = useState(person?.email || '')
  const [telefon, setTelefon] = useState(person?.telefon || '')
  const [rolle, setRolle] = useState<Rolle>(person?.rolle || 'mitglied')
  const [aktiv, setAktiv] = useState(person?.aktiv ?? true)
  const [notizen, setNotizen] = useState(person?.notizen || '')

  // Extended profile fields (Issue #1 Mitglieder)
  const [biografie, setBiografie] = useState(person?.biografie || '')
  const [mitgliedSeit, setMitgliedSeit] = useState(person?.mitglied_seit || '')
  const [austrittsdatum, setAustrittsdatum] = useState(person?.austrittsdatum || '')
  const [austrittsgrund, setAustrittsgrund] = useState(person?.austrittsgrund || '')
  const [skills, setSkills] = useState<string[]>(person?.skills || [])
  const [skillInput, setSkillInput] = useState('')

  // Emergency contact
  const [notfallkontaktName, setNotfallkontaktName] = useState(person?.notfallkontakt_name || '')
  const [notfallkontaktTelefon, setNotfallkontaktTelefon] = useState(person?.notfallkontakt_telefon || '')
  const [notfallkontaktBeziehung, setNotfallkontaktBeziehung] = useState(person?.notfallkontakt_beziehung || '')

  // Extended contact fields (Issue #3 Mitglieder)
  const [telefonNummern, setTelefonNummern] = useState<TelefonNummer[]>(
    person?.telefon_nummern || []
  )
  const [bevorzugteKontaktart, setBevorzugteKontaktart] = useState<BevorzugteKontaktart | null>(
    person?.bevorzugte_kontaktart || null
  )
  const [socialMedia, setSocialMedia] = useState<SocialMedia | null>(
    person?.social_media || null
  )
  const [kontaktNotizen, setKontaktNotizen] = useState(person?.kontakt_notizen || '')
  const [showAddPhone, setShowAddPhone] = useState(false)
  const [newPhoneTyp, setNewPhoneTyp] = useState<TelefonTyp>('mobil')
  const [newPhoneNummer, setNewPhoneNummer] = useState('')

  // App-Zugang
  const [createAppAccount, setCreateAppAccount] = useState(false)
  const [appRole, setAppRole] = useState<UserRole>('MITGLIED_PASSIV')

  // Add a skill tag
  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setSkillInput('')
    }
  }

  // Remove a skill tag
  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      vorname,
      nachname,
      strasse: strasse || null,
      plz: plz || null,
      ort: ort || null,
      geburtstag: geburtstag || null,
      email: email || null,
      telefon: telefon || null,
      rolle,
      aktiv,
      notizen: notizen || null,
      // Extended profile fields
      biografie: biografie || null,
      mitglied_seit: mitgliedSeit || null,
      austrittsdatum: austrittsdatum || null,
      austrittsgrund: austrittsgrund || null,
      skills,
      notfallkontakt_name: notfallkontaktName || null,
      notfallkontakt_telefon: notfallkontaktTelefon || null,
      notfallkontakt_beziehung: notfallkontaktBeziehung || null,
      profilbild_url: person?.profilbild_url || null, // preserved from existing, upload handled separately
      // Extended contact fields
      telefon_nummern: telefonNummern,
      bevorzugte_kontaktart: bevorzugteKontaktart,
      social_media: socialMedia,
      kontakt_notizen: kontaktNotizen || null,
      // Archive fields (preserved from existing)
      archiviert_am: person?.archiviert_am || null,
      archiviert_von: person?.archiviert_von || null,
    }

    let result
    if (mode === 'create') {
      if (createAppAccount && data.email) {
        result = await createPersonWithAccount(data, appRole)
      } else {
        result = await createPerson(data)
      }
    } else {
      result = await updatePerson(person!.id, data)
    }

    if (result.success) {
      router.push('/mitglieder')
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!person) return
    if (!confirm(`${person.vorname} ${person.nachname} wirklich deaktivieren?`))
      return

    setLoading(true)
    const result = await deletePerson(person.id)

    if (result.success) {
      router.push('/mitglieder')
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Persönliche Daten */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Persönliche Daten
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Vorname */}
          <div>
            <label
              htmlFor="vorname"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Vorname *
            </label>
            <input
              id="vorname"
              type="text"
              required
              value={vorname}
              onChange={(e) => setVorname(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Nachname */}
          <div>
            <label
              htmlFor="nachname"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nachname *
            </label>
            <input
              id="nachname"
              type="text"
              required
              value={nachname}
              onChange={(e) => setNachname(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Geburtstag */}
          <div>
            <label
              htmlFor="geburtstag"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Geburtstag
            </label>
            <input
              id="geburtstag"
              type="date"
              value={geburtstag}
              onChange={(e) => setGeburtstag(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Rolle */}
          <div>
            <label
              htmlFor="rolle"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Rolle
            </label>
            <select
              id="rolle"
              value={rolle}
              onChange={(e) => setRolle(e.target.value as Rolle)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {rollenOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Adresse</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Strasse */}
          <div className="md:col-span-2">
            <label
              htmlFor="strasse"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Straße
            </label>
            <input
              id="strasse"
              type="text"
              value={strasse}
              onChange={(e) => setStrasse(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Musterstraße 123"
            />
          </div>

          {/* PLZ */}
          <div>
            <label
              htmlFor="plz"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              PLZ
            </label>
            <input
              id="plz"
              type="text"
              value={plz}
              onChange={(e) => setPlz(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="80331"
            />
          </div>

          {/* Ort */}
          <div>
            <label
              htmlFor="ort"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Ort
            </label>
            <input
              id="ort"
              type="text"
              value={ort}
              onChange={(e) => setOrt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="München"
            />
          </div>
        </div>
      </div>

      {/* Kontakt */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Kontakt</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Telefon */}
            <div>
              <label
                htmlFor="telefon"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Haupttelefon
              </label>
              <input
                id="telefon"
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="+41 79 123 45 67"
              />
            </div>
          </div>

          {/* Weitere Telefonnummern */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Weitere Telefonnummern
              </label>
              {!showAddPhone && (
                <button
                  type="button"
                  onClick={() => setShowAddPhone(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Hinzufügen
                </button>
              )}
            </div>

            {telefonNummern.length > 0 && (
              <div className="mb-3 space-y-2">
                {telefonNummern.map((phone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                        {TELEFON_TYP_LABELS[phone.typ]}
                      </span>
                      <span className="text-sm">{phone.nummer}</span>
                      {phone.ist_bevorzugt && (
                        <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">
                          Bevorzugt
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!phone.ist_bevorzugt && (
                        <button
                          type="button"
                          onClick={() => {
                            setTelefonNummern(
                              telefonNummern.map((p, i) => ({
                                ...p,
                                ist_bevorzugt: i === index,
                              }))
                            )
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Als bevorzugt
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = telefonNummern.filter((_, i) => i !== index)
                          if (phone.ist_bevorzugt && updated.length > 0) {
                            updated[0].ist_bevorzugt = true
                          }
                          setTelefonNummern(updated)
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddPhone && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-end gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">Typ</label>
                    <select
                      value={newPhoneTyp}
                      onChange={(e) => setNewPhoneTyp(e.target.value as TelefonTyp)}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                    >
                      {(Object.keys(TELEFON_TYP_LABELS) as TelefonTyp[]).map(
                        (typ) => (
                          <option key={typ} value={typ}>
                            {TELEFON_TYP_LABELS[typ]}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-600">Nummer</label>
                    <input
                      type="tel"
                      value={newPhoneNummer}
                      onChange={(e) => setNewPhoneNummer(e.target.value)}
                      placeholder="+41 79 123 45 67"
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (newPhoneNummer.trim()) {
                        setTelefonNummern([
                          ...telefonNummern,
                          {
                            typ: newPhoneTyp,
                            nummer: newPhoneNummer.trim(),
                            ist_bevorzugt: telefonNummern.length === 0,
                          },
                        ])
                        setNewPhoneNummer('')
                        setShowAddPhone(false)
                      }
                    }}
                    disabled={!newPhoneNummer.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPhone(false)
                      setNewPhoneNummer('')
                    }}
                    className="px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bevorzugte Kontaktart */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="bevorzugteKontaktart"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Bevorzugte Kontaktart
              </label>
              <select
                id="bevorzugteKontaktart"
                value={bevorzugteKontaktart || ''}
                onChange={(e) =>
                  setBevorzugteKontaktart(
                    (e.target.value as BevorzugteKontaktart) || null
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Keine Präferenz</option>
                {(Object.keys(KONTAKTART_LABELS) as BevorzugteKontaktart[]).map(
                  (art) => (
                    <option key={art} value={art}>
                      {KONTAKTART_LABELS[art]}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="kontaktNotizen"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Kontakt-Hinweise
              </label>
              <input
                id="kontaktNotizen"
                type="text"
                value={kontaktNotizen}
                onChange={(e) => setKontaktNotizen(e.target.value)}
                placeholder="z.B. Nicht vor 10 Uhr anrufen"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Social Media */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Social Media (optional)
            </label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <input
                type="text"
                value={socialMedia?.instagram || ''}
                onChange={(e) =>
                  setSocialMedia({
                    ...(socialMedia || {}),
                    instagram: e.target.value || undefined,
                  })
                }
                placeholder="Instagram"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={socialMedia?.facebook || ''}
                onChange={(e) =>
                  setSocialMedia({
                    ...(socialMedia || {}),
                    facebook: e.target.value || undefined,
                  })
                }
                placeholder="Facebook"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={socialMedia?.linkedin || ''}
                onChange={(e) =>
                  setSocialMedia({
                    ...(socialMedia || {}),
                    linkedin: e.target.value || undefined,
                  })
                }
                placeholder="LinkedIn"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={socialMedia?.twitter || ''}
                onChange={(e) =>
                  setSocialMedia({
                    ...(socialMedia || {}),
                    twitter: e.target.value || undefined,
                  })
                }
                placeholder="X / Twitter"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notfallkontakt */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Notfallkontakt</h3>
        <p className="mb-4 text-sm text-gray-500">
          Nur für Vorstand und Admins sichtbar
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label
              htmlFor="notfallkontaktName"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="notfallkontaktName"
              type="text"
              value={notfallkontaktName}
              onChange={(e) => setNotfallkontaktName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Max Muster"
            />
          </div>

          <div>
            <label
              htmlFor="notfallkontaktTelefon"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Telefon
            </label>
            <input
              id="notfallkontaktTelefon"
              type="tel"
              value={notfallkontaktTelefon}
              onChange={(e) => setNotfallkontaktTelefon(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="+41 79 123 45 67"
            />
          </div>

          <div>
            <label
              htmlFor="notfallkontaktBeziehung"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Beziehung
            </label>
            <select
              id="notfallkontaktBeziehung"
              value={notfallkontaktBeziehung}
              onChange={(e) => setNotfallkontaktBeziehung(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Wählen --</option>
              <option value="Ehepartner">Ehepartner/in</option>
              <option value="Partner">Partner/in</option>
              <option value="Eltern">Eltern</option>
              <option value="Geschwister">Geschwister</option>
              <option value="Kind">Kind</option>
              <option value="Freund">Freund/in</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>
          </div>
        </div>
      </div>

      {/* Biografie */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Über mich</h3>
        <div>
          <label
            htmlFor="biografie"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Kurze Vorstellung
          </label>
          <textarea
            id="biografie"
            rows={3}
            value={biografie}
            onChange={(e) => setBiografie(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            placeholder="Ein paar Worte über dich..."
          />
        </div>
      </div>

      {/* Fähigkeiten/Skills */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Fähigkeiten</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill()
                }
              }}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. Licht, Ton, Bühnenbau..."
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
            >
              Hinzufügen
            </button>
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 text-blue-600 hover:text-blue-900"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Häufige Skills: Licht, Ton, Bühnenbau, Kostüm, Maske, Requisite, Fotografie, Video
          </p>
        </div>
      </div>

      {/* Mitgliedschaft */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Mitgliedschaft</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="mitgliedSeit"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Mitglied seit
            </label>
            <input
              id="mitgliedSeit"
              type="date"
              value={mitgliedSeit}
              onChange={(e) => setMitgliedSeit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!aktiv && (
            <>
              <div>
                <label
                  htmlFor="austrittsdatum"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Austrittsdatum
                </label>
                <input
                  id="austrittsdatum"
                  type="date"
                  value={austrittsdatum}
                  onChange={(e) => setAustrittsdatum(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="austrittsgrund"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Austrittsgrund
                </label>
                <input
                  id="austrittsgrund"
                  type="text"
                  value={austrittsgrund}
                  onChange={(e) => setAustrittsgrund(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* App-Zugang - nur bei Erstellung */}
      {mode === 'create' && (
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">App-Zugang</h3>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createAppAccount}
                onChange={(e) => setCreateAppAccount(e.target.checked)}
                disabled={!email}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">
                App-Zugang erstellen
              </span>
            </label>
            {!email && (
              <p className="ml-6 mt-1 text-xs text-gray-500">
                E-Mail-Adresse erforderlich für App-Zugang
              </p>
            )}
          </div>

          {createAppAccount && email && (
            <div className="ml-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <label
                htmlFor="appRole"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                App-Berechtigung
              </label>
              <select
                id="appRole"
                value={appRole}
                onChange={(e) => setAppRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {appRollenOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-600">
                Eine Einladungs-E-Mail wird an {email} gesendet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sonstiges */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Sonstiges</h3>

        {/* Aktiv */}
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={aktiv}
              onChange={(e) => setAktiv(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Aktives Mitglied
            </span>
          </label>
        </div>

        {/* Notizen */}
        <div>
          <label
            htmlFor="notizen"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Notizen
          </label>
          <textarea
            id="notizen"
            rows={3}
            value={notizen}
            onChange={(e) => setNotizen(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          {mode === 'edit' && person?.aktiv && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Deaktivieren
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/mitglieder')}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </form>
  )
}
