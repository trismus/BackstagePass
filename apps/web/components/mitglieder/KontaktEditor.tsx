'use client'

import { useState } from 'react'
import type {
  TelefonNummer,
  TelefonTyp,
  BevorzugteKontaktart,
  SocialMedia,
} from '@/lib/supabase/types'
import { TELEFON_TYP_LABELS, KONTAKTART_LABELS } from '@/lib/supabase/types'

interface KontaktEditorProps {
  email: string
  telefon: string
  telefonNummern: TelefonNummer[]
  bevorzugteKontaktart: BevorzugteKontaktart | null
  socialMedia: SocialMedia | null
  kontaktNotizen: string
  onChange: (data: {
    telefon: string
    telefonNummern: TelefonNummer[]
    bevorzugteKontaktart: BevorzugteKontaktart | null
    socialMedia: SocialMedia | null
    kontaktNotizen: string
  }) => void
  readOnly?: boolean
}

export function KontaktEditor({
  email,
  telefon,
  telefonNummern,
  bevorzugteKontaktart,
  socialMedia,
  kontaktNotizen,
  onChange,
  readOnly = false,
}: KontaktEditorProps) {
  const [showAddPhone, setShowAddPhone] = useState(false)
  const [newPhoneTyp, setNewPhoneTyp] = useState<TelefonTyp>('mobil')
  const [newPhoneNummer, setNewPhoneNummer] = useState('')

  const handleAddPhone = () => {
    if (!newPhoneNummer.trim()) return

    const newPhone: TelefonNummer = {
      typ: newPhoneTyp,
      nummer: newPhoneNummer.trim(),
      ist_bevorzugt: telefonNummern.length === 0, // First one is preferred
    }

    onChange({
      telefon,
      telefonNummern: [...telefonNummern, newPhone],
      bevorzugteKontaktart,
      socialMedia,
      kontaktNotizen,
    })

    setNewPhoneNummer('')
    setShowAddPhone(false)
  }

  const handleRemovePhone = (index: number) => {
    const updated = telefonNummern.filter((_, i) => i !== index)
    // If we removed the preferred one, make first one preferred
    if (telefonNummern[index]?.ist_bevorzugt && updated.length > 0) {
      updated[0].ist_bevorzugt = true
    }
    onChange({
      telefon,
      telefonNummern: updated,
      bevorzugteKontaktart,
      socialMedia,
      kontaktNotizen,
    })
  }

  const handleSetPreferred = (index: number) => {
    const updated = telefonNummern.map((p, i) => ({
      ...p,
      ist_bevorzugt: i === index,
    }))
    onChange({
      telefon,
      telefonNummern: updated,
      bevorzugteKontaktart,
      socialMedia,
      kontaktNotizen,
    })
  }

  const handleSocialMediaChange = (platform: keyof SocialMedia, value: string) => {
    const updated = {
      ...(socialMedia || {}),
      [platform]: value || undefined,
    }
    // Remove empty values
    Object.keys(updated).forEach((key) => {
      if (!updated[key as keyof SocialMedia]) {
        delete updated[key as keyof SocialMedia]
      }
    })
    onChange({
      telefon,
      telefonNummern,
      bevorzugteKontaktart,
      socialMedia: Object.keys(updated).length > 0 ? updated : null,
      kontaktNotizen,
    })
  }

  return (
    <div className="space-y-6">
      {/* Primary Contact Info */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-neutral-700">Hauptkontakt</h4>

        {/* Email Display (read-only, managed separately) */}
        <div>
          <label className="mb-1 block text-sm text-neutral-600">E-Mail</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-900">{email || '-'}</span>
            {email && (
              <a
                href={`mailto:${email}`}
                className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-200"
              >
                E-Mail senden
              </a>
            )}
          </div>
        </div>

        {/* Primary Phone */}
        <div>
          <label
            htmlFor="telefon"
            className="mb-1 block text-sm text-neutral-600"
          >
            Haupttelefon
          </label>
          <div className="flex items-center gap-2">
            <input
              type="tel"
              id="telefon"
              value={telefon}
              onChange={(e) =>
                onChange({
                  telefon: e.target.value,
                  telefonNummern,
                  bevorzugteKontaktart,
                  socialMedia,
                  kontaktNotizen,
                })
              }
              disabled={readOnly}
              placeholder="+41 79 123 45 67"
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100"
            />
            {telefon && (
              <a
                href={`tel:${telefon}`}
                className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200"
              >
                Anrufen
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Additional Phone Numbers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-neutral-700">
            Weitere Telefonnummern
          </h4>
          {!readOnly && !showAddPhone && (
            <button
              type="button"
              onClick={() => setShowAddPhone(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Hinzufügen
            </button>
          )}
        </div>

        {/* Existing Phone Numbers */}
        {telefonNummern.length > 0 ? (
          <div className="space-y-2">
            {telefonNummern.map((phone, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                    {TELEFON_TYP_LABELS[phone.typ]}
                  </span>
                  <span className="text-sm text-neutral-900">{phone.nummer}</span>
                  {phone.ist_bevorzugt && (
                    <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">
                      Bevorzugt
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${phone.nummer}`}
                    className="text-xs text-green-600 hover:text-green-800"
                  >
                    Anrufen
                  </a>
                  <a
                    href={`https://wa.me/${phone.nummer.replace(/\s/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-800"
                  >
                    WhatsApp
                  </a>
                  {!readOnly && (
                    <>
                      {!phone.ist_bevorzugt && (
                        <button
                          type="button"
                          onClick={() => handleSetPreferred(index)}
                          className="text-xs text-neutral-500 hover:text-neutral-700"
                        >
                          Als bevorzugt
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhone(index)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Entfernen
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Keine weiteren Telefonnummern
          </p>
        )}

        {/* Add Phone Form */}
        {showAddPhone && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-end gap-2">
              <div>
                <label
                  htmlFor="newPhoneTyp"
                  className="mb-1 block text-xs text-neutral-600"
                >
                  Typ
                </label>
                <select
                  id="newPhoneTyp"
                  value={newPhoneTyp}
                  onChange={(e) => setNewPhoneTyp(e.target.value as TelefonTyp)}
                  className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
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
                <label
                  htmlFor="newPhoneNummer"
                  className="mb-1 block text-xs text-neutral-600"
                >
                  Nummer
                </label>
                <input
                  type="tel"
                  id="newPhoneNummer"
                  value={newPhoneNummer}
                  onChange={(e) => setNewPhoneNummer(e.target.value)}
                  placeholder="+41 79 123 45 67"
                  className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPhone}
                disabled={!newPhoneNummer.trim()}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400"
              >
                Hinzufügen
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddPhone(false)
                  setNewPhoneNummer('')
                }}
                className="px-2 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preferred Contact Method */}
      <div>
        <label
          htmlFor="bevorzugteKontaktart"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Bevorzugte Kontaktart
        </label>
        <select
          id="bevorzugteKontaktart"
          value={bevorzugteKontaktart || ''}
          onChange={(e) =>
            onChange({
              telefon,
              telefonNummern,
              bevorzugteKontaktart:
                (e.target.value as BevorzugteKontaktart) || null,
              socialMedia,
              kontaktNotizen,
            })
          }
          disabled={readOnly}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100"
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

      {/* Contact Notes */}
      <div>
        <label
          htmlFor="kontaktNotizen"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Kontakt-Hinweise
        </label>
        <textarea
          id="kontaktNotizen"
          value={kontaktNotizen}
          onChange={(e) =>
            onChange({
              telefon,
              telefonNummern,
              bevorzugteKontaktart,
              socialMedia,
              kontaktNotizen: e.target.value,
            })
          }
          disabled={readOnly}
          rows={2}
          placeholder="z.B. Nicht vor 10 Uhr anrufen, am besten per WhatsApp erreichbar"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100"
        />
      </div>

      {/* Social Media */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-neutral-700">
          Social Media (optional)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="instagram"
              className="mb-1 block text-xs text-neutral-600"
            >
              Instagram
            </label>
            <input
              type="text"
              id="instagram"
              value={socialMedia?.instagram || ''}
              onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
              disabled={readOnly}
              placeholder="@username"
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100"
            />
          </div>
          <div>
            <label
              htmlFor="facebook"
              className="mb-1 block text-xs text-neutral-600"
            >
              Facebook
            </label>
            <input
              type="text"
              id="facebook"
              value={socialMedia?.facebook || ''}
              onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
              disabled={readOnly}
              placeholder="URL oder Name"
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100"
            />
          </div>
          <div>
            <label
              htmlFor="linkedin"
              className="mb-1 block text-xs text-neutral-600"
            >
              LinkedIn
            </label>
            <input
              type="text"
              id="linkedin"
              value={socialMedia?.linkedin || ''}
              onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
              disabled={readOnly}
              placeholder="URL"
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100"
            />
          </div>
          <div>
            <label
              htmlFor="twitter"
              className="mb-1 block text-xs text-neutral-600"
            >
              X / Twitter
            </label>
            <input
              type="text"
              id="twitter"
              value={socialMedia?.twitter || ''}
              onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
              disabled={readOnly}
              placeholder="@username"
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
