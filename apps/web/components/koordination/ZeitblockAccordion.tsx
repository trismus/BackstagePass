'use client'

import { useState } from 'react'
import type { ZeitblockMitSchichten } from '@/lib/actions/koordination'
import { SchichtDetailCard } from './SchichtDetailCard'

interface ZeitblockAccordionProps {
  zeitbloecke: ZeitblockMitSchichten[]
  onAssign: (schichtId: string) => void
  onRemoveHelfer: (zuweisungId: string, helferName: string) => void
}

export function ZeitblockAccordion({
  zeitbloecke,
  onAssign,
  onRemoveHelfer,
}: ZeitblockAccordionProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(
    new Set(zeitbloecke.map((zb) => zb.id))
  )

  const toggleBlock = (id: string) => {
    const newExpanded = new Set(expandedBlocks)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedBlocks(newExpanded)
  }

  const formatTime = (time: string) => time.slice(0, 5)

  const getAuslastungColor = (gesamtSlots: number, besetztSlots: number) => {
    if (gesamtSlots === 0) return 'bg-gray-200'
    const prozent = (besetztSlots / gesamtSlots) * 100
    if (prozent >= 100) return 'bg-green-500'
    if (prozent >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getAuslastungBgColor = (gesamtSlots: number, besetztSlots: number) => {
    if (gesamtSlots === 0) return 'bg-gray-100'
    const prozent = (besetztSlots / gesamtSlots) * 100
    if (prozent >= 100) return 'bg-green-50'
    if (prozent >= 50) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  return (
    <div className="space-y-4">
      {zeitbloecke.map((zb) => {
        const isExpanded = expandedBlocks.has(zb.id)
        const auslastungProzent = zb.gesamtSlots > 0
          ? Math.round((zb.besetztSlots / zb.gesamtSlots) * 100)
          : 0

        return (
          <div
            key={zb.id}
            className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
          >
            {/* Header */}
            <button
              onClick={() => toggleBlock(zb.id)}
              className={`flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-neutral-50 ${getAuslastungBgColor(zb.gesamtSlots, zb.besetztSlots)}`}
            >
              <div className="flex items-center gap-4">
                {/* Expand/Collapse Icon */}
                <svg
                  className={`h-5 w-5 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>

                <div>
                  <h3 className="font-semibold text-neutral-900">{zb.name}</h3>
                  <p className="text-sm text-neutral-500">
                    {formatTime(zb.startzeit)} - {formatTime(zb.endzeit)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Progress Bar */}
                <div className="w-32">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">
                      {zb.besetztSlots}/{zb.gesamtSlots}
                    </span>
                    <span className="font-medium text-neutral-900">
                      {auslastungProzent}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className={`h-full transition-all ${getAuslastungColor(zb.gesamtSlots, zb.besetztSlots)}`}
                      style={{ width: `${Math.min(auslastungProzent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Schichten Count */}
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-sm text-neutral-600">
                  {zb.schichten.length} Schichten
                </span>
              </div>
            </button>

            {/* Content */}
            {isExpanded && (
              <div className="border-t border-neutral-200 p-4">
                <div className="space-y-3">
                  {zb.schichten.map((schicht) => (
                    <SchichtDetailCard
                      key={schicht.id}
                      schicht={schicht}
                      onAssign={() => onAssign(schicht.id)}
                      onRemoveHelfer={onRemoveHelfer}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
