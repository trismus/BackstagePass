'use client'

import { useState } from 'react'
import type { PersonEngagements } from '@/lib/supabase/types'

type TabKey = 'uebersicht' | 'produktionen' | 'auffuehrungen' | 'proben' | 'helfer'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'uebersicht', label: 'Übersicht' },
  { key: 'produktionen', label: 'Produktionen' },
  { key: 'auffuehrungen', label: 'Aufführungen' },
  { key: 'proben', label: 'Proben' },
  { key: 'helfer', label: 'Helfereinsätze' },
]

interface PersonEngagementHistoryProps {
  engagements: PersonEngagements
}

export function PersonEngagementHistory({ engagements }: PersonEngagementHistoryProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('uebersicht')

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex overflow-x-auto px-4" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'uebersicht' && <UebersichtTab engagements={engagements} />}
        {activeTab === 'produktionen' && <ProduktionenTab engagements={engagements} />}
        {activeTab === 'auffuehrungen' && <AuffuehrungenTab engagements={engagements} />}
        {activeTab === 'proben' && <ProbenTab engagements={engagements} />}
        {activeTab === 'helfer' && <HelferTab engagements={engagements} />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Übersicht
// ---------------------------------------------------------------------------

function UebersichtTab({ engagements }: { engagements: PersonEngagements }) {
  const { statistik } = engagements

  const cards = [
    { label: 'Produktionen', value: statistik.totalProduktionen },
    { label: 'Stück-Besetzungen', value: statistik.totalStueckBesetzungen },
    { label: 'Aufführungen', value: statistik.totalAuffuehrungen },
    { label: 'Proben', value: statistik.totalProben },
    { label: 'Proben-Anwesenheit', value: `${statistik.probenAnwesenheitsquote}%` },
    { label: 'Helfereinsätze', value: statistik.totalHelferEinsaetze },
  ]

  if (cards.every((c) => c.value === 0 || c.value === '0%')) {
    return <EmptyState text="Keine Engagements vorhanden." />
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          <p className="text-xs text-gray-500">{card.label}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Produktionen (Besetzungen + Stab)
// ---------------------------------------------------------------------------

function ProduktionenTab({ engagements }: { engagements: PersonEngagements }) {
  const items = [
    ...engagements.produktionsBesetzungen.map((b) => ({
      key: `besetzung-${b.besetzungId}`,
      titel: b.produktionTitel,
      detail: `${b.rolleName} (${b.besetzungTyp === 'hauptbesetzung' ? 'Haupt' : b.besetzungTyp === 'zweitbesetzung' ? 'Zweit' : 'Ersatz'})`,
      status: b.besetzungStatus,
      badge: b.produktionStatus,
      sortKey: b.produktionTitel,
    })),
    ...engagements.produktionsStab.map((s) => ({
      key: `stab-${s.stabId}`,
      titel: s.produktionTitel,
      detail: `${s.funktion}${s.istLeitung ? ' (Leitung)' : ''}`,
      status: 'stab' as const,
      badge: s.produktionStatus,
      sortKey: s.produktionTitel,
    })),
    ...engagements.stueckBesetzungen.map((b) => ({
      key: `stueck-${b.besetzungId}`,
      titel: b.stueckTitel,
      detail: `${b.rolleName} — ${ROLLEN_TYP_LABELS[b.rolleTyp]}`,
      status: 'besetzt' as const,
      badge: 'stueck' as const,
      sortKey: b.stueckTitel,
    })),
  ]

  if (items.length === 0) return <EmptyState text="Keine Produktions-Engagements." />

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">{item.titel}</p>
            <p className="text-xs text-gray-500">{item.detail}</p>
          </div>
          <StatusBadge status={item.badge} />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Aufführungen
// ---------------------------------------------------------------------------

function AuffuehrungenTab({ engagements }: { engagements: PersonEngagements }) {
  const items = [...engagements.auffuehrungsZuweisungen]
    .sort((a, b) => b.veranstaltungDatum.localeCompare(a.veranstaltungDatum))

  if (items.length === 0) return <EmptyState text="Keine Aufführungs-Zuweisungen." />

  return (
    <div className="space-y-2">
      {items.map((z) => (
        <div key={z.zuweisungId} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {z.veranstaltungTitel || formatDate(z.veranstaltungDatum)}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(z.veranstaltungDatum)} — {z.schichtRolle}
              {z.zeitblockName && ` (${z.zeitblockName})`}
            </p>
          </div>
          <StatusBadge status={z.status} />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Proben
// ---------------------------------------------------------------------------

function ProbenTab({ engagements }: { engagements: PersonEngagements }) {
  const items = [...engagements.probenTeilnahmen]
    .sort((a, b) => b.probeDatum.localeCompare(a.probeDatum))

  if (items.length === 0) return <EmptyState text="Keine Proben-Teilnahmen." />

  return (
    <div className="space-y-2">
      {items.map((t) => (
        <div key={t.teilnehmerId} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">{t.probeTitel}</p>
            <p className="text-xs text-gray-500">
              {formatDate(t.probeDatum)} — {t.stueckTitel}
            </p>
          </div>
          <StatusBadge status={t.status} />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helfereinsätze
// ---------------------------------------------------------------------------

function HelferTab({ engagements }: { engagements: PersonEngagements }) {
  const items = [...engagements.helferAnmeldungen]
    .sort((a, b) => b.eventDatum.localeCompare(a.eventDatum))

  if (items.length === 0) return <EmptyState text="Keine Helfereinsätze." />

  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.anmeldungId} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">{a.eventName}</p>
            <p className="text-xs text-gray-500">
              {formatDate(a.eventDatum)} — {a.rollenName}
            </p>
          </div>
          <StatusBadge status={a.status} />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const ROLLEN_TYP_LABELS: Record<string, string> = {
  hauptrolle: 'Hauptrolle',
  nebenrolle: 'Nebenrolle',
  ensemble: 'Ensemble',
  statisterie: 'Statisterie',
}

const STATUS_COLORS: Record<string, string> = {
  // Zuweisungen
  vorgeschlagen: 'bg-blue-100 text-blue-700',
  zugesagt: 'bg-green-100 text-green-700',
  abgesagt: 'bg-red-100 text-red-700',
  erschienen: 'bg-green-100 text-green-700',
  nicht_erschienen: 'bg-red-100 text-red-700',
  // Proben
  eingeladen: 'bg-blue-100 text-blue-700',
  vielleicht: 'bg-amber-100 text-amber-700',
  // Besetzungen
  offen: 'bg-gray-100 text-gray-700',
  vorgemerkt: 'bg-blue-100 text-blue-700',
  besetzt: 'bg-green-100 text-green-700',
  // Helfer
  angemeldet: 'bg-blue-100 text-blue-700',
  bestaetigt: 'bg-green-100 text-green-700',
  abgelehnt: 'bg-red-100 text-red-700',
  warteliste: 'bg-amber-100 text-amber-700',
  // Produktion
  draft: 'bg-gray-100 text-gray-600',
  planung: 'bg-blue-100 text-blue-700',
  casting: 'bg-purple-100 text-purple-700',
  proben: 'bg-amber-100 text-amber-700',
  premiere: 'bg-green-100 text-green-700',
  laufend: 'bg-green-100 text-green-700',
  abgeschlossen: 'bg-gray-100 text-gray-600',
  // Other
  stab: 'bg-purple-100 text-purple-700',
  stueck: 'bg-indigo-100 text-indigo-700',
}

const STATUS_LABELS: Record<string, string> = {
  vorgeschlagen: 'Vorgeschlagen',
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
  erschienen: 'Erschienen',
  nicht_erschienen: 'Nicht erschienen',
  eingeladen: 'Eingeladen',
  vielleicht: 'Vielleicht',
  offen: 'Offen',
  vorgemerkt: 'Vorgemerkt',
  besetzt: 'Besetzt',
  angemeldet: 'Angemeldet',
  bestaetigt: 'Bestätigt',
  abgelehnt: 'Abgelehnt',
  warteliste: 'Warteliste',
  draft: 'Entwurf',
  planung: 'Planung',
  casting: 'Casting',
  proben: 'Proben',
  premiere: 'Premiere',
  laufend: 'Laufend',
  abgeschlossen: 'Abgeschlossen',
  stab: 'Stab',
  stueck: 'Stück',
}

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
      {label}
    </span>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-4 text-center text-sm text-gray-500">{text}</p>
}

function formatDate(dateStr: string) {
  if (!dateStr) return '–'
  return new Date(dateStr).toLocaleDateString('de-CH')
}
