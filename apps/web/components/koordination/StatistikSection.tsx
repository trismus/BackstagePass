'use client'

import { useState, useEffect } from 'react'
import { getHelferStatistik } from '@/lib/actions/helfer-statistiken'
import type { HelferStatistik, ZeitblockAuslastung, KritischeSchicht, TopHelfer } from '@/lib/actions/helfer-statistiken'

interface StatistikSectionProps {
  veranstaltungId: string
}

export function StatistikSection({ veranstaltungId }: StatistikSectionProps) {
  const [statistik, setStatistik] = useState<HelferStatistik | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const data = await getHelferStatistik(veranstaltungId)
        setStatistik(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [veranstaltungId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="h-8 w-8 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!statistik) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center text-neutral-500">
        Statistiken konnten nicht geladen werden.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-neutral-900">Statistiken</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Zeitblock Auslastung */}
        <ZeitblockAuslastungCard zeitbloecke={statistik.zeitblockAuslastung} />

        {/* Kritische Schichten */}
        <KritischeSchichtenCard schichten={statistik.kritischeSchichten} />

        {/* Top Helfer */}
        <TopHelferCard helfer={statistik.topHelfer} />
      </div>

      {/* Anmeldungstrend */}
      {statistik.anmeldungsTrend.length > 0 && (
        <AnmeldungsTrendCard trend={statistik.anmeldungsTrend} />
      )}
    </div>
  )
}

function ZeitblockAuslastungCard({ zeitbloecke }: { zeitbloecke: ZeitblockAuslastung[] }) {
  // Sort by auslastung (lowest first to highlight problem areas)
  const sorted = [...zeitbloecke].sort((a, b) => a.auslastungProzent - b.auslastungProzent)

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="font-medium text-neutral-900">Zeitblock-Auslastung</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Sortiert nach niedrigster Auslastung
      </p>

      <div className="mt-4 space-y-3">
        {sorted.map((zb) => (
          <div key={zb.id}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">{zb.name}</span>
              <span className={`font-medium ${
                zb.auslastungProzent >= 80 ? 'text-green-600' :
                zb.auslastungProzent >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {zb.auslastungProzent}%
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className={`h-full ${
                  zb.auslastungProzent >= 80 ? 'bg-green-500' :
                  zb.auslastungProzent >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(zb.auslastungProzent, 100)}%` }}
              />
            </div>
            <p className="mt-0.5 text-xs text-neutral-400">
              {zb.besetztSlots}/{zb.gesamtSlots} Slots
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function KritischeSchichtenCard({ schichten }: { schichten: KritischeSchicht[] }) {
  if (schichten.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h3 className="font-medium text-green-900">Keine kritischen Schichten</h3>
        <p className="mt-1 text-sm text-green-700">
          Alle Schichten sind mindestens zu 50% besetzt.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h3 className="font-medium text-red-900">Kritische Schichten</h3>
      <p className="mt-1 text-sm text-red-700">
        Schichten mit weniger als 50% Besetzung
      </p>

      <div className="mt-4 space-y-2">
        {schichten.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded bg-white px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900">{s.rolle}</p>
              {s.zeitblockName && (
                <p className="text-xs text-neutral-500">
                  {s.zeitblockName}
                  {s.startzeit && ` (${s.startzeit.slice(0, 5)} - ${s.endzeit?.slice(0, 5)})`}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                s.auslastungProzent < 30 ? 'text-red-600' : 'text-orange-600'
              }`}>
                {s.auslastungProzent}%
              </p>
              <p className="text-xs text-neutral-500">
                {s.besetzt}/{s.benoetigt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopHelferCard({ helfer }: { helfer: TopHelfer[] }) {
  if (helfer.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="font-medium text-neutral-900">Top-Helfer</h3>
        <p className="mt-2 text-sm text-neutral-500">
          Noch keine Helfer angemeldet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="font-medium text-neutral-900">Top-Helfer</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Helfer mit den meisten Schichten
      </p>

      <div className="mt-4 space-y-2">
        {helfer.map((h, index) => (
          <div
            key={h.id}
            className="flex items-center justify-between rounded bg-neutral-50 px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-neutral-200 text-neutral-700' :
                index === 2 ? 'bg-orange-100 text-orange-800' :
                'bg-neutral-100 text-neutral-600'
              }`}>
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-900">{h.name}</p>
                {h.email && (
                  <p className="text-xs text-neutral-500">{h.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-primary-600">
                {h.anzahlSchichten}
              </span>
              <span className="text-xs text-neutral-500">Schichten</span>
              {h.anzahlSchichten >= 3 && (
                <span className="ml-1 rounded bg-primary-100 px-1.5 py-0.5 text-xs text-primary-700">
                  Top
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnmeldungsTrendCard({ trend }: { trend: { datum: string; anzahl: number; kumuliert: number }[] }) {
  const maxKumuliert = Math.max(...trend.map((t) => t.kumuliert))

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="font-medium text-neutral-900">Anmeldungsverlauf</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Kumulierte Anmeldungen ueber Zeit
      </p>

      <div className="mt-4">
        <div className="flex h-32 items-end gap-1">
          {trend.map((t) => (
            <div
              key={t.datum}
              className="flex-1 group relative"
              title={`${new Date(t.datum).toLocaleDateString('de-CH')}: ${t.kumuliert} Anmeldungen`}
            >
              <div
                className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600"
                style={{ height: `${(t.kumuliert / maxKumuliert) * 100}%`, minHeight: '4px' }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden rounded bg-neutral-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap">
                {new Date(t.datum).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}: {t.kumuliert}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-neutral-500">
          <span>{new Date(trend[0].datum).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}</span>
          <span>{new Date(trend[trend.length - 1].datum).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}</span>
        </div>
      </div>
    </div>
  )
}
