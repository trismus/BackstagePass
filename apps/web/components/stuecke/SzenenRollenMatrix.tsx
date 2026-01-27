'use client'

import { useState } from 'react'
import type { Szene, StueckRolle, SzeneRolle } from '@/lib/supabase/types'
import { addRolleToSzene, removeRolleFromSzene } from '@/lib/actions/stuecke'
import { RollenTypBadge } from './StatusBadge'

interface SzenenRollenMatrixProps {
  szenen: Szene[]
  rollen: StueckRolle[]
  szenenRollen: SzeneRolle[]
  canEdit: boolean
}

export function SzenenRollenMatrix({
  szenen,
  rollen,
  szenenRollen,
  canEdit,
}: SzenenRollenMatrixProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create a Set for quick lookup
  const assignmentSet = new Set(
    szenenRollen.map((sr) => `${sr.szene_id}-${sr.rolle_id}`)
  )

  const isAssigned = (szeneId: string, rolleId: string) => {
    return assignmentSet.has(`${szeneId}-${rolleId}`)
  }

  const toggleAssignment = async (szeneId: string, rolleId: string) => {
    if (!canEdit || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (isAssigned(szeneId, rolleId)) {
        await removeRolleFromSzene(szeneId, rolleId)
      } else {
        await addRolleToSzene({
          szene_id: szeneId,
          rolle_id: rolleId,
          notizen: null,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (szenen.length === 0 || rollen.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-center text-gray-500 shadow">
        {szenen.length === 0 && rollen.length === 0
          ? 'Erstelle zuerst Szenen und Rollen, um die Matrix zu sehen.'
          : szenen.length === 0
            ? 'Erstelle zuerst Szenen, um die Matrix zu sehen.'
            : 'Erstelle zuerst Rollen, um die Matrix zu sehen.'}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Szenen-Rollen-Matrix
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {canEdit
            ? 'Klicke auf eine Zelle, um zuzuordnen/zu entfernen'
            : 'Übersicht der Rollenzuordnung pro Szene'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Rolle
              </th>
              {szenen.map((szene) => (
                <th
                  key={szene.id}
                  className="min-w-[80px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <span className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                      {szene.nummer}
                    </span>
                    <span className="max-w-[70px] truncate text-[10px] font-normal normal-case">
                      {szene.titel}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rollen.map((rolle) => {
              const rolleCount = szenen.filter((s) =>
                isAssigned(s.id, rolle.id)
              ).length

              return (
                <tr key={rolle.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {rolle.name}
                      </span>
                      <RollenTypBadge typ={rolle.typ} />
                    </div>
                  </td>
                  {szenen.map((szene) => {
                    const assigned = isAssigned(szene.id, rolle.id)
                    return (
                      <td key={szene.id} className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleAssignment(szene.id, rolle.id)}
                          disabled={!canEdit || isSubmitting}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                            assigned
                              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          } ${!canEdit ? 'cursor-default' : 'cursor-pointer'}`}
                          title={
                            assigned
                              ? `${rolle.name} aus Szene ${szene.nummer} entfernen`
                              : `${rolle.name} zu Szene ${szene.nummer} hinzufügen`
                          }
                        >
                          {assigned ? (
                            <svg
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span className="text-xs">-</span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-700">
                      {rolleCount}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                Total Rollen
              </td>
              {szenen.map((szene) => {
                const szeneCount = rollen.filter((r) =>
                  isAssigned(szene.id, r.id)
                ).length
                return (
                  <td key={szene.id} className="px-3 py-3 text-center">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm font-medium text-gray-700">
                      {szeneCount}
                    </span>
                  </td>
                )
              })}
              <td className="px-4 py-3 text-center">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-sm font-medium text-primary-700">
                  {szenenRollen.length}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
