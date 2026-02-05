'use client'

import { useState } from 'react'
import { PublicZeitblockGroup } from './PublicZeitblockGroup'
import { ExternalRegistrationForm } from './ExternalRegistrationForm'
import { SuccessScreen } from './SuccessScreen'
import type {
  PublicHelferlisteData,
  PublicSchichtData,
} from '@/lib/actions/external-registration'

interface PublicHelferlisteViewProps {
  data: PublicHelferlisteData
  token: string
}

type RegistrationState =
  | { type: 'list' }
  | { type: 'form'; schichtId: string; schichtName: string; zeitInfo?: string }
  | { type: 'success'; schichtName: string }

export function PublicHelferlisteView({ data, token }: PublicHelferlisteViewProps) {
  const [state, setState] = useState<RegistrationState>({ type: 'list' })

  const handleRegister = (schichtId: string) => {
    // Find schicht info
    let schichtInfo: { schicht: PublicSchichtData; zeitblock?: { name: string; startzeit: string; endzeit: string } } | null = null

    for (const zb of data.zeitbloecke) {
      const schicht = zb.schichten.find((s) => s.id === schichtId)
      if (schicht) {
        schichtInfo = {
          schicht,
          zeitblock: { name: zb.name, startzeit: zb.startzeit, endzeit: zb.endzeit },
        }
        break
      }
    }

    if (!schichtInfo) return

    const zeitInfo = schichtInfo.zeitblock
      ? `${schichtInfo.zeitblock.name} (${schichtInfo.zeitblock.startzeit.slice(0, 5)} - ${schichtInfo.zeitblock.endzeit.slice(0, 5)} Uhr)`
      : undefined

    setState({
      type: 'form',
      schichtId,
      schichtName: schichtInfo.schicht.rolle,
      zeitInfo,
    })
  }

  const handleSuccess = () => {
    if (state.type !== 'form') return
    setState({ type: 'success', schichtName: state.schichtName })
  }

  const handleClose = () => {
    setState({ type: 'list' })
  }

  // Success screen
  if (state.type === 'success') {
    return (
      <SuccessScreen
        schichtName={state.schichtName}
        veranstaltungName={data.veranstaltung.titel}
        onRegisterMore={() => setState({ type: 'list' })}
      />
    )
  }

  // Check if there are any schichten
  const totalSchichten = data.zeitbloecke.reduce(
    (sum, zb) => sum + zb.schichten.length,
    0
  )

  if (totalSchichten === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 p-3">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          Keine Schichten verfügbar
        </h3>
        <p className="mt-2 text-gray-500">
          Derzeit sind keine öffentlichen Helferschichten für diese Veranstaltung
          verfügbar.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Info Box */}
      <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <svg
              className="h-5 w-5 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-primary-900">
              Vielen Dank für deine Unterstützung!
            </h3>
            <p className="mt-1 text-sm text-primary-700">
              Bitte melde dich nur an, wenn du sicher kommen kannst. Bei Fragen
              oder falls du kurzfristig absagen musst, kontaktiere uns bitte
              direkt.
            </p>
          </div>
        </div>
      </div>

      {/* Info Blocks */}
      {data.infoBloecke.length > 0 && (
        <div className="mb-6 space-y-4">
          {data.infoBloecke.map((info) => (
            <div
              key={info.id}
              className="rounded-xl border border-info-200 bg-info-50 p-4"
            >
              <h4 className="font-medium text-info-900">{info.titel}</h4>
              {info.beschreibung && (
                <p className="mt-1 text-sm text-info-700">{info.beschreibung}</p>
              )}
              <p className="mt-2 text-xs text-info-600">
                {info.startzeit.slice(0, 5)} - {info.endzeit.slice(0, 5)} Uhr
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Zeitbloecke with Schichten */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Verfügbare Schichten
        </h2>
        {data.zeitbloecke.map((zeitblock) => (
          <PublicZeitblockGroup
            key={zeitblock.id}
            zeitblock={zeitblock}
            onRegister={handleRegister}
          />
        ))}
      </div>

      {/* Registration Form Modal */}
      {state.type === 'form' && (
        <ExternalRegistrationForm
          token={token}
          schichtId={state.schichtId}
          schichtName={state.schichtName}
          zeitInfo={state.zeitInfo}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
