'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import {
  completeOnboarding,
  skipOnboarding,
} from '@/lib/actions/onboarding'
import type { OnboardingProfileData } from '@/lib/validations/onboarding'

interface OnboardingWizardProps {
  displayName: string | null
  vorname: string | null
  initialData: {
    telefon: string | null
    notfallkontakt_name: string | null
    notfallkontakt_telefon: string | null
    notfallkontakt_beziehung: string | null
    skills: string[]
  } | null
  startPage: string
}

export function OnboardingWizard({
  displayName,
  vorname,
  initialData,
  startPage,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [telefon, setTelefon] = useState(initialData?.telefon ?? '')
  const [notfallkontaktName, setNotfallkontaktName] = useState(
    initialData?.notfallkontakt_name ?? ''
  )
  const [notfallkontaktTelefon, setNotfallkontaktTelefon] = useState(
    initialData?.notfallkontakt_telefon ?? ''
  )
  const [notfallkontaktBeziehung, setNotfallkontaktBeziehung] = useState(
    initialData?.notfallkontakt_beziehung ?? ''
  )
  const [skills, setSkills] = useState<string[]>(initialData?.skills ?? [])

  const greetingName = vorname || displayName || ''

  async function handleSkip() {
    setLoading(true)
    setError(null)
    const result = await skipOnboarding()
    if (result.success) {
      router.push(startPage as never)
    } else {
      setError(result.error ?? 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  async function handleComplete() {
    setLoading(true)
    setError(null)

    const data: OnboardingProfileData = {
      telefon: telefon || null,
      notfallkontakt_name: notfallkontaktName || null,
      notfallkontakt_telefon: notfallkontaktTelefon || null,
      notfallkontakt_beziehung: notfallkontaktBeziehung || null,
      skills: skills.length > 0 ? skills : undefined,
    }

    const result = await completeOnboarding(data)
    if (result.success) {
      router.push(startPage as never)
    } else {
      setError(result.error ?? 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            step >= 1 ? 'bg-primary-600' : 'bg-neutral-300'
          }`}
        />
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            step >= 2 ? 'bg-primary-600' : 'bg-neutral-300'
          }`}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h1 className="mb-4 text-2xl font-semibold text-neutral-900">
            Willkommen bei BackstagePass
            {greetingName ? `, ${greetingName}` : ''}!
          </h1>
          <p className="mb-4 text-neutral-600">
            Schön, dass du dabei bist! BackstagePass ist das Verwaltungssystem
            der Theatergruppe Widen. Hier kannst du deine Einsätze verwalten,
            dich für Veranstaltungen anmelden und vieles mehr.
          </p>
          <p className="mb-6 text-neutral-600">
            Im nächsten Schritt kannst du optional dein Profil vervollständigen.
            Alle Angaben sind freiwillig und können auch später jederzeit
            geändert werden.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              disabled={loading}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              Profil vervollständigen
            </button>
            <button
              onClick={handleSkip}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            >
              {loading ? 'Wird geladen...' : 'Überspringen'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Profil vervollständigen
          </h2>
          <p className="mb-6 text-sm text-neutral-500">
            Alle Angaben sind freiwillig.
          </p>

          <div className="space-y-4">
            <Input
              label="Telefon"
              type="tel"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder="+41 79 123 45 67"
            />

            <div className="border-t border-neutral-100 pt-4">
              <h3 className="mb-3 text-sm font-medium text-neutral-700">
                Notfallkontakt
              </h3>
              <div className="space-y-3">
                <Input
                  label="Name"
                  value={notfallkontaktName}
                  onChange={(e) => setNotfallkontaktName(e.target.value)}
                />
                <Input
                  label="Telefon"
                  type="tel"
                  value={notfallkontaktTelefon}
                  onChange={(e) => setNotfallkontaktTelefon(e.target.value)}
                  placeholder="+41 79 123 45 67"
                />
                <Input
                  label="Beziehung"
                  value={notfallkontaktBeziehung}
                  onChange={(e) => setNotfallkontaktBeziehung(e.target.value)}
                  placeholder="z.B. Partner/in, Elternteil"
                />
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <TagInput
                label="Fähigkeiten / Skills"
                value={skills}
                onChange={setSkills}
                placeholder="z.B. Beleuchtung, Bühnenbau, Maske..."
                helperText="Drücke Enter oder Komma zum Hinzufügen"
                maxTags={20}
                maxTagLength={50}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleComplete}
              disabled={loading}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Wird gespeichert...' : 'Speichern & Weiter'}
            </button>
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            >
              Zurück
            </button>
            <button
              onClick={handleSkip}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            >
              Überspringen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
