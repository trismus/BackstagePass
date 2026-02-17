'use client'

import { useState } from 'react'
import { HandlungsbedarfCard } from '@/components/dashboard/HandlungsbedarfCard'
import type {
  ProduktionDashboardData,
  BesetzungsFortschritt,
  SchichtAbdeckungProAuffuehrung,
  ProbenDashboardStats,
  DashboardWarnung,
  RollenTyp,
} from '@/lib/supabase/types'
import { AUFFUEHRUNG_TYP_LABELS } from '@/lib/supabase/types'

const ROLLEN_TYP_LABELS: Record<RollenTyp, string> = {
  hauptrolle: 'Hauptrollen',
  nebenrolle: 'Nebenrollen',
  ensemble: 'Ensemble',
  statisterie: 'Statisterie',
}

interface ProduktionDashboardSectionProps {
  data: ProduktionDashboardData
}

export function ProduktionDashboardSection({ data }: ProduktionDashboardSectionProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Dashboard
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BesetzungsFortschrittCard besetzung={data.besetzung} />
        <WarnungenCard warnungen={data.warnungen} />
        <SchichtAbdeckungCard abdeckung={data.schichtAbdeckung} />
        <ProbenStatistikCard proben={data.proben} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BesetzungsFortschrittCard
// ---------------------------------------------------------------------------

function BesetzungsFortschrittCard({ besetzung }: { besetzung: BesetzungsFortschritt }) {
  if (besetzung.totalRollen === 0) {
    return (
      <DashboardCard titel="Besetzung">
        <p className="text-sm text-gray-500">Kein Stück verknüpft oder keine Rollen definiert.</p>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard titel="Besetzung">
      <ProgressBar value={besetzung.progressProzent} />
      <p className="mt-1 text-xs text-gray-500">
        {besetzung.besetztRollen} von {besetzung.totalRollen} Rollen besetzt
        {besetzung.vorgemerktRollen > 0 && ` (${besetzung.vorgemerktRollen} vorgemerkt)`}
      </p>
      {besetzung.nachTyp.length > 0 && (
        <div className="mt-3 space-y-1">
          {besetzung.nachTyp.map(({ typ, besetzt, total }) => (
            <div key={typ} className="flex items-center justify-between text-xs text-gray-600">
              <span>{ROLLEN_TYP_LABELS[typ]}</span>
              <span className="font-medium">{besetzt}/{total}</span>
            </div>
          ))}
        </div>
      )}
      {besetzung.unbesetzteHauptrollen.length > 0 && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-2 py-1.5">
          <p className="text-xs font-medium text-red-800">
            Unbesetzte Hauptrollen: {besetzung.unbesetzteHauptrollen.join(', ')}
          </p>
        </div>
      )}
    </DashboardCard>
  )
}

// ---------------------------------------------------------------------------
// WarnungenCard
// ---------------------------------------------------------------------------

function WarnungenCard({ warnungen }: { warnungen: DashboardWarnung[] }) {
  if (warnungen.length === 0) {
    return (
      <DashboardCard titel="Handlungsbedarf">
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-800">Alles im grünen Bereich.</p>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard titel="Handlungsbedarf">
      <div className="space-y-2">
        {warnungen.map((w, i) => (
          <HandlungsbedarfCard
            key={i}
            prioritaet={w.typ === 'kritisch' ? 'kritisch' : w.typ === 'warnung' ? 'warnung' : 'info'}
            titel={w.titel}
            beschreibung={w.beschreibung}
          />
        ))}
      </div>
    </DashboardCard>
  )
}

// ---------------------------------------------------------------------------
// SchichtAbdeckungCard
// ---------------------------------------------------------------------------

function SchichtAbdeckungCard({ abdeckung }: { abdeckung: SchichtAbdeckungProAuffuehrung[] }) {
  if (abdeckung.length === 0) {
    return (
      <DashboardCard titel="Schichtabdeckung">
        <p className="text-sm text-gray-500">Keine Aufführungen vorhanden.</p>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard titel="Schichtabdeckung">
      <div className="space-y-2">
        {abdeckung.map((a) => (
          <div key={a.serienauffuehrungId} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-gray-600 truncate">
                {new Date(a.datum).toLocaleDateString('de-CH')}
              </span>
              <span className="inline-flex shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                {AUFFUEHRUNG_TYP_LABELS[a.typ]}
              </span>
            </div>
            {!a.hatVeranstaltung ? (
              <span className="shrink-0 text-xs text-gray-400">Nicht publiziert</span>
            ) : a.totalBenoetigt === 0 ? (
              <span className="shrink-0 text-xs text-gray-400">Keine Schichten</span>
            ) : (
              <span className={`shrink-0 text-xs font-medium ${
                a.abdeckungProzent >= 100 ? 'text-green-700' :
                a.abdeckungProzent >= 80 ? 'text-amber-700' :
                'text-red-700'
              }`}>
                {a.totalZugewiesen}/{a.totalBenoetigt}
              </span>
            )}
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

// ---------------------------------------------------------------------------
// ProbenStatistikCard
// ---------------------------------------------------------------------------

function ProbenStatistikCard({ proben }: { proben: ProbenDashboardStats }) {
  const [expanded, setExpanded] = useState(false)

  if (proben.total === 0) {
    return (
      <DashboardCard titel="Proben">
        <p className="text-sm text-gray-500">Noch keine Proben geplant.</p>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard titel="Proben">
      <ProgressBar value={proben.progressProzent} />
      <p className="mt-1 text-xs text-gray-500">
        {proben.abgeschlossen} von {proben.total} Proben abgeschlossen
      </p>
      <div className="mt-2 flex gap-3 text-xs text-gray-600">
        <span>Geplant: {proben.geplant}</span>
        {proben.abgesagt > 0 && <span>Abgesagt: {proben.abgesagt}</span>}
      </div>

      {proben.anwesenheiten.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            {expanded ? 'Anwesenheit ausblenden' : 'Anwesenheit einblenden'}
          </button>
          {expanded && (
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {[...proben.anwesenheiten]
                .sort((a, b) => a.personName.localeCompare(b.personName))
                .map((a) => (
                  <div key={a.personId} className="flex items-center justify-between text-xs text-gray-600">
                    <span className="truncate">{a.personName}</span>
                    <span className={`shrink-0 font-medium ${
                      a.anwesenheitsquote >= 80 ? 'text-green-700' :
                      a.anwesenheitsquote >= 50 ? 'text-amber-700' :
                      'text-red-700'
                    }`}>
                      {a.anwesenheitsquote}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  )
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function DashboardCard({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{titel}</h3>
      {children}
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className={`h-full rounded-full transition-all ${
          value >= 100 ? 'bg-green-500' :
          value >= 60 ? 'bg-primary-500' :
          value >= 30 ? 'bg-amber-500' :
          'bg-red-500'
        }`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}
