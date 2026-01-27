import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import {
  getStueck,
  getSzenen,
  getRollen,
  getSzenenRollen,
} from '@/lib/actions/stuecke'
import { getUserProfile } from '@/lib/supabase/server'
import { canEdit as checkCanEdit } from '@/lib/supabase/auth-helpers'
import {
  StatusBadge,
  SzenenList,
  RollenList,
  SzenenRollenMatrix,
} from '@/components/stuecke'

interface StueckDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function StueckDetailPage({
  params,
}: StueckDetailPageProps) {
  const { id } = await params
  const [stueck, szenen, rollen, szenenRollen, profile] = await Promise.all([
    getStueck(id),
    getSzenen(id),
    getRollen(id),
    getSzenenRollen(id),
    getUserProfile(),
  ])

  if (!stueck) {
    notFound()
  }

  const canEdit = profile ? checkCanEdit(profile.role) : false

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={'/stuecke' as Route}
            className="text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zur Übersicht
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {stueck.titel}
                </h1>
                <StatusBadge status={stueck.status} />
              </div>
              {stueck.autor && (
                <p className="text-gray-600">von {stueck.autor}</p>
              )}
              {stueck.beschreibung && (
                <p className="mt-2 text-gray-500">{stueck.beschreibung}</p>
              )}
              {stueck.premiere_datum && (
                <p className="mt-3 text-sm text-gray-500">
                  <span className="font-medium">Premiere:</span>{' '}
                  {formatDate(stueck.premiere_datum)}
                </p>
              )}
            </div>
            {canEdit && (
              <Link
                href={`/stuecke/${id}/bearbeiten` as Route}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Bearbeiten
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 flex gap-6 border-t border-gray-200 pt-6">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {szenen.length}
              </span>
              <span className="ml-2 text-gray-500">Szenen</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {rollen.length}
              </span>
              <span className="ml-2 text-gray-500">Rollen</span>
            </div>
          </div>
        </div>

        {/* Szenen-Rollen-Matrix */}
        <div className="mb-6">
          <SzenenRollenMatrix
            szenen={szenen}
            rollen={rollen}
            szenenRollen={szenenRollen}
            canEdit={canEdit}
          />
        </div>

        {/* Szenen und Rollen nebeneinander */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SzenenList stueckId={id} szenen={szenen} canEdit={canEdit} />
          <RollenList stueckId={id} rollen={rollen} canEdit={canEdit} />
        </div>
      </div>
    </main>
  )
}
