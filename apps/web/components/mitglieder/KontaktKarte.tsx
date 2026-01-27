'use client'

import type { Person } from '@/lib/supabase/types'
import { TELEFON_TYP_LABELS, KONTAKTART_LABELS } from '@/lib/supabase/types'

interface KontaktKarteProps {
  person: Pick<
    Person,
    | 'vorname'
    | 'nachname'
    | 'email'
    | 'telefon'
    | 'telefon_nummern'
    | 'bevorzugte_kontaktart'
    | 'kontakt_notizen'
    | 'social_media'
  >
  showAllPhones?: boolean
  compact?: boolean
}

// Icons as inline SVGs
const PhoneIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
)

const EmailIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
)

const WhatsAppIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

export function KontaktKarte({
  person,
  showAllPhones = false,
  compact = false,
}: KontaktKarteProps) {
  // Get preferred phone
  const preferredPhone =
    person.telefon_nummern?.find((p) => p.ist_bevorzugt) ||
    person.telefon_nummern?.[0]

  const primaryPhone = person.telefon || preferredPhone?.nummer

  // Format phone for links (remove spaces)
  const formatPhoneForLink = (phone: string) => phone.replace(/\s/g, '')

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {person.email && (
          <a
            href={`mailto:${person.email}`}
            title={`E-Mail an ${person.vorname}`}
            className="rounded-full bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
          >
            <EmailIcon />
          </a>
        )}
        {primaryPhone && (
          <>
            <a
              href={`tel:${formatPhoneForLink(primaryPhone)}`}
              title={`${person.vorname} anrufen`}
              className="rounded-full bg-green-100 p-2 text-green-600 hover:bg-green-200"
            >
              <PhoneIcon />
            </a>
            <a
              href={`https://wa.me/${formatPhoneForLink(primaryPhone)}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`WhatsApp an ${person.vorname}`}
              className="rounded-full bg-green-100 p-2 text-green-600 hover:bg-green-200"
            >
              <WhatsAppIcon />
            </a>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-700">Kontakt</h4>
        {person.bevorzugte_kontaktart && (
          <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
            Bevorzugt: {KONTAKTART_LABELS[person.bevorzugte_kontaktart]}
          </span>
        )}
      </div>

      {/* Contact Notes */}
      {person.kontakt_notizen && (
        <div className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
          {person.kontakt_notizen}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {person.email && (
          <a
            href={`mailto:${person.email}`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            <EmailIcon />
            E-Mail senden
          </a>
        )}
        {primaryPhone && (
          <>
            <a
              href={`tel:${formatPhoneForLink(primaryPhone)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-200"
            >
              <PhoneIcon />
              Anrufen
            </a>
            <a
              href={`https://wa.me/${formatPhoneForLink(primaryPhone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-200"
            >
              <WhatsAppIcon />
              WhatsApp
            </a>
          </>
        )}
      </div>

      {/* Contact Details */}
      <div className="space-y-2">
        {/* Email */}
        {person.email && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500">E-Mail:</span>
            <a
              href={`mailto:${person.email}`}
              className="text-blue-600 hover:underline"
            >
              {person.email}
            </a>
          </div>
        )}

        {/* Primary Phone */}
        {person.telefon && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500">Telefon:</span>
            <a
              href={`tel:${formatPhoneForLink(person.telefon)}`}
              className="text-neutral-900 hover:underline"
            >
              {person.telefon}
            </a>
          </div>
        )}

        {/* Additional Phones */}
        {showAllPhones &&
          person.telefon_nummern &&
          person.telefon_nummern.length > 0 && (
            <div className="mt-2 space-y-1">
              {person.telefon_nummern.map((phone, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-500">
                    {TELEFON_TYP_LABELS[phone.typ]}:
                  </span>
                  <a
                    href={`tel:${formatPhoneForLink(phone.nummer)}`}
                    className="text-neutral-900 hover:underline"
                  >
                    {phone.nummer}
                  </a>
                  {phone.ist_bevorzugt && (
                    <span className="text-xs text-yellow-600">(bevorzugt)</span>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Social Media */}
      {person.social_media &&
        Object.keys(person.social_media).length > 0 && (
          <div className="border-t border-neutral-200 pt-3">
            <h5 className="mb-2 text-xs font-medium text-neutral-500">
              Social Media
            </h5>
            <div className="flex flex-wrap gap-2">
              {person.social_media.instagram && (
                <a
                  href={
                    person.social_media.instagram.startsWith('http')
                      ? person.social_media.instagram
                      : `https://instagram.com/${person.social_media.instagram.replace('@', '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-pink-100 px-2 py-1 text-xs text-pink-700 hover:bg-pink-200"
                >
                  Instagram
                </a>
              )}
              {person.social_media.facebook && (
                <a
                  href={
                    person.social_media.facebook.startsWith('http')
                      ? person.social_media.facebook
                      : `https://facebook.com/${person.social_media.facebook}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
                >
                  Facebook
                </a>
              )}
              {person.social_media.linkedin && (
                <a
                  href={person.social_media.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 hover:bg-blue-200"
                >
                  LinkedIn
                </a>
              )}
              {person.social_media.twitter && (
                <a
                  href={
                    person.social_media.twitter.startsWith('http')
                      ? person.social_media.twitter
                      : `https://twitter.com/${person.social_media.twitter.replace('@', '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-200"
                >
                  X / Twitter
                </a>
              )}
            </div>
          </div>
        )}
    </div>
  )
}
